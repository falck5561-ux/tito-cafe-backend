// Archivo: routes/authRoutes.js
const express = require('express');
const router = express.Router();

// Importamos el controlador que tiene la lógica del login
const authController = require('../controllers/authController');

// Definimos la ruta específica para el login
// Cuando se recibe un POST en /api/auth/login, se ejecuta la función 'login'
router.post('/login', authController.login);

// Exportamos el router para que server.js pueda usarlo
module.exports = router;