require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURACIÓN DE CORS ---
// Se añaden múltiples puertos locales para evitar futuros bloqueos
const allowedOrigins = [
  'https://tito-cafe-frontend.onrender.com', // Tu sitio en producción
  'http://localhost:5173',                  // Puerto de desarrollo por defecto
  'http://localhost:5174',                  // Puerto que estás usando ahora
  'http://localhost:5175',                  // Otro puerto que has usado
  'http://localhost:5176'                   // Un puerto extra, por si acaso
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permite peticiones sin origen (como las de Postman o apps móviles) y las de la lista
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'], 
};

// --- Middlewares ---
app.use(cors(corsOptions));
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

