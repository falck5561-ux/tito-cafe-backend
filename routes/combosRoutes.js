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

// --- CAMBIO DE "DELETE" A "SOFT DELETE" ---
// En lugar de borrar, vamos a desactivar el combo.
// Usamos PATCH (actualización parcial) y una ruta más descriptiva.

// DELETE /api/combos/:id -> Elimina un combo (RUTA ANTIGUA COMENTADA)
// router.delete('/:id', [authMiddleware, checkRole(['Jefe'])], combosController.eliminarCombo);

// PATCH /api/combos/:id/desactivar -> Desactiva (soft delete) un combo
router.patch('/:id/desactivar', [authMiddleware, checkRole(['Jefe'])], combosController.desactivarCombo);
// ------------------------------------------

module.exports = router;
