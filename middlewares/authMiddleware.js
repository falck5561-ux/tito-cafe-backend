const jwt = require('jsonwebtoken');
require('dotenv').config(); // Asegura que las variables de entorno se carguen

// Este middleware protege las rutas verificando el token JWT
module.exports = function(req, res, next) {
    // 1. Obtener el token del encabezado de la petición
    const token = req.header('x-auth-token');

    // 2. Verificar si no se proporcionó un token
    if (!token) {
        // Si no hay token, se niega el acceso
        return res.status(401).json({ msg: 'No hay token, permiso denegado' });
    }

    // 3. Validar el token
    try {
        // Usamos jwt.verify para decodificar el token usando la clave secreta
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Si el token es válido, 'decoded' contendrá el payload (los datos del usuario)
        // Agregamos el usuario del payload al objeto de la petición (req)
        req.user = decoded.user;
        
        // El console.log para depurar (puedes quitarlo en producción)
        console.log('✅ Token válido. Usuario autenticado:', req.user);

        // Pasamos al siguiente middleware o al controlador de la ruta
        next();
    } catch (err) {
        // Si jwt.verify falla (token expirado, clave secreta incorrecta, etc.), entra aquí
        res.status(401).json({ msg: 'Token no es válido' });
    }
};