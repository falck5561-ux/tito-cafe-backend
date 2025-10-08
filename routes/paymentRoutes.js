// Archivo: routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Ruta protegida para crear un intento de pago
router.post('/create-payment-intent', authMiddleware, paymentController.createPaymentIntent);

module.exports = router;