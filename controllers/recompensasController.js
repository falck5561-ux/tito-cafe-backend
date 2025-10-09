// Archivo: controllers/recompensasController.js

const db = require('../config/db');

// Obtiene las recompensas de un cliente (esta ya la tenías)
exports.obtenerMisRecompensas = async (req, res) => {
  try {
    const id_cliente = req.user.id;
    const query = `
      SELECT id, descripcion, fecha_creacion 
      FROM recompensas 
      WHERE id_cliente = $1 AND utilizado = FALSE 
      ORDER BY fecha_creacion DESC;
    `;
    const result = await db.query(query, [id_cliente]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
};

// --- NUEVA FUNCIÓN ---
// Marca una recompensa como utilizada (para empleados/jefes)
exports.marcarRecompensaUtilizada = async (req, res) => {
  const { id } = req.params; // El ID de la recompensa

  try {
    const query = 'UPDATE recompensas SET utilizado = TRUE WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Recompensa no encontrada.' });
    }

    res.json({ msg: 'Recompensa marcada como utilizada.', recompensa: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
};