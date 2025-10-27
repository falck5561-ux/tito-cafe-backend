// Archivo: routes/ventasRoutes.js (Esta es la SOLUCIÓN)

const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventasController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

// --- 1. IMPORTA EL MIDDLEWARE QUE FALTA ---
const verificarTienda = require('../middlewares/verificarTienda');

// --- 2. AÑADE 'verificarTienda' A TODAS LAS RUTAS ---

router.post('/', 
  [authMiddleware, checkRole(['Empleado', 'Jefe']), verificarTienda], 
  ventasController.crearVenta
);

router.get('/hoy', 
  [authMiddleware, checkRole(['Empleado', 'Jefe']), verificarTienda], 
  ventasController.obtenerVentasDelDia
);

router.get('/reporte', 
  [authMiddleware, checkRole(['Jefe']), verificarTienda], 
  ventasController.obtenerReporteVentas
);

// Esta es la ruta que te da el error 400
router.get('/reporte-productos', 
  [authMiddleware, checkRole(['Jefe']), verificarTienda], // <-- Aquí faltaba 'verificarTienda'
  ventasController.obtenerReportePorProducto
);

module.exports = router;