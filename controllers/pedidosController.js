// Archivo: controllers/pedidosController.js (con depuración para el cálculo de costo)

const db = require('../config/db');
const axios = require('axios');

// --- Las otras funciones no cambian ---
exports.crearPedido = async (req, res) => {
  const { total, productos, tipo_orden, direccion_entrega, costo_envio, latitude, longitude } = req.body;
  const id_cliente = req.user.id;
  if (!total || !productos || productos.length === 0 || !tipo_orden) {
    return res.status(400).json({ msg: 'Faltan datos para crear el pedido.' });
  }
  if (tipo_orden === 'domicilio' && (!direccion_entrega || !latitude || !longitude)) {
    return res.status(400).json({ msg: 'La dirección y coordenadas son obligatorias.' });
  }
  try {
    await db.query('BEGIN');
    const pedidoQuery = `INSERT INTO pedidos (total, id_cliente, tipo_orden, direccion_entrega, costo_envio, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`;
    const pedidoValues = [total, id_cliente, tipo_orden, direccion_entrega, costo_envio, latitude, longitude];
    const pedidoResult = await db.query(pedidoQuery, pedidoValues);
    const nuevoPedidoId = pedidoResult.rows[0].id;
    for (const producto of productos) {
      const cantidad = producto.cantidad || 1;
      const detalleQuery = 'INSERT INTO detalles_pedido (id_pedido, id_producto, cantidad, precio_unidad) VALUES ($1, $2, $3, $4)';
      await db.query(detalleQuery, [nuevoPedidoId, producto.id, cantidad, producto.precio]);
    }
    let recompensaGenerada = false;
    const countQuery = 'SELECT COUNT(*) FROM pedidos WHERE id_cliente = $1';
    const countResult = await db.query(countQuery, [id_cliente]);
    const totalPedidos = parseInt(countResult.rows[0].count, 10);
    if (totalPedidos > 0 && totalPedidos % 10 === 0) {
      const descripcion = `¡Felicidades! Tienes un café o frappe gratis por tus ${totalPedidos} compras.`;
      const recompensaQuery = 'INSERT INTO recompensas (id_cliente, descripcion) VALUES ($1, $2)';
      await db.query(recompensaQuery, [id_cliente, descripcion]);
      recompensaGenerada = true;
    }
    await db.query('COMMIT');
    res.status(201).json({ msg: 'Pedido realizado con éxito', pedidoId: nuevoPedidoId, recompensaGenerada });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send('Error del Servidor al realizar el pedido');
  }
};
exports.obtenerPedidos = async (req, res) => { /* ... tu código original ... */ };
exports.actualizarEstadoPedido = async (req, res) => { /* ... tu código original ... */ };
exports.obtenerMisPedidos = async (req, res) => { /* ... tu código original ... */ };
// --- Fin de las otras funciones ---


// ===== ESTA ES LA FUNCIÓN QUE VAMOS A MEJORAR =====
exports.calcularCostoEnvio = async (req, res) => {
  const { lat, lng } = req.body;
  const originLat = process.env.STORE_LATITUDE;
  const originLng = process.env.STORE_LONGITUDE;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY_BACKEND;

  if (!lat || !lng || !originLat || !originLng || !apiKey) {
    return res.status(400).json({ msg: 'Faltan coordenadas o configuración del servidor.' });
  }

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${lat},${lng}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    
    // ===== NUEVO CÓDIGO DE DEPURACIÓN =====
    // Imprimimos la respuesta completa de Google en los logs para ver qué está pasando.
    console.log("====== RESPUESTA DE GOOGLE DISTANCE MATRIX API ======");
    console.log(JSON.stringify(response.data, null, 2));
    console.log("=====================================================");
    // =======================================

    // Revisamos si la respuesta tiene la estructura que esperamos
    if (!response.data?.rows?.[0]?.elements?.[0]) {
      console.error("Respuesta inesperada de Google:", response.data);
      return res.status(500).json({ msg: 'Hubo un error al procesar la respuesta de Google Maps.' });
    }

    const element = response.data.rows[0].elements[0];

    // Ahora la validación es más robusta para diferentes errores
    if (element.status === 'ZERO_RESULTS' || element.status === 'NOT_FOUND') {
      console.warn(`Google no encontró una ruta. Estado: ${element.status}`);
      return res.status(404).json({ msg: 'Ubicación fuera del área de entrega o no se encontró una ruta.' });
    }

    if (!element.distance?.value) {
        console.error("La respuesta de Google no contiene el valor de la distancia:", element);
        return res.status(500).json({ msg: 'No se pudo obtener la distancia de la ubicación.' });
    }
    
    const distanceInMeters = element.distance.value;
    const distanceInKm = distanceInMeters / 1000;

    // --- ¡AQUÍ DEFINES TUS PRECIOS! ---
    const baseFee = 20; // $20 MXN de tarifa base
    const feePerKm = 5; // $5 MXN por cada kilómetro
    const deliveryCost = baseFee + (distanceInKm * feePerKm);
    // ------------------------------------

    res.json({ deliveryCost: Math.ceil(deliveryCost) });

  } catch (error) {
    console.error("Error al calcular costo de envío:", error.response ? error.response.data : error.message);
    res.status(500).json({ msg: 'No se pudo calcular el costo de envío.' });
  }
};