// Archivo: routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Ruta pública para que cualquiera pueda registrarse
// POST /api/users/register
router.post('/find-by-email', [authMiddleware, checkRole(['Empleado', 'Jefe'])], userController.findUserByEmail);
router.post('/register', userController.register);

module.exports = router;