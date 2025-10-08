// Archivo: middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Este es nuestro "guardia de seguridad"
module.exports = function(req, res, next) {
  // 1. Obtener el token del encabezado de la petición
  const token = req.header('x-auth-token');

  // 2. Si no hay token, no hay acceso
  if (!token) {
    return res.status(401).json({ msg: 'No hay token, permiso denegado' });
  }

  // 3. Si hay un token, verificar que sea válido
  try {
    // Usamos la misma clave secreta para decodificarlo
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Si es válido, guardamos los datos del usuario en el objeto de la petición
    req.user = decoded.user;
    
    // Le decimos a la petición que puede continuar
    next();
  } catch (err) {
    res.status(401).json({ msg: 'El token no es válido' });
  }
};