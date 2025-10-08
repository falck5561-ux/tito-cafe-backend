// Archivo: routes/pedidosRoutes.js (Completo)
const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

// Ruta para que un cliente cree un nuevo pedido (Solo Cliente)
router.post('/', [authMiddleware, checkRole(['Cliente'])], pedidosController.crearPedido);

// Ruta para ver todos los pedidos (Solo Empleado y Jefe)
router.get('/', [authMiddleware, checkRole(['Empleado', 'Jefe'])], pedidosController.obtenerPedidos);

// Ruta para que un cliente vea sus propios pedidos (Solo Cliente)
router.get('/mis-pedidos', [authMiddleware, checkRole(['Cliente'])], pedidosController.obtenerMisPedidos);

// Ruta para actualizar el estado de un pedido (Solo Empleado y Jefe)
router.put('/:id/estado', [authMiddleware, checkRole(['Empleado', 'Jefe'])], pedidosController.actualizarEstadoPedido);

module.exports = router;