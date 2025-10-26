const express = require('express');
const router = express.Router();
const combosController = require('../controllers/combosController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

// ===================================================
// ¡RUTA DE PRUEBA!
// Úsala para verificar que el deploy en Render funcionó.
// ===================================================
router.get('/test-ruta', (req, res) => {
  res.send('¡EL DEPLOY FUNCIONÓ! La nueva ruta de prueba está activa.');
});
// ===================================================


// ===================================================
// RUTA PÚBLICA (Para Clientes)
// ===================================================
// GET /api/combos -> Obtiene solo combos ACTIVOS
router.get('/', combosController.obtenerCombos);


// ===================================================
// RUTAS PROTEGIDAS (SOLO PARA ADMIN/JEFE)
// ===================================================

// ¡NUEVA RUTA DE ADMIN!
// GET /api/combos/admin/todos -> Obtiene TODOS los combos (activos e inactivos)
router.get('/admin/todos', [authMiddleware, checkRole(['Jefe'])], combosController.obtenerTodosLosCombosAdmin);

// POST /api/combos -> Crea un nuevo combo
router.post('/', [authMiddleware, checkRole(['Jefe'])], combosController.crearCombo);

// PUT /api/combos/:id -> Actualiza un combo existente
router.put('/:id', [authMiddleware, checkRole(['Jefe'])], combosController.actualizarCombo);

// GET /api/combos/:id -> Obtiene un combo (para el modal de editar)
router.get('/:id', [authMiddleware, checkRole(['Jefe'])], combosController.obtenerComboPorId);


// --- CAMBIO DE "DELETE" A "SOFT DELETE" ---

// (Ruta antigua comentada, ya no la usamos)
// router.delete('/:id', [authMiddleware, checkRole(['Jefe'])], combosController.eliminarCombo);

// ¡NUEVA RUTA DE DESACTIVACIÓN!
// PATCH /api/combos/:id/desactivar -> Desactiva (soft delete) un combo
router.patch('/:id/desactivar', [authMiddleware, checkRole(['Jefe'])], combosController.desactivarCombo);
// ------------------------------------------

module.exports = router;

