// Archivo: middlewares/authMiddleware.js

const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
    // ... (todo tu código anterior que está perfecto)

    // 5. Verificar el token extraído
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;

        // --- AÑADE ESTA LÍNEA DE DIAGNÓSTICO AQUÍ ---
        console.log('✅ Usuario autenticado detectado:', req.user);
        // ---------------------------------------------

        next(); // Pasa al siguiente middleware (checkRole) o al controlador
    } catch (err) {
        res.status(401).json({ msg: 'Token no es válido' });
    }
};