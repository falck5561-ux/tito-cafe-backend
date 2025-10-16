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
  [authMiddleware, roleMiddleware(['Cliente', 'JEFE'])],
  pedidosController.crearPedido
);

// GET /api/pedidos/mis-pedidos -> Para ver su historial de pedidos
router.get(
  '/mis-pedidos',
  [authMiddleware, roleMiddleware(['Cliente', 'JEFE'])],
  pedidosController.obtenerMisPedidos
);

// POST /api/pedidos/calcular-envio -> Para calcular el costo de envío
router.post(
  '/calcular-envio',
  [authMiddleware, roleMiddleware(['Cliente', 'JEFE'])],
  pedidosController.calcularCostoEnvio
);

/*=============================================
=        RUTAS PARA EMPLEADOS Y JEFES         =
=============================================*/
// GET /api/pedidos -> Para ver TODOS los pedidos
router.get(
  '/',
  [authMiddleware, roleMiddleware(['EMPLEADO', 'JEFE'])],
  pedidosController.obtenerPedidos
);

// --- ¡CORRECCIÓN APLICADA AQUÍ! ---
// Se cambió el método de PATCH a PUT para que coincida con el frontend.
router.put(
  '/:id/estado',
  [authMiddleware, roleMiddleware(['EMPLEADO', 'JEFE'])],
  pedidosController.actualizarEstadoPedido
);

/*========================================
=             RUTA SOLO PARA JEFE          =
========================================*/
// DELETE /api/pedidos/purgar -> Para borrar PERMANENTEMENTE todos los pedidos
router.delete(
  '/purgar',
  [authMiddleware, roleMiddleware(['JEFE'])],
  pedidosController.purgarPedidos
);

module.exports = router;