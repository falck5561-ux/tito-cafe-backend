// Archivo: middlewares/roleMiddleware.js

// Este es un tipo especial de middleware que podemos configurar.
// Le pasamos los roles que tienen permiso.
const checkRole = (rolesPermitidos) => {
  return (req, res, next) => {
    // req.user fue añadido por el authMiddleware que se ejecutó antes.
    const userRole = req.user.rol;

    // Si el rol del usuario no está en la lista de roles permitidos...
    if (!rolesPermitidos.includes(userRole)) {
      // ...le negamos el acceso.
      return res.status(403).json({ msg: 'Acceso prohibido. No tienes el rol necesario.' });
    }

    // Si el rol es correcto, puede continuar.
    next();
  };
};

module.exports = checkRole;