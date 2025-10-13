require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---

// --- 1. CONFIGURACIÓN DE CORS MEJORADA ---
// Lista de orígenes permitidos
const allowedOrigins = [
  'https://tito-cafe-frontend.onrender.com', // Tu sitio en producción
  'http://localhost:5173'                   // Tu sitio en desarrollo local
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permite peticiones sin origen (como Postman) y las de la lista blanca
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  // Habilitamos explícitamente las credenciales y los headers necesarios para el login
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Habilitamos la respuesta a las peticiones "preflight" que el navegador envía
app.options('*', cors(corsOptions));
// Aplicamos la configuración de CORS a todas las rutas
app.use(cors(corsOptions));

// --- 2. Middleware para parsear JSON ---
// (Esto debe ir DESPUÉS de la configuración de CORS)
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