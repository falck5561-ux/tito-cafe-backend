const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

// =======================================================
// RUTAS DE LECTURA (Menú y Detalles)
// =======================================================

// IMPORTANTE: Usamos 'authMiddleware' aquí también. 
// Si tu app es pública, asegúrate de que tu middleware maneje usuarios anónimos 
// o que el frontend envíe un token de invitado. 
// Si no, el controlador no sabrá cuál es el 'tiendaId' y dará error 404.

// Obtener TODOS los productos
router.get('/', authMiddleware, productosController.obtenerProductos);

// Obtener UN producto por ID (con sus grupos y opciones)
// 🚨 Esta es la ruta que fallaba en el video (daba 404)
router.get('/:id', authMiddleware, productosController.obtenerProductoPorId);


// =======================================================
// RUTAS DE ADMINISTRACIÓN (Crear, Editar, Borrar)
// =======================================================

// Crear un producto (Jefe o Empleado)
router.post('/', authMiddleware, checkRole(['JEFE', 'EMPLEADO']), productosController.crearProducto);

// Actualizar un producto (Jefe o Empleado)
router.put('/:id', authMiddleware, checkRole(['JEFE', 'EMPLEADO']), productosController.actualizarProducto);

// Eliminar un producto (Solo Jefe)
router.delete('/:id', authMiddleware, checkRole(['JEFE']), productosController.eliminarProducto);


// =======================================================
// RUTAS PARA OPCIONES Y GRUPOS (TOPPINGS)
// =======================================================

// Crear un GRUPO de opciones (Ej: "Elige tu Jarabe")
router.post('/:productoId/grupos', authMiddleware, checkRole(['JEFE', 'EMPLEADO']), productosController.crearGrupoOpcion);

// Agregar una OPCIÓN a un grupo (Ej: "Vainilla - $15")
router.post('/grupos/:grupoId/opciones', authMiddleware, checkRole(['JEFE', 'EMPLEADO']), productosController.agregarOpcionAGrupo);

// Eliminar un GRUPO completo
router.delete('/grupos/:grupoId', authMiddleware, checkRole(['JEFE', 'EMPLEADO']), productosController.eliminarGrupoOpcion);

// Eliminar una OPCIÓN específica
router.delete('/opciones/:opcionId', authMiddleware, checkRole(['JEFE', 'EMPLEADO']), productosController.eliminarOpcion);

module.exports = router;