// Archivo: controllers/envioController.js

// Lógica de tarifas configurables
const RADIO_MAXIMO_KM = 8;
const PRECIO_BASE = 10;
const PRECIO_POR_KM = 2;

// Función matemática (Haversine)
const calcularDistanciaKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

exports.calcularCostoEnvio = async (req, res) => {
    // 1. RECIBIR COORDENADAS: Tanto del cliente (destino) como de la tienda (origen)
    // Esto permite que el mismo backend sirva para Tito, Tienda B, Tienda C, etc.
    const { lat, lng, storeLat, storeLng } = req.body;

    // Respaldo: Si el frontend no manda las de la tienda, intentamos leerlas del .env
    const originLat = storeLat || process.env.STORE_LATITUDE;
    const originLng = storeLng || process.env.STORE_LONGITUDE;

    if (!lat || !lng) {
        return res.status(400).json({ msg: 'Faltan coordenadas de destino.' });
    }

    if (!originLat || !originLng) {
        // Esto es un error de seguridad para que no calcule cosas locas si no sabe dónde está la tienda
        console.error("Error: No se definió la ubicación de la tienda (origen).");
        return res.status(500).json({ msg: 'Error de configuración de ubicación de la tienda.' });
    }

    try {
        // 2. Calcular Distancia usando el Origen Dinámico
        const distanciaKm = calcularDistanciaKm(originLat, originLng, lat, lng);
        
        // 3. Validaciones y Precio (Igual que antes)
        if (distanciaKm > RADIO_MAXIMO_KM) {
            return res.status(400).json({ 
                msg: `Lo sentimos, estás muy lejos (${distanciaKm.toFixed(1)}km). Solo entregamos a ${RADIO_MAXIMO_KM}km.` 
            });
        }

        let costoFinal = PRECIO_BASE + (distanciaKm * PRECIO_POR_KM);
        costoFinal = Math.ceil(costoFinal);

        res.json({ 
            distancia: distanciaKm.toFixed(2),
            costoEnvio: costoFinal 
        });

    } catch (error) {
        console.error("Error backend envio:", error);
        res.status(500).json({ msg: 'Error al calcular el envío.' });
    }
};