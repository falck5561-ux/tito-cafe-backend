const express = require('express');
const router = express.Router();
const recompensasController = require('../controllers/recompensasController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

// Ruta para que un cliente vea sus recompensas personales
router.get('/mis-recompensas', [authMiddleware, checkRole(['Cliente'])], recompensasController.obtenerMisRecompensas);

// --- RUTA NUEVA ---
// Ruta para que el empleado obtenga todos los descuentos/recompensas aplicables en el POS
router.get('/disponibles', [authMiddleware, checkRole(['Empleado', 'Jefe'])], recompensasController.obtenerRecompensasDisponibles);

// Ruta para que un empleado/jefe marque un cupón como utilizado por un cliente
router.put('/:id/utilizar', [authMiddleware, checkRole(['Empleado', 'Jefe'])], recompensasController.marcarRecompensaUtilizada);

module.exports = router;