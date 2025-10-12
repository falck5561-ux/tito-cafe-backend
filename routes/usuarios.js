// Archivo: routes/usuarios.js (Código Completo)

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

//=================================================================
// RUTAS PÚBLICAS (NO REQUIEREN TOKEN)
//=================================================================
// Registrar un nuevo cliente
router.post('/register', userController.register);

// Iniciar sesión para cualquier usuario
router.post('/login', userController.login);


//=================================================================
// RUTAS PRIVADAS (REQUIEREN TOKEN Y ROLES ESPECÍFICOS)
//=================================================================

// --- Rutas para Clientes ---
// Obtener la dirección guardada del cliente logueado
router.get('/mi-direccion', [authMiddleware, checkRole(['Cliente'])], userController.obtenerMiDireccion);

// Actualizar la dirección guardada del cliente logueado
router.put('/mi-direccion', [authMiddleware, checkRole(['Cliente'])], userController.actualizarMiDireccion);


// --- Rutas para Empleados/Jefes ---
// Buscar a un cliente por su email para ver recompensas
router.post('/find-by-email', [authMiddleware, checkRole(['Empleado', 'Jefe'])], userController.findUserByEmail);


module.exports = router;