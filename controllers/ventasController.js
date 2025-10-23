// Archivo: controllers/ventasController.js

const db = require('../config/db');

// --- FUNCIÓN 'crearVenta' SIMPLIFICADA Y CORREGIDA ---
exports.crearVenta = async (req, res) => {
  const { tiendaId } = req; // <--- MODIFICADO (Obtenemos el ID de la tienda)
  
  const { total, metodo_pago, items, clienteId, recompensaUsadaId } = req.body;
  const id_empleado = req.user.id; // Asumimos que el empleado también está autenticado

  if (!items || items.length === 0) {
    return res.status(400).json({ msg: 'El ticket de venta no puede estar vacío.' });
  }

  try {
    await db.query('BEGIN');

    // <--- MODIFICADO (Añadimos tienda_id y $5)
    const ventaQuery = `
      INSERT INTO ventas (total, metodo_pago, id_empleado, cliente_id, tienda_id) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id
    `;
    const ventaValues = [total, metodo_pago, id_empleado, clienteId, tiendaId]; // <--- MODIFICADO
    
    const ventaResult = await db.query(ventaQuery, ventaValues);
    const nuevaVentaId = ventaResult.rows[0].id;

    // --- LÓGICA UNIFICADA (Sin cambios, ya que depende de nuevaVentaId) ---
    for (const item of items) {
      const detalleQuery = 'INSERT INTO detalles_venta (id_venta, id_producto, cantidad, precio_unidad) VALUES ($1, $2, $3, $4)';
      await db.query(detalleQuery, [nuevaVentaId, item.id, item.cantidad, item.precio]);
    }

    // --- LÓGICA DE RECOMPENSAS (Añadimos tienda_id) ---
    if (clienteId && recompensaUsadaId) {
      // <--- MODIFICADO (Añadimos tienda_id y $4)
      const recompensaQuery = `
        INSERT INTO usuarios_recompensas (usuario_id, recompensa_id, venta_id, tienda_id) 
        VALUES ($1, $2, $3, $4);
      `;
      // <--- MODIFICADO (Pasamos el tiendaId)
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

// --- FUNCIÓN 'obtenerReportePorProducto' CORREGIDA ---
exports.obtenerReportePorProducto = async (req, res) => {
  const { tiendaId } = req; // <--- MODIFICADO (Obtenemos el ID de la tienda)
  const { inicio, fin } = req.query;
  
  if (!inicio || !fin) {
    return res.status(400).json({ msg: 'Las fechas de inicio y fin son requeridas (formato YYYY-MM-DD).' });
  }

  try {
    const reporteQuery = `
      SELECT 
        pr.id, 
        pr.nombre, 
        SUM(dv.cantidad) as unidades_vendidas,
        SUM(dv.cantidad * dv.precio_unidad) as ingreso_total
      FROM detalles_venta dv
      JOIN productos pr ON dv.id_producto = pr.id
      JOIN ventas v ON dv.id_venta = v.id
      WHERE v.fecha::date BETWEEN $1 AND $2 AND v.tienda_id = $3 -- <--- MODIFICADO
      GROUP BY pr.id, pr.nombre 
      ORDER BY ingreso_total DESC;
    `;
    // <--- MODIFICADO (Pasamos el tiendaId)
    const result = await db.query(reporteQuery, [inicio, fin, tiendaId]); 
    res.json(result.rows);
  } catch (err) {
    console.error("Error al generar reporte detallado:", err.message);
    res.status(500).send('Error del Servidor. Verifica que las fechas estén en formato YYYY-MM-DD.');
  }
};

// --- OTRAS FUNCIONES (Con cambios) ---

exports.obtenerReporteVentas = async (req, res) => {
  const { tiendaId } = req; // <--- MODIFICADO (Obtenemos el ID de la tienda)

  try {
    const reporteQuery = `
      SELECT DATE(fecha) as dia, SUM(total) as total_ventas 
      FROM ventas 
      WHERE tienda_id = $1 -- <--- MODIFICADO
      GROUP BY DATE(fecha) 
      ORDER BY dia ASC;
    `;
    // <--- MODIFICADO (Pasamos el tiendaId)
    const result = await db.query(reporteQuery, [tiendaId]); 
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor al generar el reporte');
  }
};

exports.obtenerVentasDelDia = async (req, res) => {
  const { tiendaId } = req; // <--- MODIFICADO (Obtenemos el ID de la tienda)

  try {
    const query = `
      SELECT v.id, v.fecha, v.total, v.metodo_pago, u.nombre as nombre_empleado
      FROM ventas v
      JOIN usuarios u ON v.id_empleado = u.id
      WHERE DATE(v.fecha) = CURRENT_DATE AND v.tienda_id = $1 -- <--- MODIFICADO
      ORDER BY v.fecha DESC;
    `;
    // <--- MODIFICADO (Pasamos el tiendaId)
    const result = await db.query(query, [tiendaId]); 
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
};