require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---

// --- CONFIGURACIÓN DE CORS ---
const allowedOrigins = [
  'https://tito-cafe-frontend.onrender.com', // Tu sitio en producción
  'http://localhost:5173'                   // Tu sitio en desarrollo local
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  // LA LÍNEA CORREGIDA: Añadimos 'x-auth-token' a la lista
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'], 
};

// Aplicamos la configuración de CORS a todas las rutas.
app.use(cors(corsOptions));

// Middleware para parsear JSON (debe ir después de CORS)
app.use(express.json());

// --- Rutas ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/productos', require('./routes/productosRoutes'));
app.use('/api/ventas', require('./routes/ventasRoutes'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/pedidos', require('./routes/pedidosRoutes'));
app.use('/api/recompensas', require('./routes/recompensasRoutes'));
app.use('/api/envio', require('./routes/envioRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/combos', require('./routes/combosRoutes'));

// --- Iniciar Servidor ---
app.listen(PORT, () => {
  console.log(`🟢 Servidor Express corriendo en el puerto ${PORT}`);
}); 