// middleWares/verificarTienda.js

const verificarTienda = (req, res, next) => {
  // 1. Buscamos el encabezado 'x-tienda-id' en la solicitud
  const tiendaId = req.headers['x-tienda-id'];

  // 2. Si no viene el encabezado, bloqueamos la solicitud
  if (!tiendaId) {
    return res.status(400).json({ 
      error: 'Acceso denegado. Falta el identificador de la tienda (X-Tienda-ID).' 
    });
  }

  // 3. Si todo está bien, adjuntamos el ID al objeto 'req'
  //    para que las rutas lo puedan usar más tarde.
  req.tiendaId = parseInt(tiendaId, 10);
  
  // 4. Dejamos que la solicitud continúe
  next();
};

module.exports = verificarTienda;