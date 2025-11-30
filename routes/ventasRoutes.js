const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventasController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware'); // Asegúrate de que este archivo exista con este nombre
const verificarTienda = require('../middlewares/verificarTienda');

// --- RUTAS DE VENTAS ---

// 1. Crear Venta (POS)
router.post('/', 
  [authMiddleware, checkRole(['Empleado', 'Jefe']), verificarTienda], 
  ventasController.crearVenta
);

// 2. Ventas del día (Para la pestaña 'Ventas de Hoy')
router.get('/hoy', 
  [authMiddleware, checkRole(['Empleado', 'Jefe']), verificarTienda], 
  ventasController.obtenerVentasDelDia
);

// 3. Reporte de Totales (Gráfica o resumen)
router.get('/reporte', 
  [authMiddleware, checkRole(['Jefe']), verificarTienda], 
  ventasController.obtenerReporteVentas
);

// 4. Reporte por Producto (SOLUCIÓN ERROR 400: Agregado verificarTienda)
router.get('/reporte-productos', 
  [authMiddleware, checkRole(['Jefe']), verificarTienda], 
  ventasController.obtenerReportePorProducto
);

// 5. Obtener Detalle de Venta por ID (CRÍTICO: Para el modal de detalles)
// ¡IMPORTANTE! Esta ruta debe ir AL FINAL de las otras rutas GET para evitar conflictos con 'hoy' o 'reporte'
router.get('/:id', 
  [authMiddleware, checkRole(['Empleado', 'Jefe']), verificarTienda], 
  ventasController.obtenerVentaPorId
);

module.exports = router;