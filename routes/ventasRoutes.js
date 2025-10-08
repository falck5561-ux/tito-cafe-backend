// Archivo: routes/ventasRoutes.js (Completo con todas las rutas de reportes)
const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventasController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

// Ruta para crear una nueva venta (Empleado y Jefe)
router.post('/', authMiddleware, ventasController.crearVenta);

// Ruta para obtener el reporte de ventas general (Solo el Jefe)
router.get('/reporte', [authMiddleware, checkRole(['Jefe'])], ventasController.obtenerReporteVentas);

// --- RUTA NUEVA AÑADIDA ---
// Ruta para obtener el reporte de ventas por producto (Solo el Jefe)
router.get('/reporte-productos', [authMiddleware, checkRole(['Jefe'])], ventasController.obtenerReportePorProducto);

module.exports = router;