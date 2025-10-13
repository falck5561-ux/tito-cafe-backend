// TITO-CAFE-BACKEND/routes/pedidosRoutes.js

// 1. Importaciones necesarias
const express = require('express');
const router = express.Router();

// 2. Importación del controlador con la lógica de negocio
const pedidosController = require('../controllers/pedidosController');

// 3. Importación de los middlewares de seguridad
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

/*
=================================================================
 SECCIÓN DE RUTAS PARA CLIENTES
 Estas rutas requieren que el usuario haya iniciado sesión Y tenga el rol de 'Cliente'.
=================================================================
*/

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


/*
=================================================================
 SECCIÓN DE RUTAS PARA EMPLEADOS y JEFES
 Estas rutas son para la gestión interna de los pedidos.
=================================================================
*/

// GET /api/pedidos -> Para ver TODOS los pedidos de todos los clientes
router.get(
    '/',
    [authMiddleware, roleMiddleware(['EMPLEADO', 'JEFE'])],
    pedidosController.obtenerPedidos
);

// PATCH /api/pedidos/:id/estado -> Para actualizar el estado de un pedido
router.patch(
    '/:id/estado',
    [authMiddleware, roleMiddleware(['EMPLEADO', 'JEFE'])],
    pedidosController.actualizarEstadoPedido
);


/*
=================================================================
 SECCIÓN DE RUTA DE ALTO RIESGO (Solo para el JEFE)
=================================================================
*/

// DELETE /api/pedidos/purgar -> Para borrar PERMANENTEMENTE todos los pedidos
router.delete(
    '/purgar',
    [authMiddleware, roleMiddleware(['JEFE'])],
    pedidosController.purgarPedidos
);

// 4. Exportar el router con todas las rutas configuradas
module.exports = router;