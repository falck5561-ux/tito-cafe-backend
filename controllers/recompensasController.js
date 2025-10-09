// Archivo: controllers/recompensasController.js

const db = require('../config/db');

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