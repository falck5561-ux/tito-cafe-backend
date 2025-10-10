// Archivo: controllers/envioController.js
const axios = require('axios');

exports.calcularCostoEnvio = async (req, res) => {
  console.log("==> FUNCIÓN 'calcularCostoEnvio' INICIADA.");
  console.log("==> Cuerpo de la petición recibido:", JSON.stringify(req.body));

  const { lat, lng } = req.body;
  const originLat = process.env.STORE_LATITUDE;
  const originLng = process.env.STORE_LONGITUDE;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY_BACKEND;
  const costoPorKm = process.env.COSTO_POR_KM || 10;

  if (!lat || !lng) {
    return res.status(400).json({ msg: 'Faltan coordenadas en la petición.' });
  }
  if (!originLat || !originLng || !apiKey) {
    console.error("ERROR: Faltan variables de entorno en el servidor.");
    return res.status(500).json({ msg: 'Error de configuración del servidor.' });
  }

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${lat},${lng}&key=${apiKey}&units=metric`;

  try {
    const response = await axios.get(url);
    const element = response.data?.rows?.[0]?.elements?.[0];

    if (!element || element.status !== 'OK') {
       console.warn(`Google no encontró una ruta. Estado: ${element?.status}`);
       return res.status(404).json({ msg: 'Ubicación fuera del área de entrega.' });
    }

    const distanceInKm = element.distance.value / 1000;
    const costoBase = 20; // Costo mínimo de envío

    let costoFinal = costoBase + (distanceInKm * parseFloat(costoPorKm));

    res.json({ costoEnvio: Math.ceil(costoFinal) });

  } catch (error) {
    console.error("Error CRÍTICO al llamar a API de Google:", error.response ? error.response.data : error.message);
    res.status(500).json({ msg: 'No se pudo calcular el costo de envío.' });
  }
};