// Archivo: server.js (Versión Final con CORS configurado)
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---

// --- 1. CONFIGURACIÓN DE CORS (ESTE ES EL CAMBIO) ---
// Le decimos al backend que solo acepte peticiones de nuestro frontend
const corsOptions = {
  origin: 'https://tito-cafe-frontend.onrender.com',
  optionsSuccessStatus: 200 
};

app.use(cors(corsOptions)); // <-- USAMOS LA CONFIGURACIÓN AQUÍ

app.use(express.json()); // El "traductor" de JSON

// --- Rutas ---
// Registra todas las rutas de la aplicación.
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/productos', require('./routes/productosRoutes'));
app.use('/api/ventas', require('./routes/ventasRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/pedidos', require('./routes/pedidosRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));

// Iniciar Servidor
app.listen(PORT, () => {
  console.log(`🟢 Servidor Express corriendo en el puerto ${PORT}`);
});
