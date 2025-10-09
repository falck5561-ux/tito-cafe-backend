// Archivo: routes/recompensasRoutes.js

const express = require('express');
const router = express.Router();
const recompensasController = require('../controllers/recompensasController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

// Ruta para que un cliente vea sus recompensas
router.get('/mis-recompensas', [authMiddleware, checkRole(['Cliente'])], recompensasController.obtenerMisRecompensas);

// --- NUEVA RUTA ---
// Ruta para que un empleado/jefe marque un cupón como utilizado
router.put('/:id/utilizar', [authMiddleware, checkRole(['Empleado', 'Jefe'])], recompensasController.marcarRecompensaUtilizada);

module.exports = router;