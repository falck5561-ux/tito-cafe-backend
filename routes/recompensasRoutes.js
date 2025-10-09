// Archivo: routes/recompensasRoutes.js

const express = require('express');
const router = express.Router();
const recompensasController = require('../controllers/recompensasController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

router.get('/mis-recompensas', [authMiddleware, checkRole(['Cliente'])], recompensasController.obtenerMisRecompensas);

module.exports = router;
