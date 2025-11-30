const db = require('../config/db');

// --- 1. CREAR VENTA (POS) ---
exports.crearVenta = async (req, res) => {
  const { tiendaId } = req;
  const { total, metodo_pago, items, clienteId, recompensaUsadaId } = req.body;
  const id_empleado = req.user.id;

  if (!items || items.length === 0) {
    return res.status(400).json({ msg: 'El ticket de venta no puede estar vacío.' });
  }

  try {
    await db.query('BEGIN');

    // Insertar Cabecera de Venta
    const ventaQuery = `
      INSERT INTO ventas (total, metodo_pago, id_empleado, cliente_id, tienda_id) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id
    `;
    const ventaValues = [total, metodo_pago, id_empleado, clienteId, tiendaId];
    const ventaResult = await db.query(ventaQuery, ventaValues);
    const nuevaVentaId = ventaResult.rows[0].id;

    // Insertar Detalles (Productos)
    for (const item of items) {
      // NOTA: Se eliminó 'opciones' si no existe en la BD. Si tu BD lo tiene, agrégalo.
      const detalleQuery = `
        INSERT INTO detalles_venta (id_venta, id_producto, cantidad, precio_unidad) 
        VALUES ($1, $2, $3, $4)
      `;
      await db.query(detalleQuery, [nuevaVentaId, item.id, item.cantidad, item.precio]);
    }

    // Insertar Recompensa si aplica
    if (clienteId && recompensaUsadaId) {
      const recompensaQuery = `
        INSERT INTO usuarios_recompensas (usuario_id, recompensa_id, venta_id, tienda_id) 
        VALUES ($1, $2, $3, $4);
      `;
      await db.query(recompensaQuery, [clienteId, recompensaUsadaId, nuevaVentaId, tiendaId]);
    }

    await db.query('COMMIT');
    res.status(201).json({ msg: 'Venta registrada con éxito', ventaId: nuevaVentaId });

  } catch (err) {
    await db.query('ROLLBACK');
    console.error("Error al registrar la venta:", err.message);
    res.status(500).send('Error del Servidor al registrar la venta');
  }
};

// --- 2. OBTENER VENTA POR ID (CORREGIDA - SIN ERRORES 500) ---
exports.obtenerVentaPorId = async (req, res) => {
  const { id } = req.params;
  
  try {
    // CORRECCIÓN 1: Usamos 'usuarios' en lugar de 'clientes' para el JOIN del cliente.
    const ventaQuery = `
      SELECT 
        v.id, v.total, v.fecha, v.metodo_pago, 
        u.nombre as nombre_empleado, 
        c.nombre as nombre_cliente
      FROM ventas v
      LEFT JOIN usuarios u ON v.id_empleado = u.id
      LEFT JOIN usuarios c ON v.cliente_id = c.id 
      WHERE v.id = $1
    `;
    const ventaResult = await db.query(ventaQuery, [id]);

    if (ventaResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Venta no encontrada' });
    }

    const venta = ventaResult.rows[0];

    // CORRECCIÓN 2: Eliminamos 'imagen_url' para evitar errores si la columna falta.
    const detallesQuery = `
      SELECT 
        dv.id_producto as id,
        p.nombre,
        dv.cantidad,
        dv.precio_unidad as precio,
        (dv.cantidad * dv.precio_unidad) as subtotal
      FROM detalles_venta dv
      JOIN productos p ON dv.id_producto = p.id
      WHERE dv.id_venta = $1
    `;
    const detallesResult = await db.query(detallesQuery, [id]);

    venta.items = detallesResult.rows;
    res.json(venta);

  } catch (err) {
    console.error("ERROR CRÍTICO al obtener venta:", err.message);
    // Devolvemos el mensaje de error para que lo veas en la consola del navegador si falla
    res.status(500).json({ msg: 'Error interno del servidor', error: err.message });
  }
};

// --- 3. REPORTE POR PRODUCTO ---
exports.obtenerReportePorProducto = async (req, res) => {
  const { tiendaId } = req;
  const { inicio, fin } = req.query;
  
  if (!inicio || !fin) {
    return res.status(400).json({ msg: 'Faltan fechas inicio/fin' });
  }

  try {
    const reporteQuery = `
      SELECT id, nombre, SUM(unidades_vendidas) as unidades_vendidas, SUM(ingreso_total) as ingreso_total
      FROM (
        SELECT pr.id, pr.nombre, SUM(dv.cantidad) as unidades_vendidas, SUM(dv.cantidad * dv.precio_unidad) as ingreso_total
        FROM detalles_venta dv
        JOIN productos pr ON dv.id_producto = pr.id
        JOIN ventas v ON dv.id_venta = v.id
        WHERE v.fecha::date BETWEEN $1 AND $2 AND v.tienda_id = $3
        GROUP BY pr.id, pr.nombre
        UNION ALL
        SELECT pr.id, pr.nombre, SUM(dp.cantidad) as unidades_vendidas, SUM(dp.cantidad * dp.precio_unidad) as ingreso_total
        FROM detalles_pedido dp
        JOIN productos pr ON dp.id_producto = pr.id
        JOIN pedidos p ON dp.id_pedido = p.id
        WHERE p.fecha::date BETWEEN $1 AND $2 AND p.tienda_id = $3
        GROUP BY pr.id, pr.nombre
      ) AS combined_results
      GROUP BY id, nombre 
      ORDER BY ingreso_total DESC;
    `;
    const result = await db.query(reporteQuery, [inicio, fin, tiendaId]); 
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al generar reporte');
  }
};

// --- 4. REPORTE DE VENTAS (TOTALES) ---
exports.obtenerReporteVentas = async (req, res) => {
  const { tiendaId } = req; 
  try {
    const reporteQuery = `
      SELECT dia, SUM(total_ventas) as total_ventas
      FROM (
        SELECT DATE(fecha) as dia, SUM(total) as total_ventas 
        FROM ventas WHERE tienda_id = $1 GROUP BY DATE(fecha)
        UNION ALL
        SELECT DATE(fecha) as dia, SUM(total) as total_ventas 
        FROM pedidos WHERE tienda_id = $1 GROUP BY DATE(fecha)
      ) AS combined_ventas
      GROUP BY dia ORDER BY dia ASC;
    `;
    const result = await db.query(reporteQuery, [tiendaId]); 
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error reporte ventas');
  }
};

// --- 5. VENTAS DEL DÍA ---
exports.obtenerVentasDelDia = async (req, res) => {
  const { tiendaId } = req;
  try {
    const query = `
      SELECT v.id, v.fecha, v.total, v.metodo_pago, u.nombre as nombre_empleado
      FROM ventas v
      JOIN usuarios u ON v.id_empleado = u.id
      WHERE DATE(v.fecha) = CURRENT_DATE AND v.tienda_id = $1
      ORDER BY v.fecha DESC;
    `;
    const result = await db.query(query, [tiendaId]); 
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error obteniendo ventas del día');
  }
};