// Archivo: controllers/pedidosController.js (Versión Final Corregida)

const db = require('../config/db');
const axios = require('axios');

//=================================================================
// CREAR UN NUEVO PEDIDO
//=================================================================
exports.crearPedido = async (req, res) => {
  const { 
    total, 
    productos, 
    tipo_orden, 
    direccion_entrega, 
    costo_envio,
    latitude,
    longitude
  } = req.body;
  
  const id_cliente = req.user.id; 

  if (!total || !productos || productos.length === 0 || !tipo_orden) {
    return res.status(400).json({ msg: 'Faltan datos para crear el pedido.' });
  }

  if (tipo_orden === 'domicilio' && (!direccion_entrega || !latitude || !longitude)) {
    return res.status(400).json({ msg: 'La dirección y coordenadas son obligatorias para la entrega a domicilio.' });
  }

  try {
    await db.query('BEGIN');
    
    const pedidoQuery = `
      INSERT INTO pedidos (total, id_cliente, tipo_orden, direccion_entrega, costo_envio, latitude, longitude) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
    `;
    
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
    
    res.status(201).json({ 
      msg: 'Pedido realizado con éxito', 
      pedidoId: nuevoPedidoId,
      recompensaGenerada
    });

  } catch (err) {
    await db.query('ROLLBACK');
    console.error("Error en crearPedido:", err.message);
    res.status(500).send('Error del Servidor al realizar el pedido');
  }
};

//=================================================================
// OBTENER TODOS LOS PEDIDOS (PARA EMPLEADOS)
//=================================================================
exports.obtenerPedidos = async (req, res) => {
  console.log("==> INICIANDO FUNCIÓN: obtenerPedidos (para empleados)");
  try {
    const query = `
      SELECT 
        p.id, p.fecha, p.total, p.estado, p.tipo_orden, u.nombre as nombre_cliente,
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
    console.log("--> A punto de consultar la base de datos por todos los pedidos...");
    const result = await db.query(query);
    console.log(`<-- Consulta de todos los pedidos finalizada. Se encontraron ${result.rows.length} pedidos.`);
    res.json(result.rows);
  } catch (err) {
    console.error("XXX ¡ERROR en obtenerPedidos!:", err.message);
    res.status(500).send('Error del Servidor al obtener pedidos');
  }
};

//=================================================================
// OBTENER PEDIDOS DE UN CLIENTE ESPECÍFICO
//=================================================================
exports.obtenerMisPedidos = async (req, res) => {
  console.log("==> INICIANDO FUNCIÓN: obtenerMisPedidos (para clientes)");
  try {
    const id_cliente = req.user.id;
    console.log(`--> Buscando pedidos para el cliente con ID: ${id_cliente}`);
    const query = `
      SELECT p.id, p.fecha, p.total, p.estado, p.tipo_orden
      FROM pedidos p
      WHERE p.id_cliente = $1
      ORDER BY p.fecha DESC;
    `;
    console.log("--> A punto de consultar la base de datos para los pedidos del cliente...");
    const result = await db.query(query, [id_cliente]);
    console.log(`<-- Consulta de mis-pedidos finalizada. Se encontraron ${result.rows.length} pedidos.`);
    res.json(result.rows);
  } catch (err) {
    console.error(`XXX ¡ERROR en obtenerMisPedidos para el cliente ${id_cliente}!`, err.message);
    res.status(500).send('Error del Servidor al obtener tus pedidos');
  }
};

//=================================================================
// ACTUALIZAR EL ESTADO DE UN PEDIDO
//=================================================================
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
    console.error("Error en actualizarEstadoPedido:", err.message);
    res.status(500).send('Error del Servidor');
  }
};

//=================================================================
// CALCULAR COSTO DE ENVÍO
//=================================================================
exports.calcularCostoEnvio = async (req, res) => {
  const { lat, lng } = req.body;
  const originLat = process.env.STORE_LATITUDE;
  const originLng = process.env.STORE_LONGITUDE;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY_BACKEND;

  if (!lat || !lng) {
    return res.status(400).json({ msg: 'Faltan coordenadas en la petición.' });
  }
  if (!originLat || !originLng || !apiKey) {
    console.error("Error de configuración: Faltan variables de entorno para el cálculo de envío.");
    return res.status(500).json({ msg: 'Error de configuración del servidor.' });
  }

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${lat},${lng}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    const element = response.data?.rows?.[0]?.elements?.[0];

    if (!element || element.status === 'ZERO_RESULTS' || element.status === 'NOT_FOUND') {
      return res.status(404).json({ msg: 'Ubicación fuera del área de entrega o no se encontró una ruta.' });
    }
    if (!element.distance?.value) {
      return res.status(500).json({ msg: 'No se pudo obtener la distancia de la ubicación.' });
    }
    
    const distanceInKm = element.distance.value / 1000;
    const costPerKm = parseFloat(process.env.COSTO_POR_KM) || 10; // Usamos la variable de entorno, con 10 como respaldo.
    const deliveryCost = 20 + (distanceInKm * costPerKm); // Tarifa base de $20

    res.json({ deliveryCost: Math.ceil(deliveryCost) });

  } catch (error) {
    console.error("Error CRÍTICO al llamar a la API de Google Maps:", error.response ? error.response.data : error.message);
    res.status(500).json({ msg: 'No se pudo calcular el costo de envío.' });
  }
};