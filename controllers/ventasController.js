const db = require('../config/db');

// --- FUNCIÓN 'crearVenta' CORREGIDA Y COMPLETADA ---
exports.crearVenta = async (req, res) => {
  // Obtenemos los datos del frontend, incluyendo los nuevos IDs de recompensa
  const { total, metodo_pago, productos, clienteId, recompensaUsadaId } = req.body;
  const id_empleado = req.user.id; // El ID del empleado viene del token de autenticación

  if ((!total && total !== 0) || !metodo_pago || !productos || productos.length === 0) {
    return res.status(400).json({ msg: 'Todos los campos son requeridos' });
  }

  try {
    // Iniciamos una transacción para asegurar que todas las operaciones se completen
    await db.query('BEGIN');

    // 1. Insertamos la venta principal y obtenemos el ID de la nueva venta
    // Se añade 'cliente_id' para registrar qué cliente hizo la compra, si aplica.
    const ventaQuery = 'INSERT INTO ventas (total, metodo_pago, id_empleado, cliente_id) VALUES ($1, $2, $3, $4) RETURNING id';
    const ventaResult = await db.query(ventaQuery, [total, metodo_pago, id_empleado, clienteId]);
    const nuevaVentaId = ventaResult.rows[0].id;

    // 2. Insertamos cada producto del ticket en la tabla de detalles
    // CORRECCIÓN: Ahora se usa la cantidad correcta que viene del frontend
    for (const producto of productos) {
      const detalleQuery = 'INSERT INTO detalles_venta (id_venta, id_producto, cantidad, precio_unidad) VALUES ($1, $2, $3, $4)';
      // Usamos producto.precio, que ya viene con el descuento o en 0.00 si es recompensa
      await db.query(detalleQuery, [nuevaVentaId, producto.id, producto.cantidad, producto.precio]);
    }

    // 3. ¡PASO CLAVE! Si se usó una recompensa, la registramos como canjeada
    if (clienteId && recompensaUsadaId) {
      console.log(`[REWARDS] Registrando recompensa usada. Cliente ID: ${clienteId}, Recompensa ID: ${recompensaUsadaId}`);
      const recompensaQuery = `
          INSERT INTO usuarios_recompensas (usuario_id, recompensa_id, venta_id) 
          VALUES ($1, $2, $3);
      `;
      await db.query(recompensaQuery, [clienteId, recompensaUsadaId, nuevaVentaId]);
      console.log("[REWARDS] Recompensa registrada exitosamente.");
    }

    // Si todo salió bien, confirmamos los cambios en la base de datos
    await db.query('COMMIT');
    res.status(201).json({ msg: 'Venta registrada con éxito', ventaId: nuevaVentaId });

  } catch (err) {
    // Si algo falla, revertimos todos los cambios para no dejar datos corruptos
    await db.query('ROLLBACK');
    console.error("Error al registrar la venta:", err.message);
    res.status(500).send('Error del Servidor al registrar la venta');
  }
};

// --- OTRAS FUNCIONES (SE MANTIENEN IGUAL QUE LAS TUYAS) ---

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

// Obtener el reporte por producto
exports.obtenerReportePorProducto = async (req, res) => {
  const { inicio, fin } = req.query; 

  if (!inicio || !fin) {
    return res.status(400).json({ msg: 'Las fechas de inicio y fin son requeridas.' });
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
      WHERE v.fecha::date BETWEEN $1 AND $2
      GROUP BY pr.id, pr.nombre 
      ORDER BY ingreso_total DESC;
    `;
    const result = await db.query(reporteQuery, [inicio, fin]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor al generar el reporte detallado');
  }
};

// Obtener las ventas del día (para el POS)
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

