const db = require('../config/db');

// --- FUNCIÓN 'crearVenta' SIMPLIFICADA Y CORREGIDA ---
exports.crearVenta = async (req, res) => {
  // AHORA: Ya no necesitamos separar 'productos' y 'combos'. El carrito puede enviar todo junto.
  const { total, metodo_pago, items, clienteId, recompensaUsadaId } = req.body;
  const id_empleado = req.user.id;

  if (!items || items.length === 0) {
    return res.status(400).json({ msg: 'El ticket de venta no puede estar vacío.' });
  }

  try {
    await db.query('BEGIN');

    const ventaQuery = 'INSERT INTO ventas (total, metodo_pago, id_empleado, cliente_id) VALUES ($1, $2, $3, $4) RETURNING id';
    const ventaResult = await db.query(ventaQuery, [total, metodo_pago, id_empleado, clienteId]);
    const nuevaVentaId = ventaResult.rows[0].id;

    // --- LÓGICA UNIFICADA ---
    // Tratamos a los productos y combos exactamente igual, ya que ambos están en la tabla 'productos'.
    // Esto simplifica el código y asegura que los reportes sean correctos.
    for (const item of items) {
      const detalleQuery = 'INSERT INTO detalles_venta (id_venta, id_producto, cantidad, precio_unidad) VALUES ($1, $2, $3, $4)';
      // Usamos el ID y precio del item (sea producto o combo) directamente.
      await db.query(detalleQuery, [nuevaVentaId, item.id, item.cantidad, item.precio]);
    }

    // La lógica de recompensas se mantiene intacta
    if (clienteId && recompensaUsadaId) {
      const recompensaQuery = 'INSERT INTO usuarios_recompensas (usuario_id, recompensa_id, venta_id) VALUES ($1, $2, $3);';
      await db.query(recompensaQuery, [clienteId, recompensaUsadaId, nuevaVentaId]);
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
  const { inicio, fin } = req.query;
  
  // Nota para el Frontend: Las fechas deben llegar en formato 'YYYY-MM-DD'.
  if (!inicio || !fin) {
    return res.status(400).json({ msg: 'Las fechas de inicio y fin son requeridas (formato YYYY-MM-DD).' });
  }

  try {
    // Esta consulta ahora funciona para productos y combos por igual.
    const reporteQuery = `
      SELECT 
        pr.id, 
        pr.nombre, 
        SUM(dv.cantidad) as unidades_vendidas,
        SUM(dv.cantidad * dv.precio_unidad) as ingreso_total
      FROM detalles_venta dv
      JOIN productos pr ON dv.id_producto = pr.id
      JOIN ventas v ON dv.id_venta = v.id
      WHERE v.fecha::date BETWEEN $1 AND $2
      GROUP BY pr.id, pr.nombre 
      ORDER BY ingreso_total DESC;
    `;
    const result = await db.query(reporteQuery, [inicio, fin]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error al generar reporte detallado:", err.message);
    // Añadimos un mensaje de error más específico para ayudar a depurar.
    res.status(500).send('Error del Servidor. Verifica que las fechas estén en formato YYYY-MM-DD.');
  }
};

// --- OTRAS FUNCIONES (sin cambios) ---

exports.obtenerReporteVentas = async (req, res) => {
  try {
    const reporteQuery = `
      SELECT DATE(fecha) as dia, SUM(total) as total_ventas 
      FROM ventas GROUP BY DATE(fecha) ORDER BY dia ASC;
    `;
    const result = await db.query(reporteQuery);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor al generar el reporte');
  }
};

exports.obtenerVentasDelDia = async (req, res) => {
  try {
    const query = `
      SELECT v.id, v.fecha, v.total, v.metodo_pago, u.nombre as nombre_empleado
      FROM ventas v
      JOIN usuarios u ON v.id_empleado = u.id
      WHERE DATE(v.fecha) = CURRENT_DATE
      ORDER BY v.fecha DESC;
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
};