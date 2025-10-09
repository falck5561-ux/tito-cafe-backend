// Archivo: routes/paymentRoutes.js

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware'); // Protegemos la ruta

// Definimos la ruta para crear la intención de pago
// Solo usuarios autenticados pueden intentar pagar.
router.post('/create-payment-intent', authMiddleware, paymentController.createPaymentIntent);

module.exports = router;