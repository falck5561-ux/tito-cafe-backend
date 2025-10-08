// Archivo: routes/productosRoutes.js (Versión Final Corregida)
const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

// --- Ruta Pública ---
router.get('/', productosController.obtenerProductos);

// --- Rutas Protegidas (solo token) ---
router.get('/:id', authMiddleware, productosController.obtenerProductoPorId);

// --- Rutas de Administración (token + rol de Jefe) ---
// La forma correcta de encadenar middlewares: uno después del otro.
router.post('/', authMiddleware, checkRole(['Jefe']), productosController.crearProducto);
router.put('/:id', authMiddleware, checkRole(['Jefe']), productosController.actualizarProducto);
router.delete('/:id', authMiddleware, checkRole(['Jefe']), productosController.eliminarProducto);

module.exports = router;