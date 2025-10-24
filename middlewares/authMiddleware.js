// En: middlewares/authMiddleware.js (CORREGIDO)

const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
  // 1. Obtener el token directamente de la cabecera 'x-auth-token'
  const token = req.header('x-auth-token');

  // 2. Verificar si el token existe
  if (!token) {
    // Si no hay token, permiso denegado
    return res.status(401).json({ msg: 'No hay token, permiso denegado' });
  }

  try {
    // 3. Verificar el token con la clave secreta
    // jwt.verify descifra el token y devuelve el payload original (el objeto { user: { id, rol } })
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Añadir el objeto 'user' (que viene dentro de 'decoded') al objeto 'req'
    // para que las siguientes funciones (como roleMiddleware o los controladores) puedan usarlo
    req.user = decoded.user;

    // 5. Permitir que la solicitud continúe
    next();

  } catch (err) {
    // Si jwt.verify falla (porque el token es inválido o expiró), entra aquí
    res.status(401).json({ msg: 'Token no es válido' });
  }
};