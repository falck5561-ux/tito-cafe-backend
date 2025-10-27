// middleWares/verificarTienda.js (CORREGIDO)

const verificarTienda = (req, res, next) => {
  // 1. Buscamos el encabezado 'x-tienda-id' en la solicitud
  const tiendaId = req.headers['x-tienda-id']; // "1" (como string)

  // 2. Si no viene el encabezado, bloqueamos la solicitud
  if (!tiendaId) {
    return res.status(400).json({ 
      error: 'Acceso denegado. Falta el identificador de la tienda (X-Tienda-ID).' 
    });
  }

  // --- 3. LÍNEA CORREGIDA ---
  // Simplemente adjuntamos el ID como string (tal como viene)
  req.tiendaId = tiendaId;
  
  // 4. Dejamos que la solicitud continúe
  next();
};

module.exports = verificarTienda;