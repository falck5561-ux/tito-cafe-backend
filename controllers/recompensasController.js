const db = require('../config/db');

// ... (tus otras funciones como obtenerMisRecompensas se quedan igual) ...
exports.obtenerMisRecompensas = async (req, res) => {
  try {
    const query = `
      SELECT r.* FROM recompensas r
      JOIN usuarios_recompensas ur ON r.id = ur.recompensa_id
      WHERE ur.usuario_id = $1 AND ur.utilizado = false
    `;
    const { rows } = await db.query(query, [req.user.id]);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener mis recompensas:', error);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
};


// --- FUNCIÓN CORREGIDA ---
exports.obtenerRecompensasDisponibles = async (req, res) => {
  try {
    // CAMBIO IMPORTANTE: He quitado el "WHERE activo = true" para evitar el error.
    // Esta consulta ahora traerá TODAS las recompensas.
    // Reemplaza "recompensas" si tu tabla se llama diferente.
    const query = 'SELECT * FROM recompensas';

    // Si sabes el nombre de tu columna "activa", puedes usar esta consulta en su lugar:
    // const query = 'SELECT * FROM recompensas WHERE TU_COLUMNA_ACTIVO = true';

    const { rows } = await db.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener las recompensas disponibles:', error);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
};


// ... (tu función marcarRecompensaUtilizada se queda igual) ...
exports.marcarRecompensaUtilizada = async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'UPDATE usuarios_recompensas SET utilizado = true, fecha_uso = NOW() WHERE id = $1 RETURNING *';
    const { rows } = await db.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ msg: 'La recompensa no fue encontrada.' });
    }

    res.json({ msg: 'Recompensa marcada como utilizada con éxito.', recompensa: rows[0] });
  } catch (error) {
    console.error('Error al marcar la recompensa:', error);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
};