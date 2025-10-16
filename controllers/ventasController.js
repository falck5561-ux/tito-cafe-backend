const db = require('../config/db');

// --- FUNCIÓN 'crearVenta' CORREGIDA Y MEJORADA ---
exports.crearVenta = async (req, res) => {
  const { total, metodo_pago, productos, combos, clienteId, recompensaUsadaId } = req.body;
  const id_empleado = req.user.id;

  if ((!productos || productos.length === 0) && (!combos || combos.length === 0)) {
    return res.status(400).json({ msg: 'El ticket de venta no puede estar vacío.' });
  }

  try {
    await db.query('BEGIN');

    const ventaQuery = 'INSERT INTO ventas (total, metodo_pago, id_empleado, cliente_id) VALUES ($1, $2, $3, $4) RETURNING id';
    const ventaResult = await db.query(ventaQuery, [total, metodo_pago, id_empleado, clienteId]);
    const nuevaVentaId = ventaResult.rows[0].id;

    // Insertar los productos individuales (esta lógica no cambia)
    if (productos && productos.length > 0) {
      for (const producto of productos) {
        const detalleQuery = 'INSERT INTO detalles_venta (id_venta, id_producto, cantidad, precio_unidad) VALUES ($1, $2, $3, $4)';
        await db.query(detalleQuery, [nuevaVentaId, producto.id, producto.cantidad, producto.precio]);
      }
    }

    // ANTES: Se guardaban los combos en una tabla separada 'detalles_venta_combos'.
    /*
     if (combos && combos.length > 0) {
         for (const combo of combos) {
           const detalleComboQuery = `
             INSERT INTO detalles_venta_combos (id_venta, id_combo, cantidad, precio_unidad) 
             VALUES ($1, $2, $3, $4)`;
           await db.query(detalleComboQuery, [nuevaVentaId, combo.id, combo.cantidad, combo.precio]);
         }
     }
    */

    // AHORA: Unificamos la lógica. "Explotamos" el combo para registrar sus productos
    // en la misma tabla 'detalles_venta', lo que simplifica todo y arregla los reportes.
    if (combos && combos.length > 0) {
        for (const comboVendido of combos) {
            // Buscamos los productos que componen el combo en la base de datos
            const productosDelComboQuery = 'SELECT id_producto, cantidad FROM combo_productos WHERE id_combo = $1';
            const { rows: productosEnCombo } = await db.query(productosDelComboQuery, [comboVendido.id]);

            // Por cada producto dentro del combo, lo insertamos en 'detalles_venta'
            for (const producto of productosEnCombo) {
                const precioItemEnCombo = 0; // El precio ya está incluido en el total de la venta
                const cantidadTotal = comboVendido.cantidad * producto.cantidad;

                const detalleQuery = 'INSERT INTO detalles_venta (id_venta, id_producto, cantidad, precio_unidad) VALUES ($1, $2, $3, $4)';
                await db.query(detalleQuery, [nuevaVentaId, producto.id_producto, cantidadTotal, precioItemEnCombo]);
            }
        }
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

// --- OTRAS FUNCIONES (NO REQUIEREN CAMBIOS) ---
// La función 'obtenerReportePorProducto' ahora funcionará correctamente de forma automática.

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