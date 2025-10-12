// Archivo: middlewares/authMiddleware.js
// VERSIÓN CORREGIDA PARA MANEJAR "BEARER TOKEN"

const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
    // 1. Obtener la cabecera 'Authorization'
    const authHeader = req.header('Authorization');

    // 2. Verificar que la cabecera exista
    if (!authHeader) {
        return res.status(401).json({ msg: 'No hay token, permiso no válido' });
    }

    // 3. Verificar que el formato sea 'Bearer <token>'
    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'Formato de token no válido' });
    }
    
    // 4. Extraer el token (quitando el prefijo 'Bearer ' que tiene 7 caracteres)
    const token = authHeader.substring(7);

    // 5. Verificar el token extraído
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token no es válido' });
    }
};