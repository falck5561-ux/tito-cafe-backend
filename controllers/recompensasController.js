const { Recompensa, UsuarioRecompensa, Usuario } = require('../models'); // Asegúrate de que los modelos que usas estén importados.

// Función para que un cliente vea sus recompensas personales
exports.obtenerMisRecompensas = async (req, res) => {
  try {
    // Aquí va tu lógica actual para obtener las recompensas del usuario logueado.
    // Usualmente se busca en una tabla intermedia como 'UsuarioRecompensa'.
    const recompensas = await UsuarioRecompensa.findAll({
      where: { usuario_id: req.user.id },
      include: [{ model: Recompensa }] // Incluye los detalles de la recompensa
    });

    if (!recompensas) {
      return res.status(404).json({ msg: 'No se encontraron recompensas para este usuario.' });
    }

    res.json(recompensas);
  } catch (error) {
    console.error('Error al obtener mis recompensas:', error);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
};

// --- FUNCIÓN NUEVA Y COMPLETA ---
// Obtiene todas las recompensas que se pueden usar en el Punto de Venta
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

// Función para que un empleado marque una recompensa como utilizada
exports.marcarRecompensaUtilizada = async (req, res) => {
  try {
    const { id } = req.params; // ID de la recompensa a utilizar (ej. ID de UsuarioRecompensa)

    // Aquí va tu lógica actual para marcar una recompensa como utilizada.
    // Usualmente se actualiza un campo 'utilizado' o 'fecha_uso' en la tabla.
    const recompensaUsuario = await UsuarioRecompensa.findByPk(id);

    if (!recompensaUsuario) {
      return res.status(404).json({ msg: 'La recompensa especificada no existe.' });
    }

    if (recompensaUsuario.utilizado) {
        return res.status(400).json({ msg: 'Esta recompensa ya ha sido utilizada.' });
    }

    recompensaUsuario.utilizado = true;
    recompensaUsuario.fecha_uso = new Date();
    await recompensaUsuario.save();

    res.json({ msg: 'Recompensa marcada como utilizada con éxito.' });
  } catch (error) {
    console.error('Error al marcar la recompensa:', error);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
};
