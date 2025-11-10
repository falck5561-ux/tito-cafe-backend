const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

// =======================================================
// RUTAS PÚBLICAS (Para que cualquiera vea el menú)
// =======================================================

// GET /api/productos -> Obtener TODOS los productos
router.get('/', productosController.obtenerProductos);

// GET /api/productos/:id -> Obtener UN producto (también público)
router.get('/:id', productosController.obtenerProductoPorId);

// =======================================================
// RUTAS DE ADMINISTRACIÓN (Protegidas por token y rol)
// =======================================================

// POST /api/productos -> Crear un producto (Jefe o Empleado)
router.post('/', authMiddleware, checkRole(['JEFE', 'EMPLEADO']), productosController.crearProducto);

// PUT /api/productos/:id -> Actualizar un producto (Jefe o Empleado)
router.put('/:id', authMiddleware, checkRole(['JEFE', 'EMPLEADO']), productosController.actualizarProducto);

// DELETE /api/productos/:id -> Eliminar un producto (Solo Jefe)
router.delete('/:id', authMiddleware, checkRole(['JEFE']), productosController.eliminarProducto);


// =======================================================
// ¡RUTAS FALTANTES PARA OPCIONES (TOPPINGS)!
// =======================================================

// POST /api/productos/:productoId/grupos -> Crear un GRUPO de opciones
router.post('/:productoId/grupos', authMiddleware, checkRole(['JEFE', 'EMPLEADO']), productosController.crearGrupoOpcion);

// POST /api/productos/grupos/:grupoId/opciones -> Agregar una OPCIÓN a un grupo
router.post('/grupos/:grupoId/opciones', authMiddleware, checkRole(['JEFE', 'EMPLEADO']), productosController.agregarOpcionAGrupo);

// DELETE /api/productos/grupos/:grupoId -> Eliminar un GRUPO
router.delete('/grupos/:grupoId', authMiddleware, checkRole(['JEFE', 'EMPLEADO']), productosController.eliminarGrupoOpcion);

// DELETE /api/productos/opciones/:opcionId -> Eliminar una OPCIÓN
router.delete('/opciones/:opcionId', authMiddleware, checkRole(['JEFE', 'EMPLEADO']), productosController.eliminarOpcion);


module.exports = router;