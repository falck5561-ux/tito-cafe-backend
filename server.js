require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---

// --- 1. CONFIGURACIÓN DE CORS ---
// Permitimos que tanto tu frontend en Render como en tu localhost se conecten
const allowedOrigins = [
  'https://tito-cafe-frontend.onrender.com', // Tu sitio en producción
  'http://localhost:5173' // Tu sitio en desarrollo local (Vite usa este puerto por defecto)
];

const corsOptions = {
  origin: function (origin, callback) {
    // Si el origen está en nuestra lista de permitidos, o no hay origen (ej. Postman), permitimos la petición
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200 
};

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

// --- RUTA CORREGIDA PARA COMBOS ---
// Se cambió de '/api/promociones' a '/api/combos' para que coincida con el frontend
app.use('/api/combos', require('./routes/combosRoutes'));


// Iniciar Servidor
app.listen(PORT, () => {
  console.log(`🟢 Servidor Express corriendo en el puerto ${PORT}`);
});
