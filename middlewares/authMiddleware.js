// En: middlewares/authMiddleware.js

const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
  // 1. Obtener la cabecera 'Authorization'
  const authHeader = req.header('Authorization');

  // 2. Verificar si existe y tiene el formato 'Bearer <token>'
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No hay token o el formato es incorrecto, permiso denegado' });
  }

  try {
    // 3. Extraer el token (quitando "Bearer " del inicio)
    const token = authHeader.split(' ')[1];

    // 4. Verificar el token con la clave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();

  } catch (err) {
    res.status(401).json({ msg: 'Token no es válido' });
  }
};