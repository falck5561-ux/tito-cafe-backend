// TITO-CAFE-BACKEND/routes/pedidosRoutes.js

const express = require('express');
const router = express.Router();

// Importamos el controlador que tiene toda la lógica
const pedidosController = require('../controllers/pedidosController');

// Importamos los middlewares de autenticación y roles
// Asegúrate de que las rutas a estos archivos sean correctas
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

//=================================================================
// RUTAS PARA CLIENTES (Requieren solo autenticación)
//=================================================================

// POST /api/pedidos
// Crea un nuevo pedido. Protegida para que solo usuarios logueados puedan crear pedidos.
// ESTA ES LA RUTA QUE ESTABA DANDO EL ERROR 500.
router.post(
    '/',
    authMiddleware, // <-- Middleware que verifica el token y añade `req.user`
    pedidosController.crearPedido
);

// GET /api/pedidos/mis-pedidos
// Obtiene el historial de pedidos del usuario que está logueado.
router.get(
    '/mis-pedidos',
    authMiddleware, // <-- Protegida para saber de qué usuario obtener los pedidos
    pedidosController.obtenerMisPedidos
);

// POST /api/pedidos/calcular-envio
// Calcula el costo de envío. Requiere estar logueado para usar esta función.
router.post(
    '/calcular-envio',
    authMiddleware,
    pedidosController.calcularCostoEnvio
);


//=================================================================
// RUTAS PARA EMPLEADOS Y JEFES (Requieren rol específico)
//=================================================================

// GET /api/pedidos
// Obtiene TODOS los pedidos. Solo para empleados y jefes.
router.get(
    '/',
    authMiddleware,
    roleMiddleware(['EMPLEADO', 'JEFE']), // <-- Solo roles permitidos
    pedidosController.obtenerPedidos
);

// PATCH /api/pedidos/:id/estado
// Actualiza el estado de un pedido (ej. 'en preparación', 'enviado'). Solo para empleados y jefes.
router.patch(
    '/:id/estado',
    authMiddleware,
    roleMiddleware(['EMPLEADO', 'JEFE']),
    pedidosController.actualizarEstadoPedido
);


//=================================================================
// RUTA SOLO PARA JEFE (Acción destructiva)
//=================================================================

// DELETE /api/pedidos/purgar
// Elimina permanentemente TODOS los pedidos de la base de datos. Acción muy peligrosa.
router.delete(
    '/purgar',
    authMiddleware,
    roleMiddleware(['JEFE']), // <-- Solo el JEFE puede hacer esto
    pedidosController.purgarPedidos
);


module.exports = router;