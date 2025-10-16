const express = require('express');
const router = express.Router();
const combosController = require('../controllers/combosController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware'); // Asegúrate que este sea el nombre correcto de tu middleware de roles

// RUTA PÚBLICA: Obtener todos los combos para los clientes
// ANTES: Usaba una función que ya no existe.
// AHORA: Usa la nueva función unificada 'obtenerCombos'.
router.get('/', combosController.obtenerCombos);

// ===================================================
// RUTAS PROTEGIDAS (SOLO PARA ADMINISTRADORES/JEFE)
// ===================================================

// Crear un nuevo combo
router.post('/', [authMiddleware, checkRole(['Jefe'])], combosController.crearCombo);

// Actualizar un combo existente por su ID
router.put('/:id', [authMiddleware, checkRole(['Jefe'])], combosController.actualizarCombo);

// Eliminar un combo por su ID
router.delete('/:id', [authMiddleware, checkRole(['Jefe'])], combosController.eliminarCombo);

module.exports = router;