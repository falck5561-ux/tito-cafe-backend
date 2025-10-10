// Archivo: controllers/pedidosController.js (con depuración MEJORADA)

const db = require('../config/db');
const axios = require('axios');

// --- Las otras funciones no cambian, se quedan como estaban ---
exports.crearPedido = async (req, res) => { /* ... tu código original ... */ };
exports.obtenerPedidos = async (req, res) => { /* ... tu código original ... */ };
exports.actualizarEstadoPedido = async (req, res) => { /* ... tu código original ... */ };
exports.obtenerMisPedidos = async (req, res) => { /* ... tu código original ... */ };
// --- Fin de las otras funciones ---


// ===== ESTA ES LA FUNCIÓN QUE VAMOS A MEJORAR =====
exports.calcularCostoEnvio = async (req, res) => {
  // ===== NUEVO ESPÍA MEJORADO =====
  console.log("==> FUNCIÓN 'calcularCostoEnvio' INICIADA.");
  console.log("==> Cuerpo de la petición recibido:", JSON.stringify(req.body));
  // ================================

  const { lat, lng } = req.body;
  const originLat = process.env.STORE_LATITUDE;
  const originLng = process.env.STORE_LONGITUDE;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY_BACKEND;

  // Se mejora la validación para ser más específico
  if (!lat || !lng) {
    console.error("ERROR: Faltan 'lat' o 'lng' en el cuerpo de la petición.");
    return res.status(400).json({ msg: 'Faltan coordenadas en la petición.' });
  }
  if (!originLat || !originLng || !apiKey) {
    console.error("ERROR: Faltan variables de entorno en el servidor (STORE_LATITUDE, STORE_LONGITUDE, etc).");
    return res.status(500).json({ msg: 'Error de configuración del servidor.' });
  }

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${lat},${lng}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    
    console.log("====== RESPUESTA DE GOOGLE DISTANCE MATRIX API ======");
    console.log(JSON.stringify(response.data, null, 2));
    console.log("=====================================================");

    const element = response.data?.rows?.[0]?.elements?.[0];

    if (!element) {
      console.error("Respuesta inesperada de Google:", response.data);
      return res.status(500).json({ msg: 'Error al procesar la respuesta de Google Maps.' });
    }

    if (element.status === 'ZERO_RESULTS' || element.status === 'NOT_FOUND') {
      console.warn(`Google no encontró una ruta. Estado: ${element.status}`);
      return res.status(404).json({ msg: 'Ubicación fuera del área de entrega o no se encontró una ruta.' });
    }

    if (!element.distance?.value) {
        console.error("La respuesta de Google no contiene el valor de la distancia:", element);
        return res.status(500).json({ msg: 'No se pudo obtener la distancia de la ubicación.' });
    }
    
    const distanceInMeters = element.distance.value;
    const distanceInKm = distanceInMeters / 1000;

    const baseFee = 20;
    const feePerKm = 5;
    const deliveryCost = baseFee + (distanceInKm * feePerKm);

    res.json({ deliveryCost: Math.ceil(deliveryCost) });

  } catch (error) {
    console.error("Error CRÍTICO al calcular costo de envío:", error.response ? error.response.data : error.message);
    res.status(500).json({ msg: 'No se pudo calcular el costo de envío.' });
  }
};