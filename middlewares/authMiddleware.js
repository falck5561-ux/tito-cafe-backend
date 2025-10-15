// Archivo: middlewares/authMiddleware.js (Versión Corregida)

const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
  // 1. Obtener el token del encabezado 'x-auth-token'
  const token = req.header('x-auth-token');

  // 2. Verificar si el token existe
  if (!token) {
    return res.status(401).json({ msg: 'No hay token, permiso denegado' });
  }

  try {
    // 3. Validar el token con la clave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();

  } catch (err) {
    // Esto se ejecutará si el token es inválido o ha expirado
    res.status(401).json({ msg: 'Token no es válido' });
  }
};