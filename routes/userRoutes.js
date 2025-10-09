// Archivo: routes/userRoutes.js (Versión Final Corregida)

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// --- ¡ESTAS SON LAS LÍNEAS QUE FALTABAN! ---
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');
// ------------------------------------------

// Ruta pública para registrar un nuevo cliente
router.post('/register', userController.register);

// Ruta para que un empleado/jefe busque a un cliente por su email
router.post('/find-by-email', [authMiddleware, checkRole(['Empleado', 'Jefe'])], userController.findUserByEmail);

module.exports = router;