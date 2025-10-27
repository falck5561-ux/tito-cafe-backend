// Archivo: controllers/ventasController.js (Versión Completa y Corregida)

const db = require('../config/db');

// --- FUNCIÓN 'crearVenta' (Sin cambios, para el POS) ---
exports.crearVenta = async (req, res) => {
  const { tiendaId } = req;
  const { total, metodo_pago, items, clienteId, recompensaUsadaId } = req.body;
  const id_empleado = req.user.id;

  if (!items || items.length === 0) {
    return res.status(400).json({ msg: 'El ticket de venta no puede estar vacío.' });
  }

  try {
    await db.query('BEGIN');

    const ventaQuery = `
      INSERT INTO ventas (total, metodo_pago, id_empleado, cliente_id, tienda_id) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id
    `;
    const ventaValues = [total, metodo_pago, id_empleado, clienteId, tiendaId];
    
    const ventaResult = await db.query(ventaQuery, ventaValues);
    const nuevaVentaId = ventaResult.rows[0].id;

    for (const item of items) {
      const detalleQuery = 'INSERT INTO detalles_venta (id_venta, id_producto, cantidad, precio_unidad) VALUES ($1, $2, $3, $4)';
      await db.query(detalleQuery, [nuevaVentaId, item.id, item.cantidad, item.precio]);
    }

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

// --- FUNCIÓN 'obtenerReportePorProducto' (MODIFICADA CON UNION) ---
exports.obtenerReportePorProducto = async (req, res) => {
  const { tiendaId } = req;
  const { inicio, fin } = req.query;
  
  if (!inicio || !fin) {
    return res.status(400).json({ msg: 'Las fechas de inicio y fin son requeridas (formato YYYY-MM-DD).' });
  }

  try {
    // Esta consulta ahora une los resultados de 'detalles_venta' (POS)
    // y 'detalles_pedido' (Online)
    const reporteQuery = `
      SELECT
        id,
        nombre,
        SUM(unidades_vendidas) as unidades_vendidas,
        SUM(ingreso_total) as ingreso_total
      FROM (
        
        -- Query 1: Ventas del POS
        SELECT 
          pr.id, 
          pr.nombre, 
          SUM(dv.cantidad) as unidades_vendidas,
          SUM(dv.cantidad * dv.precio_unidad) as ingreso_total
        FROM detalles_venta dv
        JOIN productos pr ON dv.id_producto = pr.id
        JOIN ventas v ON dv.id_venta = v.id
        WHERE v.fecha::date BETWEEN $1 AND $2 AND v.tienda_id = $3
        GROUP BY pr.id, pr.nombre
        
        UNION ALL
        
        -- Query 2: Pedidos en Línea
        SELECT 
          pr.id, 
          pr.nombre, 
          SUM(dp.cantidad) as unidades_vendidas,
          SUM(dp.cantidad * dp.precio_unidad) as ingreso_total
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
    console.error("Error al generar reporte detallado:", err.message);
    res.status(500).send('Error del Servidor. Verifica que las fechas estén en formato YYYY-MM-DD.');
  }
};

// --- FUNCIÓN 'obtenerReporteVentas' (MODIFICADA CON UNION) ---
exports.obtenerReporteVentas = async (req, res) => {
  const { tiendaId } = req; 

  try {
    // Esta consulta ahora une los totales de 'ventas' (POS) y 'pedidos' (Online)
    const reporteQuery = `
      SELECT
        dia,
        SUM(total_ventas) as total_ventas
      FROM (
        
        -- Query 1: Ventas (POS)
        SELECT DATE(fecha) as dia, SUM(total) as total_ventas 
        FROM ventas 
        WHERE tienda_id = $1
        GROUP BY DATE(fecha)
        
        UNION ALL
        
        -- Query 2: Pedidos (Online)
        SELECT DATE(fecha) as dia, SUM(total) as total_ventas 
        FROM pedidos 
        WHERE tienda_id = $1
        GROUP BY DATE(fecha)

      ) AS combined_ventas
      GROUP BY dia
      ORDER BY dia ASC;
    `;
    
    const result = await db.query(reporteQuery, [tiendaId]); 
    res.json(result.rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor al generar el reporte');
  }
};

// --- FUNCIÓN 'obtenerVentasDelDia' (Sin cambios) ---
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
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
};