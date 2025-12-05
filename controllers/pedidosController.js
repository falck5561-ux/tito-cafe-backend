const db = require('../config/db');
// const axios = require('axios'); // Asegúrate de tener esto si usas otras funciones en este archivo

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

  // 1. Validaciones iniciales
  if (!req.user || !req.user.id) {
    return res.status(401).json({ msg: 'Usuario no autenticado.' });
  }

  const id_cliente = req.user.id;

  if ((!productos || productos.length === 0) && (!combos || combos.length === 0)) {
    return res.status(400).json({ msg: 'El pedido no puede estar vacío.' });
  }

  if (tipo_orden === 'domicilio' && (!direccion_entrega || latitude === undefined || longitude === undefined || !telefono)) {
    return res.status(400).json({ msg: 'La dirección, coordenadas y teléfono son obligatorios para domicilio.' });
  }

  try {
    await db.query('BEGIN');

    // 2. Insertar el Pedido principal
    const pedidoQuery = `
      INSERT INTO pedidos (total, id_cliente, tipo_orden, direccion_entrega, costo_envio, latitude, longitude, referencia, telefono, estado, fecha, tienda_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pendiente', NOW(), $10) 
      RETURNING id;
    `;
    
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

    // 3. Insertar Productos individuales
    if (productos && productos.length > 0) {
      for (const producto of productos) {
        const detalleQuery = `
          INSERT INTO detalles_pedido (id_pedido, id_producto, cantidad, precio_unidad, opciones) 
          VALUES ($1, $2, $3, $4, $5);
        `;
        await db.query(detalleQuery, [nuevoPedidoId, producto.id, producto.cantidad, producto.precio, producto.opciones || null]);
      }
    }

    // 4. Insertar Combos (desglosados en productos)
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
    
    // 5. Lógica de Recompensas (Filtrada por Tienda)
    const countQuery = 'SELECT COUNT(*) FROM pedidos WHERE id_cliente = $1 AND tienda_id = $2';
    const countResult = await db.query(countQuery, [id_cliente, tiendaId]);
    const totalPedidos = parseInt(countResult.rows[0].count, 10);

    let recompensaGenerada = false;

    // Solo verificamos si cumple la meta de 20 pedidos
    if (totalPedidos > 0 && totalPedidos % 20 === 0) {
      
      // *** FILTRO DE SEGURIDAD ***
      // Solo entra aquí si la tienda es Miss Donitas ('2').
      // Si es Tito ('1'), se salta este bloque completo.
      if (tiendaId === '2') {
        const nombreRecompensa = `¡Felicidades! Una Dona Especial gratis por tus ${totalPedidos} compras.`; 
        
        await db.query(
          'INSERT INTO recompensas (id_cliente, nombre, tienda_id) VALUES ($1, $2, $3);', 
          [id_cliente, nombreRecompensa, tiendaId]
        );
        
        recompensaGenerada = true;
      }
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