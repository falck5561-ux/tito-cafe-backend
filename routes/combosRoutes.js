const express = require('express');
const router = express.Router();
const combosController = require('../controllers/combosController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

// --- Ruta Pública (para clientes, solo ve combos activos) ---
router.get('/', combosController.obtenerCombosActivos);

// --- Ruta de Admin (para la tabla de gestión, ve todos los combos) ---
router.get('/todos', authMiddleware, checkRole(['JEFE', 'EMPLEADO']), combosController.obtenerTodosLosCombos);

// --- Rutas de Administración (protegidas) ---
router.post('/', authMiddleware, checkRole(['JEFE', 'EMPLEADO']), combosController.crearCombo);
router.put('/:id', authMiddleware, checkRole(['JEFE', 'EMPLEADO']), combosController.actualizarCombo);
router.delete('/:id', authMiddleware, checkRole(['JEFE']), combosController.eliminarCombo);

module.exports = router;

