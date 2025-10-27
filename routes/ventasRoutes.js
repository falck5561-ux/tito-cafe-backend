// Archivo: routes/ventasRoutes.js (Versión CORREGIDA)

const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventasController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

// --- 1. IMPORTA EL MIDDLEWARE QUE FALTABA ---
const verificarTienda = require('../middlewares/verificarTienda');

// Ruta para registrar una nueva venta
// --- 2. AÑADE 'verificarTienda' a la cadena ---
router.post('/', 
  [authMiddleware, checkRole(['Empleado', 'Jefe']), verificarTienda], 
  ventasController.crearVenta
);

// Ruta para obtener las ventas del día
// --- 2. AÑADE 'verificarTienda' a la cadena ---
router.get('/hoy', 
  [authMiddleware, checkRole(['Empleado', 'Jefe']), verificarTienda], 
  ventasController.obtenerVentasDelDia
);

// Ruta para obtener el reporte de ventas general
// --- 2. AÑADE 'verificarTienda' a la cadena ---
router.get('/reporte', 
  [authMiddleware, checkRole(['Jefe']), verificarTienda], 
  ventasController.obtenerReporteVentas
);

// Ruta para el reporte por producto
// --- 2. AÑADE 'verificarTienda' a la cadena ---
router.get('/reporte-productos', 
  [authMiddleware, checkRole(['Jefe']), verificarTienda], 
  ventasController.obtenerReportePorProducto
);

module.exports = router;