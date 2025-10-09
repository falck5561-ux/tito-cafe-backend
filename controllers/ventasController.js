// Archivo: controllers/ventasController.js (Versión Final y Completa)

const db = require('../config/db');

// Crear una nueva venta (para el POS)
exports.crearVenta = async (req, res) => {
  const { total, metodo_pago, productos } = req.body;
  const id_empleado = req.user.id; 

  if (!total || !metodo_pago || !productos || productos.length === 0) {
    return res.status(400).json({ msg: 'Todos los campos son requeridos' });
  }

  try {
    await db.query('BEGIN');
    const ventaQuery = 'INSERT INTO ventas (total, metodo_pago, id_empleado) VALUES ($1, $2, $3) RETURNING id';
    const ventaResult = await db.query(ventaQuery, [total, metodo_pago, id_empleado]);
    const nuevaVentaId = ventaResult.rows[0].id;

    for (const producto of productos) {
      const detalleQuery = 'INSERT INTO detalles_venta (id_venta, id_producto, cantidad, precio_unidad) VALUES ($1, $2, $3, $4)';
      await db.query(detalleQuery, [nuevaVentaId, producto.id, 1, producto.precio]);
    }

    await db.query('COMMIT');
    res.status(201).json({ msg: 'Venta registrada con éxito', ventaId: nuevaVentaId });

  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send('Error del Servidor al registrar la venta');
  }
};

// Obtener un reporte de ventas general (para el Jefe)
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

// Obtener un reporte de ventas por producto (para el Jefe)
exports.obtenerReportePorProducto = async (req, res) => {
  const { inicio, fin } = req.query;
  if (!inicio || !fin) {
    return res.status(400).json({ msg: 'Las fechas de inicio y fin son requeridas.' });
  }
  try {
    const reporteQuery = `
      SELECT pr.id, pr.nombre, SUM(dp.cantidad) as unidades_vendidas,
        SUM(dp.cantidad * dp.precio_unidad) as ingreso_total
      FROM detalles_venta dp
      JOIN productos pr ON dp.id_producto = pr.id
      JOIN ventas v ON dp.id_venta = v.id
      WHERE v.fecha BETWEEN $1 AND $2
      GROUP BY pr.id, pr.nombre ORDER BY ingreso_total DESC;
    `;
    const result = await db.query(reporteQuery, [inicio, fin]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor al generar el reporte detallado');
  }
};

// Obtener las ventas del POS realizadas por el empleado logueado
exports.obtenerMisVentas = async (req, res) => {
  try {
    const id_empleado = req.user.id;
    const query = `
      SELECT * FROM ventas 
      WHERE id_empleado = $1 AND DATE(fecha) = CURRENT_DATE 
      ORDER BY fecha DESC;
    `;
    const result = await db.query(query, [id_empleado]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
};

// --- FUNCIÓN CORRECTA PARA LA PESTAÑA "VENTAS DEL DÍA" ---
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