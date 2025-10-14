// Archivo: middlewares/roleMiddleware.js

// Este middleware mejorado no es sensible a mayúsculas/minúsculas.
const checkRole = (rolesPermitidos) => {
  return (req, res, next) => {
    // req.user fue añadido por el authMiddleware que se ejecutó antes.
    if (!req.user || !req.user.rol) {
        return res.status(403).json({ msg: 'Acceso prohibido. No se encontró rol en el token.' });
    }

    // Convertimos el rol del usuario a mayúsculas para la comparación.
    const userRole = req.user.rol.toUpperCase();

    // Convertimos la lista de roles permitidos a mayúsculas.
    const rolesPermitidosMayusculas = rolesPermitidos.map(rol => rol.toUpperCase());

    // Si el rol del usuario (en mayúsculas) no está en la lista de roles permitidos (en mayúsculas)...
    if (!rolesPermitidosMayusculas.includes(userRole)) {
      // ...le negamos el acceso.
      return res.status(403).json({ msg: `Acceso prohibido. Rol '${req.user.rol}' no tiene permisos.` });
    }

    // Si el rol es correcto, puede continuar.
    next();
  };
};

module.exports = checkRole;