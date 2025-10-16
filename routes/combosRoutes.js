const express = require('express');
const router = express.Router();
const combosController = require('../controllers/combosController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

// ===================================================
// RUTA PÚBLICA (Para Clientes)
// ===================================================
// GET /api/combos -> Obtiene todos los combos
router.get('/', combosController.obtenerCombos);


// ===================================================
// RUTAS PROTEGIDAS (SOLO PARA ADMIN/JEFE)
// ===================================================

// POST /api/combos -> Crea un nuevo combo
router.post('/', [authMiddleware, checkRole(['Jefe'])], combosController.crearCombo);

// PUT /api/combos/:id -> Actualiza un combo existente
router.put('/:id', [authMiddleware, checkRole(['Jefe'])], combosController.actualizarCombo);

// DELETE /api/combos/:id -> Elimina un combo
router.delete('/:id', [authMiddleware, checkRole(['Jefe'])], combosController.eliminarCombo);


module.exports = router;