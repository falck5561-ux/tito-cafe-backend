// Archivo: routes/ventasRoutes.js (Versión Final y Completa)

const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventasController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

// Ruta para registrar una nueva venta
router.post('/', [authMiddleware, checkRole(['Empleado', 'Jefe'])], ventasController.crearVenta);

// Ruta para obtener las ventas del día
router.get('/hoy', [authMiddleware, checkRole(['Empleado', 'Jefe'])], ventasController.obtenerVentasDelDia);

// Ruta para obtener el reporte de ventas general
router.get('/reporte', [authMiddleware, checkRole(['Jefe'])], ventasController.obtenerReporteVentas);

// --- RUTA AÑADIDA PARA EL REPORTE POR PRODUCTO ---
router.get('/reporte-productos', [authMiddleware, checkRole(['Jefe'])], ventasController.obtenerReportePorProducto);

module.exports = router;