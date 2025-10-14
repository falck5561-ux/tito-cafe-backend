// routes/pedidosRoutes.js

const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

/*==================================
=         RUTAS PARA CLIENTES        =
==================================*/
// POST /api/pedidos -> Para crear un nuevo pedido
router.post(
    '/',
    [authMiddleware, roleMiddleware(['Cliente'])],
    pedidosController.crearPedido
);

// GET /api/pedidos/mis-pedidos -> Para ver su historial de pedidos
router.get(
    '/mis-pedidos',
    [authMiddleware, roleMiddleware(['Cliente'])],
    pedidosController.obtenerMisPedidos
);

// POST /api/pedidos/calcular-envio -> Para calcular el costo de envío
router.post(
    '/calcular-envio',
    [authMiddleware, roleMiddleware(['Cliente'])],
    pedidosController.calcularCostoEnvio
);

/*=============================================
=         RUTAS PARA EMPLEADOS Y JEFES        =
=============================================*/
// GET /api/pedidos -> Para ver TODOS los pedidos
router.get(
    '/',
    // ✅ <-- CAMBIO REALIZADO AQUÍ: Se añadió 'Cliente' a la lista
    [authMiddleware, roleMiddleware(['EMPLEADO', 'JEFE', 'Cliente'])],
    pedidosController.obtenerPedidos
);

// PATCH /api/pedidos/:id/estado -> Para actualizar el estado de un pedido
router.patch(
    '/:id/estado',
    [authMiddleware, roleMiddleware(['EMPLEADO', 'JEFE'])],
    pedidosController.actualizarEstadoPedido
);

/*========================================
=            RUTA SOLO PARA JEFE           =
========================================*/
// DELETE /api/pedidos/purgar -> Para borrar PERMANENTEMENTE todos los pedidos
router.delete(
    '/purgar',
    [authMiddleware, roleMiddleware(['JEFE'])],
    pedidosController.purgarPedidos
);

module.exports = router;