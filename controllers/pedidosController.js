const db = require('../config/db');
const axios = require('axios');

//=================================================================
// CREAR UN NUEVO PEDIDO
//=================================================================
exports.crearPedido = async (req, res) => {
  const { tiendaId } = req;
  const {
    total,
    productos,
    combos,
    tipo_orden,
    direccion_entrega,
    costo_envio,
    latitude,
    longitude,
    referencia,
    telefono
  } = req.body;

  if (!req.user || !req.user.id) {
    return res.status(401).json({ msg: 'Usuario no autenticado.' });
  }

  const id_cliente = req.user.id;

  if ((!productos || productos.length === 0) && (!combos || combos.length === 0)) {
    return res.status(400).json({ msg: 'El pedido no puede estar vacío.' });
  }

  if (tipo_orden === 'domicilio' && (!direccion_entrega || latitude === undefined || longitude === undefined)) {
    return res.status(400).json({ msg: 'La dirección y coordenadas son obligatorias para la entrega a domicilio.' });
  }

  try {
    await db.query('BEGIN');

    // --- CONSULTA INSERT (LIMPIA DE CARACTERES OCULTOS) ---
    const pedidoQuery = `
      INSERT INTO pedidos (total, id_cliente, tipo_orden, direccion_entrega, costo_envio, latitude, longitude, referencia, telefono, estado, fecha, tienda_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pendiente', NOW(), $10) 
      RETURNING id;
    `;
    
    // --- VALORES SINCRONIZADOS ---
    const pedidoValues = [
      total, 
      id_cliente, 
      tipo_orden, 
      direccion_entrega || null,
      costo_envio || 0, 
      latitude || null, 
      longitude || null, 
      referencia || null,
      telefono || null,
      tiendaId
    ];

    const pedidoResult = await db.query(pedidoQuery, pedidoValues);
    const nuevoPedidoId = pedidoResult.rows[0].id;

    // --- GUARDAR PRODUCTOS CON OPCIONES ---
    if (productos && productos.length > 0) {
      for (const producto of productos) {
        const detalleQuery = `
          INSERT INTO detalles_pedido (id_pedido, id_producto, cantidad, precio_unidad, opciones) 
          VALUES ($1, $2, $3, $4, $5);
        `;
        await db.query(detalleQuery, [nuevoPedidoId, producto.id, producto.cantidad, producto.precio, producto.opciones || null]);
      }
    }

    // --- GUARDAR COMBOS ---
    if (combos && combos.length > 0) {
      for (const comboVendido of combos) {
        const productosDelComboQuery = 'SELECT id_producto, cantidad FROM combo_productos WHERE id_combo = $1';
        const { rows: productosEnCombo } = await db.query(productosDelComboQuery, [comboVendido.id]);

        for (const producto of productosEnCombo) {
          const precioItemEnCombo = 0;
          const cantidadTotal = comboVendido.cantidad * producto.cantidad;
          const detalleQuery = 'INSERT INTO detalles_pedido (id_pedido, id_producto, cantidad, precio_unidad) VALUES ($1, $2, $3, $4)';
          await db.query(detalleQuery, [nuevoPedidoId, producto.id_producto, cantidadTotal, precioItemEnCombo]);
        }
      }
    }
    
    const countQuery = 'SELECT COUNT(*) FROM pedidos WHERE id_cliente = $1 AND tienda_id = $2';
    const countResult = await db.query(countQuery, [id_cliente, tiendaId]);
    const totalPedidos = parseInt(countResult.rows[0].count, 10);

    let recompensaGenerada = false;
    
    // ==========================================================
    // CORRECCIÓN FATAL: LÓGICA DE RECOMPENSA POR TIENDA
    // ==========================================================
    if (totalPedidos > 0 && totalPedidos % 20 === 0) {
      
      let nombreRecompensa = '';
      
      // Asume que '1' es la tienda de Tito y '2' es Miss Donitas.
      if (tiendaId === '1') {
        nombreRecompensa = `¡Felicidades! Un Tito Pikulito O un Tito Mojadito gratis por tus ${totalPedidos} compras.`;
      } else if (tiendaId === '2') {
        nombreRecompensa = `¡Felicidades! Una Dona Especial gratis por tus ${totalPedidos} compras.`; 
      } else {
        nombreRecompensa = `¡Felicidades! Tienes una recompensa gratis por tus ${totalPedidos} compras.`; 
      }
      
      await db.query(
        'INSERT INTO recompensas (id_cliente, nombre, tienda_id) VALUES ($1, $2, $3);', 
        [id_cliente, nombreRecompensa, tiendaId]
      );
      recompensaGenerada = true;
    }
    // ==========================================================
    
    await db.query('COMMIT');

    res.status(201).json({
      msg: 'Pedido realizado con éxito',
      pedidoId: nuevoPedidoId,
      recompensaGenerada
    });

  } catch (err) {
    await db.query('ROLLBACK');
    // La línea 60 del error previo ahora debería ser esta consulta, ya limpia:
    console.error("Error en crearPedido:", err.message, err.stack); 
    res.status(500).send('Error del Servidor al realizar el pedido');
  }
};

