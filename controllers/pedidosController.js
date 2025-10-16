const db = require('../config/db');
const axios = require('axios');

//=================================================================
// CREAR UN NUEVO PEDIDO (CORREGIDO PARA ACEPTAR COMBOS)
//=================================================================
exports.crearPedido = async (req, res) => {
  // 1. AHORA ACEPTAMOS 'combos' ADEMÁS DE 'productos'
  const {
    total,
    productos,
    combos, // <--- Nuevo array
    tipo_orden,
    direccion_entrega,
    costo_envio,
    latitude,
    longitude,
    referencia
  } = req.body;

  if (!req.user || !req.user.id) {
    return res.status(401).json({ msg: 'Usuario no autenticado.' });
  }

  const id_cliente = req.user.id;

  // 2. CORRECCIÓN: La validación ahora comprueba si AMBOS arrays están vacíos
  if ((!productos || productos.length === 0) && (!combos || combos.length === 0)) {
    return res.status(400).json({ msg: 'El pedido no puede estar vacío.' });
  }

  if (tipo_orden === 'domicilio' && (!direccion_entrega || latitude === undefined || longitude === undefined)) {
    return res.status(400).json({ msg: 'La dirección y coordenadas son obligatorias para la entrega a domicilio.' });
  }

  try {
    await db.query('BEGIN');

    // Insertar el pedido principal (esta parte se mantiene igual)
    const pedidoQuery = `
      INSERT INTO pedidos (
        total, id_cliente, tipo_orden, direccion_entrega,
        costo_envio, latitude, longitude, referencia, estado, fecha
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pendiente', NOW()) 
      RETURNING id;`;
    
    const pedidoValues = [
      total, id_cliente, tipo_orden, direccion_entrega || null,
      costo_envio || 0, latitude || null, longitude || null, referencia || null
    ];

    const pedidoResult = await db.query(pedidoQuery, pedidoValues);
    const nuevoPedidoId = pedidoResult.rows[0].id;

    // 3. Insertar los productos individuales (si existen)
    if (productos && productos.length > 0) {
      for (const producto of productos) {
        const detalleQuery = `
          INSERT INTO detalles_pedido (id_pedido, id_producto, cantidad, precio_unidad)
          VALUES ($1, $2, $3, $4);`;
        await db.query(detalleQuery, [nuevoPedidoId, producto.id, producto.cantidad, producto.precio]);
      }
    }

    // 4. ¡NUEVO! Insertar los combos vendidos en la nueva tabla (si existen)
    if (combos && combos.length > 0) {
      for (const combo of combos) {
        const detalleComboQuery = `
          INSERT INTO detalles_pedido_combos (id_pedido, id_combo, cantidad, precio_unidad)
          VALUES ($1, $2, $3, $4);`;
        await db.query(detalleComboQuery, [nuevoPedidoId, combo.id, combo.cantidad, combo.precio]);
      }
    }
    
    // Tu lógica de recompensas se mantiene igual
    const countQuery = 'SELECT COUNT(*) FROM pedidos WHERE id_cliente = $1';
    const countResult = await db.query(countQuery, [id_cliente]);
    const totalPedidos = parseInt(countResult.rows[0].count, 10);

    let recompensaGenerada = false;
    if (totalPedidos > 0 && totalPedidos % 10 === 0) {
      const nombreRecompensa = `¡Felicidades! Café o frappe gratis por tus ${totalPedidos} compras.`;
      await db.query('INSERT INTO recompensas (id_cliente, nombre) VALUES ($1, $2);', [id_cliente, nombreRecompensa]);
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
    console.error("Error en crearPedido:", err.message, err.stack);
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
        p.id,
        p.fecha,
        p.total,
        p.estado,
        p.tipo_orden,
        p.direccion_entrega,
        p.latitude,
        p.longitude,
        p.referencia,
        u.nombre AS nombre_cliente,
        (
          SELECT json_agg(
            json_build_object(
              'nombre', pr.nombre,
              'cantidad', dp.cantidad,
              'precio', dp.precio_unidad
            )
          )
          FROM detalles_pedido dp
          JOIN productos pr ON dp.id_producto = pr.id
          WHERE dp.id_pedido = p.id
        ) AS productos,
        (
          SELECT json_agg(
            json_build_object(
              'nombre', co.titulo,
              'cantidad', dpc.cantidad,
              'precio', dpc.precio_unidad
            )
          )
          FROM detalles_pedido_combos dpc
          JOIN combos co ON dpc.id_combo = co.id
          WHERE dpc.id_pedido = p.id
        ) AS combos
      FROM pedidos p
      LEFT JOIN usuarios u ON p.id_cliente = u.id
      ORDER BY p.fecha DESC;
    `;

    const result = await db.query(query);
    // Unir los productos y combos en un solo array para el frontend
    const pedidosConDetalles = result.rows.map(pedido => ({
        ...pedido,
        productos: [
            ...(pedido.productos || []),
            ...(pedido.combos || [])
        ]
    }));
    res.json(pedidosConDetalles);
  } catch (err) {
    console.error("Error en obtenerPedidos:", err.message, err.stack);
    res.status(500).send('Error del Servidor al obtener pedidos');
  }
};

//=================================================================
// OBTENER PEDIDOS DE UN CLIENTE
//=================================================================
exports.obtenerMisPedidos = async (req, res) => {
  try {
    const id_cliente = req.user.id;
    const query = `
      SELECT
        p.id,
        p.fecha,
        p.total,
        p.estado,
        p.tipo_orden,
        (
          SELECT json_agg(
            json_build_object(
              'nombre', pr.nombre,
              'cantidad', dp.cantidad,
              'precio', dp.precio_unidad
            )
          )
          FROM detalles_pedido dp
          JOIN productos pr ON dp.id_producto = pr.id
          WHERE dp.id_pedido = p.id
        ) AS productos,
        (
          SELECT json_agg(
            json_build_object(
              'nombre', co.titulo,
              'cantidad', dpc.cantidad,
              'precio', dpc.precio_unidad
            )
          )
          FROM detalles_pedido_combos dpc
          JOIN combos co ON dpc.id_combo = co.id
          WHERE dpc.id_pedido = p.id
        ) AS combos
      FROM pedidos p
      WHERE p.id_cliente = $1
      ORDER BY p.fecha DESC;
    `;
    const result = await db.query(query, [id_cliente]);
    // Unir los productos y combos en un solo array para el frontend
    const pedidosConDetalles = result.rows.map(pedido => ({
        ...pedido,
        productos: [
            ...(pedido.productos || []),
            ...(pedido.combos || [])
        ]
    }));
    res.json(pedidosConDetalles);
  } catch (err) {
    console.error(`Error en obtenerMisPedidos:`, err.message, err.stack);
    res.status(500).send('Error del Servidor al obtener tus pedidos');
  }
};

//=================================================================
// ACTUALIZAR ESTADO DE UN PEDIDO
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
    console.error("Error en actualizarEstadoPedido:", err.message, err.stack);
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
// PURGAR PEDIDOS (SOLO ADMIN)
//=================================================================
exports.purgarPedidos = async (req, res) => {
  try {
    await db.query('BEGIN');
    // Borrar detalles de combos primero
    await db.query('DELETE FROM detalles_pedido_combos');
    await db.query('DELETE FROM detalles_pedido');
    await db.query('DELETE FROM pedidos');
    await db.query("SELECT setval(pg_get_serial_sequence('pedidos', 'id'), 1, false);");
    await db.query('COMMIT');

    res.status(200).json({ msg: 'Historial de pedidos eliminado correctamente.' });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error("Error en purgarPedidos:", err.message, err.stack);
    res.status(500).send('Error del Servidor al purgar los pedidos.');
  }
};

