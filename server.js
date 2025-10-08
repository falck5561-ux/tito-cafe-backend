// Archivo: server.js (Versión Final con todas las rutas)
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
// Este es el orden correcto y crucial.
app.use(cors());
app.use(express.json()); // El "traductor" de JSON

// --- Rutas ---
// Registra todas las rutas de la aplicación.
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/productos', require('./routes/productosRoutes'));
app.use('/api/ventas', require('./routes/ventasRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/pedidos', require('./routes/pedidosRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes')); // <-- LÍNEA FINAL AÑADIDA

// Iniciar Servidor
app.listen(PORT, () => {
  console.log(`🟢 Servidor Express corriendo en el puerto ${PORT}`);
});