// controllers/pedidosController.js

const db = require('../config/db');
const axios = require('axios');

//=================================================================
// CREAR UN NUEVO PEDIDO (VERSIÓN CORREGIDA Y ROBUSTA)
//=================================================================
exports.crearPedido = async (req, res) => {
  const {
    total,
    productos,
    tipo_orden,
    direccion_entrega,
    costo_envio,
    latitude,
    longitude,
    referencia
  } = req.body;

  // Asegurarse de que el usuario esté autenticado
  if (!req.user || !req.user.id) {
    return res.status(401).json({ msg: 'Usuario no autenticado.' });
  }
  const id_cliente = req.user.id;

  // Validaciones básicas de la solicitud
  if (!total || !productos || !Array.isArray(productos) || productos.length === 0 || !tipo_orden) {
    return res.status(400).json({ msg: 'Faltan datos críticos para crear el pedido (total, productos, tipo_orden).' });
  }

  // Validación específica para pedidos a domicilio
  if (tipo_orden === 'domicilio' && (!direccion_entrega || latitude === undefined || longitude === undefined)) {
    return res.status(400).json({ msg: 'La dirección y coordenadas son obligatorias para la entrega a domicilio.' });
  }

  // ========================== MEJORA #1 (Prevención de Error) ==========================
  // Validar que cada producto en el array tenga toda la información necesaria.
  const productosSonValidos = productos.every(p =>
    p && p.id !== undefined && p.cantidad !== undefined && p.precio !== undefined
  );

  if (!productosSonValidos) {
    return res.status(400).json({ msg: 'Uno o más productos en el pedido tienen datos incompletos (falta id, cantidad o precio).' });
  }
  // ==================================================================================

  try {
    // Iniciar transacción
    await db.query('BEGIN');

    const pedidoQuery = 'INSERT INTO pedidos (total, id_cliente, tipo_orden, direccion_entrega, costo_envio, latitude, longitude, referencia) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id';
    
    // ========================== MEJORA #2 (Prevención de Error) ==========================
    // Asignar `null` a los valores opcionales si vienen como `undefined` o `null`.
    // Esto evita errores de "NOT NULL constraint" en la base de datos.
    const pedidoValues = [
      total,
      id_cliente,
      tipo_orden,
      direccion_entrega || null,
      costo_envio || null,
      latitude || null,
      longitude || null,
      referencia || null
    ];
    // ==================================================================================

    const pedidoResult = await db.query(pedidoQuery, pedidoValues);
    const nuevoPedidoId = pedidoResult.rows[0].id;

    // Insertar los detalles del pedido (productos)
    for (const producto of productos) {
      const detalleQuery = 'INSERT INTO detalles_pedido (id_pedido, id_producto, cantidad, precio_unidad) VALUES ($1, $2, $3, $4)';
      await db.query(detalleQuery, [nuevoPedidoId, producto.id, producto.cantidad, producto.precio]);
    }

    // Lógica para generar recompensas
    let recompensaGenerada = false;
    // ========================== CORRECCIÓN DEL ERROR ==========================
    const countQuery = 'SELECT COUNT(*) FROM pedidos WHERE id_cliente = $1';
    const countResult = await db.query(countQuery, [id_cliente]);
    const totalPedidos = parseInt(countResult.rows[0].count, 10);
   
    // Se inserta una recompensa si es la 10ª compra (múltiplo de 10)
    if (totalPedidos > 0 && totalPedidos % 10 === 0) {
      const nombreRecompensa = `¡Felicidades! Tienes un café o frappe gratis por tus ${totalPedidos} compras.`;
      const recompensaQuery = 'INSERT INTO recompensas (id_cliente, nombre) VALUES ($1, $2)';
      await db.query(recompensaQuery, [id_cliente, nombreRecompensa]);
      recompensaGenerada = true;
    }
    // ===========================================================================

    // Confirmar la transacción si todo salió bien
    await db.query('COMMIT');

    res.status(201).json({
      msg: 'Pedido realizado con éxito',
      pedidoId: nuevoPedidoId,
      recompensaGenerada
    });

  } catch (err) {
    // Revertir la transacción en caso de cualquier error
    await db.query('ROLLBACK');
    console.error("Error en crearPedido:", err.message, err.stack); // Log para depuración en el servidor
    res.status(500).send('Error del Servidor al realizar el pedido');
  }
};

//=================================================================
// OBTENER TODOS LOS PEDIDOS (PARA EMPLEADOS)
//=================================================================
exports.obtenerPedidos = async (req, res) => {
  try {
    const query = `
      SELECT
        p.id, p.fecha, p.total, p.estado, p.tipo_orden, p.direccion_entrega,
        p.latitude, p.longitude, p.referencia,
        COALESCE(u.nombre, 'Usuario Eliminado') as nombre_cliente,
        (
          SELECT json_agg(json_build_object('nombre', pr.nombre, 'cantidad', dp.cantidad, 'precio', dp.precio_unidad))
          FROM detalles_pedido dp
          JOIN productos pr ON dp.id_producto = pr.id
          WHERE dp.id_pedido = p.id
        ) as productos
      FROM pedidos p
      LEFT JOIN usuarios u ON p.id_cliente = u.id
      ORDER BY p.fecha DESC;
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error en obtenerPedidos:", err.message);
    res.status(500).send('Error del Servidor al obtener pedidos');
  }
};

//=================================================================
// OBTENER PEDIDOS DE UN CLIENTE ESPECÍFICO
//=================================================================
exports.obtenerMisPedidos = async (req, res) => {
  try {
    const id_cliente = req.user.id;
    const query = `
      SELECT
        p.id, p.fecha, p.total, p.estado, p.tipo_orden,
        (
          SELECT json_agg(json_build_object('nombre', pr.nombre, 'cantidad', dp.cantidad, 'precio', dp.precio_unidad))
          FROM detalles_pedido dp
          JOIN productos pr ON dp.id_producto = pr.id
          WHERE dp.id_pedido = p.id
        ) as productos
      FROM pedidos p
      WHERE p.id_cliente = $1
      ORDER BY p.fecha DESC;
    `;
    const result = await db.query(query, [id_cliente]);
    res.json(result.rows);
  } catch (err) {
    console.error(`Error en obtenerMisPedidos para el cliente ${req.user.id}:`, err.message);
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
    const costPerKm = parseFloat(process.env.COSTO_POR_KM) || 10;
    const deliveryCost = 20 + (distanceInKm * costPerKm);

    res.json({ deliveryCost: Math.ceil(deliveryCost) });

  } catch (error) {
    console.error("Error CRÍTICO al llamar a la API de Google Maps:", error.response ? error.response.data : error.message);
    res.status(500).json({ msg: 'No se pudo calcular el costo de envío.' });
  }
};

//=================================================================
// PURGAR TODOS LOS PEDIDOS (SOLO PARA JEFE)
//=================================================================
exports.purgarPedidos = async (req, res) => {
  try {
    await db.query('BEGIN');
    await db.query('DELETE FROM detalles_pedido');
    await db.query('DELETE FROM pedidos');
    await db.query("SELECT setval(pg_get_serial_sequence('pedidos', 'id'), 1, false);");
    await db.query('COMMIT');

    res.status(200).json({ msg: 'El historial de pedidos ha sido eliminado permanentemente.' });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error("Error en purgarPedidos:", err.message);
    res.status(500).send('Error del Servidor al intentar purgar los pedidos.');
  }
};