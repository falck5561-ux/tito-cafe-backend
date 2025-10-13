// 1. RUTA CORREGIDA para apuntar a tu archivo config/db.js
const db = require('../config/db');

// Función para que un cliente vea sus recompensas personales
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

// Obtiene todas las recompensas que se pueden usar en el Punto de Venta
exports.obtenerRecompensasDisponibles = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM recompensas WHERE activo = true');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener las recompensas disponibles:', error);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
};

// Función para que un empleado marque una recompensa como utilizada
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