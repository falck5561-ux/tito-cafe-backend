// Archivo: routes/authRoutes.js
const express = require('express');
const router = express.Router();

// Importamos el controlador que tiene la lógica del login
const authController = require('../controllers/authController');

// Definimos la ruta específica para el login (esta ya la tenías)
router.post('/login', authController.login);

// --- AÑADE ESTA LÍNEA PARA GOOGLE ---
router.post('/google-login', authController.googleLogin);

// Exportamos el router para que server.js pueda usarlo
module.exports = router;