//=================================================================
// OBTENER TODOS LOS PEDIDOS (Para el Admin)
//=================================================================
exports.obtenerPedidos = async (req, res) => {
  const { tiendaId } = req;

  try {
    const query = `
      SELECT p.id, p.fecha, p.total, p.estado, p.tipo_orden, p.direccion_entrega, 
             p.latitude, p.longitude, p.referencia, p.telefono, u.nombre AS nombre_cliente, 
             (SELECT json_agg(json_build_object(
               'nombre', pr.nombre, 
               'cantidad', dp.cantidad, 
               'precio', dp.precio_unidad,
               -- 🚨 CORRECCIÓN APLICADA AQUÍ: Convierte la columna 'opciones' a JSON
               'opciones', CASE WHEN dp.opciones IS NOT NULL THEN dp.opciones::json ELSE '[]'::json END
             )) 
             FROM detalles_pedido dp JOIN productos pr ON dp.id_producto = pr.id 
             WHERE dp.id_pedido = p.id) AS productos 
      FROM pedidos p 
      LEFT JOIN usuarios u ON p.id_cliente = u.id 
      WHERE p.tienda_id = $1 
      ORDER BY p.fecha DESC;
    `;
    const result = await db.query(query, [tiendaId]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error en obtenerPedidos:", err.message, err.stack);
    res.status(500).send('Error del Servidor al obtener pedidos');
  }
};

//=================================================================
// OBTENER PEDIDOS DE UN CLIENTE (Para el Cliente)
//=================================================================
exports.obtenerMisPedidos = async (req, res) => {
  const { tiendaId } = req;
  const id_cliente = req.user.id;

  try {
    const query = `
      SELECT p.id, p.fecha, p.total, p.estado, p.tipo_orden, p.telefono,
             (SELECT json_agg(json_build_object(
               'nombre', pr.nombre, 
               'cantidad', dp.cantidad, 
               'precio', dp.precio_unidad,
               -- 🚨 CORRECCIÓN APLICADA AQUÍ: Convierte la columna 'opciones' a JSON
               'opciones', CASE WHEN dp.opciones IS NOT NULL THEN dp.opciones::json ELSE '[]'::json END
             )) 
             FROM detalles_pedido dp JOIN productos pr ON dp.id_producto = pr.id 
             WHERE dp.id_pedido = p.id) AS productos 
      FROM pedidos p 
      WHERE p.id_cliente = $1 AND p.tienda_id = $2 
      ORDER BY p.fecha DESC;
    `;
    const result = await db.query(query, [id_cliente, tiendaId]);
    res.json(result.rows);
  } catch (err) {
    console.error(`Error en obtenerMisPedidos:`, err.message, err.stack);
    res.status(500).send('Error del Servidor al obtener tus pedidos');
  }
};

//=================================================================
// ACTUALIZAR ESTADO DE UN PEDIDO (Para el Admin)
//=================================================================
exports.actualizarEstadoPedido = async (req, res) => {
  const { tiendaId } = req;
  const { id } = req.params;
  const { estado } = req.body;

  if (!estado) {
    return res.status(400).json({ msg: 'El nuevo estado es requerido.' });
  }
  try {
    const query = 'UPDATE pedidos SET estado = $1 WHERE id = $2 AND tienda_id = $3 RETURNING *';
    const result = await db.query(query, [estado, id, tiendaId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Pedido no encontrado o no pertenece a esta tienda.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error en actualizarEstadoPedido:", err.message, err.stack);
    res.status(500).send('Error del Servidor');
  }
};

//=================================================================
// CALCULAR COSTO DE ENVÍO
//=================================================================
exports.calcularCostoEnvio = async (req, res) => {
  const { tiendaId } = req;
  const { lat, lng } = req.body;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY_BACKEND;

  let originLat;
  let originLng;

  if (tiendaId === '1') {
    originLat = process.env.STORE_LATITUDE_1;
    originLng = process.env.STORE_LONGITUDE_1;
  } else if (tiendaId === '2') {
    originLat = process.env.STORE_LATITUDE_2;
    originLng = process.env.STORE_LONGITUDE_2;
  } else {
    return res.status(400).json({ msg: 'Tienda no configurada para envíos.' });
  }

  if (!lat || !lng) {
    return res.status(400).json({ msg: 'Faltan coordenadas en la petición.' });
  }

  if (!originLat || !originLng || !apiKey) {
    console.error("Error de configuración: Faltan variables de entorno.");
    return res.status(500).json({ msg: 'Error de configuración del servidor.' });
  }

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${lat},${lng}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    const element = response.data?.rows?.[0]?.elements?.[0];

    if (!element || element.status === 'ZERO_RESULTS' || element.status === 'NOT_FOUND') {
      return res.status(404).json({ msg: 'Ubicación fuera del área de entrega.' });
    }

    const distanceInKm = element.distance.value / 1000;
    const costPerKm = parseFloat(process.env.COSTO_POR_KM) || 10;
    const deliveryCost = 20 + (distanceInKm * costPerKm);

    res.json({ deliveryCost: Math.ceil(deliveryCost) });

  } catch (error) {
    console.error("Error en calcularCostoEnvio:", error.response ? error.response.data : error.message);
    res.status(500).json({ msg: 'No se pudo calcular el costo de envío.' });
  }
};

//=================================================================
// PURGAR PEDIDOS
//=================================================================
exports.purgarPedidos = async (req, res) => {
  const { tiendaId } = req;

  try {
    await db.query('BEGIN');
    
    await db.query(
      'DELETE FROM detalles_pedido WHERE id_pedido IN (SELECT id FROM pedidos WHERE tienda_id = $1)',
      [tiendaId]
    );
    
    await db.query('DELETE FROM pedidos WHERE tienda_id = $1', [tiendaId]);
    
    await db.query('COMMIT');

    res.status(200).json({ msg: `Historial de pedidos eliminado para la tienda ${tiendaId}.` });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error("Error en purgarPedidos:", err.message, err.stack);
    res.status(500).send('Error del Servidor al purgar los pedidos.');
  }
};