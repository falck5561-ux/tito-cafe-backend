// Archivo: controllers/paymentController.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Esta función crea una "intención de pago" en Stripe
// y devuelve un secreto que el frontend usará para confirmar el pago.
exports.createPaymentIntent = async (req, res) => {
  const { amount } = req.body; // Recibimos el monto total del carrito

  // Validamos que el monto sea un número válido y mayor a 0.50 (mínimo de Stripe)
  if (!amount || isNaN(amount) || amount < 1) {
    return res.status(400).json({ error: 'Monto inválido.' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      // Stripe maneja los montos en la unidad más pequeña (centavos).
      // Por eso, multiplicamos por 100. Ej: $55.00 -> 5500
      amount: Math.round(amount * 100),
      currency: 'mxn', // Moneda en pesos mexicanos
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Enviamos el 'client_secret' al frontend.
    // Este es el dato clave que el frontend necesita.
    res.send({
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error) {
    console.error("Error al crear Payment Intent:", error);
    res.status(500).json({ error: 'Error interno del servidor al procesar el pago.' });
  }
};