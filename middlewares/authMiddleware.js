// Archivo: middlewares/authMiddleware.js (Versión Corregida)

const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
  // 1. Obtener el encabezado 'Authorization'
  const authHeader = req.header('Authorization');

  // 2. Verificar si el encabezado existe y tiene el formato correcto 'Bearer <token>'
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No hay token o el formato es incorrecto, permiso denegado' });
  }

  try {
    // 3. Extraer el token (quitando la palabra "Bearer " del inicio)
    const token = authHeader.split(' ')[1];

    // 4. Validar el token con la clave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();

  } catch (err) {
    // Esto se ejecutará si el token es inválido o ha expirado
    res.status(401).json({ msg: 'Token no es válido' });
  }
};