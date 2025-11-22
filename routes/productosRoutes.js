const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

// =======================================================
// RUTAS DE LECTURA (PÚBLICAS - Para que todos vean el menú)
// =======================================================

/* 🟢 CORRECCIÓN: 
   Hemos quitado 'authMiddleware' de aquí para que el menú cargue 
   aunque el usuario no haya iniciado sesión.
   
   NOTA: Asegúrate de que 'productosController.obtenerProductos' 
   no dependa de 'req.user.tiendaId', o fallará.
*/

// Obtener TODOS los productos (Acceso Público)
router.get('/', productosController.obtenerProductos);

// Obtener UN producto por ID (Acceso Público)
router.get('/:id', productosController.obtenerProductoPorId);


// =======================================================
// RUTAS DE ADMINISTRACIÓN (PROTEGIDAS - Crear, Editar, Borrar)
// =======================================================

// Estas rutas SÍ requieren login (authMiddleware) y rol (checkRole)

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