require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importamos el middleware
const verificarTienda = require('./middlewares/verificarTienda');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURACIÓN DE CORS ---
const allowedOrigins = [
  'https://tito-cafe-frontend.onrender.com', 
  'https://miss-donitas-frontend.onrender.com', // Frontend de Miss Donitas
  'http://localhost:5173',                  
  'http://localhost:5174',                  
  'http://localhost:5175',                  
  'http://localhost:5176',
  'http://localhost:5179' // <-- ¡AÑADE ESTA LÍNEA!
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
  // Permitimos el nuevo encabezado 'x-tienda-id'
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'x-tienda-id'], 
};

// --- Middlewares ---
app.use(cors(corsOptions));
app.use(express.json());

// --- Rutas ---

// La autenticación NO lleva el middleware de tienda
app.use('/api/auth', require('./routes/authRoutes'));

// Todas las demás rutas SÍ llevan el middleware 'verificarTienda'
app.use('/api/productos', verificarTienda, require('./routes/productosRoutes'));
app.use('/api/ventas', verificarTienda, require('./routes/ventasRoutes'));
app.use('/api/usuarios', verificarTienda, require('./routes/usuarios'));
app.use('/api/pedidos', verificarTienda, require('./routes/pedidosRoutes'));
app.use('/api/recompensas', verificarTienda, require('./routes/recompensasRoutes'));
app.use('/api/payments', verificarTienda, require('./routes/paymentRoutes'));
app.use('/api/combos', verificarTienda, require('./routes/combosRoutes'));

// --- Iniciar Servidor ---
app.listen(PORT, () => {
  console.log(`🟢 Servidor Express corriendo en el puerto ${PORT}`);
});