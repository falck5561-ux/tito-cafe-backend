// Archivo: routes/envioRoutes.js
const express = require('express');
const router = express.Router();
const envioController = require('../controllers/envioController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/calcular-costo', authMiddleware, envioController.calcularCostoEnvio);

module.exports = router;