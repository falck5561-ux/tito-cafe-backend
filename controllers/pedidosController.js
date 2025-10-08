// Archivo: controllers/pedidosController.js (Completo y Mejorado)
const db = require('../config/db');

exports.crearPedido = async (req, res) => {
  const { total, productos } = req.body;
  const id_cliente = req.user.id; 

  if (!total || !productos || productos.length === 0) {
    return res.status(400).json({ msg: 'El pedido no puede estar vacío.' });
  }

  try {
    await db.query('BEGIN');
    const pedidoQuery = 'INSERT INTO pedidos (total, id_cliente) VALUES ($1, $2) RETURNING id';
    const pedidoResult = await db.query(pedidoQuery, [total, id_cliente]);
    const nuevoPedidoId = pedidoResult.rows[0].id;
    for (const producto of productos) {
      const detalleQuery = 'INSERT INTO detalles_pedido (id_pedido, id_producto, cantidad, precio_unidad) VALUES ($1, $2, $3, $4)';
      await db.query(detalleQuery, [nuevoPedidoId, producto.id, 1, producto.precio]);
    }
    await db.query('COMMIT');
    res.status(201).json({ msg: 'Pedido realizado con éxito', pedidoId: nuevoPedidoId });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send('Error del Servidor al realizar el pedido');
  }
};

// --- FUNCIÓN MEJORADA ---
// Ahora esta función también devuelve la lista de productos de cada pedido.
exports.obtenerPedidos = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id, p.fecha, p.total, p.estado, u.nombre as nombre_cliente,
        (
          SELECT json_agg(json_build_object('nombre', pr.nombre, 'cantidad', dp.cantidad, 'precio', dp.precio_unidad))
          FROM detalles_pedido dp
          JOIN productos pr ON dp.id_producto = pr.id
          WHERE dp.id_pedido = p.id
        ) as productos
      FROM pedidos p
      JOIN usuarios u ON p.id_cliente = u.id
      ORDER BY p.fecha DESC;
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
};

exports.actualizarEstadoPedido = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  if (!estado) {
    return res.status(400).json({ msg: 'El nuevo estado es requerido.' });
  }
  try {
    const query = 'UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING *';
    const result = await db.query(query, [estado, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Pedido no encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
};

exports.obtenerMisPedidos = async (req, res) => {
  try {
    const id_cliente = req.user.id;
    const query = `
      SELECT p.id, p.fecha, p.total, p.estado
      FROM pedidos p
      WHERE p.id_cliente = $1
      ORDER BY p.fecha DESC;
    `;
    const result = await db.query(query, [id_cliente]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
};