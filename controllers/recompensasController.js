// --- COPIA Y PEGA ESTA FUNCIÓN DENTRO DE TU ARCHIVO recompensasController.js ---

// Asegúrate de que el modelo Recompensa esté importado al inicio del archivo.
// Deberías tener una línea como esta: const { Recompensa } = require('../models');

exports.obtenerRecompensasDisponibles = async (req, res) => {
  try {
    // Esta consulta busca todas las recompensas.
    // Puedes ajustarla si necesitas filtrar solo las que estén activas
    // o sean de un tipo específico para el punto de venta.
    const recompensas = await Recompensa.findAll({
      // Ejemplo de un filtro que podrías agregar:
      // where: {
      //   activo: true
      // }
    });

    res.json(recompensas);
  } catch (error) {
    console.error('Error al obtener las recompensas disponibles:', error);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
};