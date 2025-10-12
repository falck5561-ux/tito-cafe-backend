const express = require('express');
const router = express.Router();
const promocionesController = require('../controllers/controllers/combosController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// RUTA PÚBLICA: Para que los clientes vean las promociones activas en el menú.
router.get('/', promocionesController.obtenerPromocionesActivas);

// --- RUTAS PROTEGIDAS (Solo para el rol 'Jefe') ---

// RUTA ADMIN: Para obtener TODAS las promociones (activas e inactivas) en el panel de gestión.
router.get('/todas', authMiddleware, roleMiddleware(['Jefe']), promocionesController.obtenerTodasPromociones);

// RUTA ADMIN: Para crear una nueva promoción.
router.post('/', authMiddleware, roleMiddleware(['Jefe']), promocionesController.crearPromocion);

// RUTA ADMIN: Para actualizar una promoción existente.
router.put('/:id', authMiddleware, roleMiddleware(['Jefe']), promocionesController.actualizarPromocion);

// RUTA ADMIN: Para eliminar una promoción.
router.delete('/:id', authMiddleware, roleMiddleware(['Jefe']), promocionesController.eliminarPromocion);

module.exports = router;