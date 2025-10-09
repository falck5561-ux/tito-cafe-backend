// Archivo: routes/ventasRoutes.js (Versión Final)

const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventasController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

// Ruta para registrar una nueva venta
router.post('/', [authMiddleware, checkRole(['Empleado', 'Jefe'])], ventasController.crearVenta);

// --- RUTA CORREGIDA PARA LAS VENTAS DEL DÍA ---
router.get('/hoy', [authMiddleware, checkRole(['Empleado', 'Jefe'])], ventasController.obtenerVentasDelDia);

// Ruta para obtener las ventas del empleado logueado
router.get('/mis-ventas', [authMiddleware, checkRole(['Empleado', 'Jefe'])], ventasController.obtenerMisVentas);

// Rutas para reportes del Jefe
router.get('/reporte', [authMiddleware, checkRole(['Jefe'])], ventasController.obtenerReporteVentas);
router.get('/reporte-producto', [authMiddleware, checkRole(['Jefe'])], ventasController.obtenerReportePorProducto);

module.exports = router;