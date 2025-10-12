const db = require('../config/db');

// OBTENER SOLO PROMOCIONES ACTIVAS (PARA CLIENTES)
exports.obtenerPromocionesActivas = async (req, res) => {
  try {
    const query = 'SELECT * FROM promociones WHERE activa = true ORDER BY id DESC';
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
};

// OBTENER TODAS LAS PROMOCIONES (PARA ADMIN)
exports.obtenerTodasPromociones = async (req, res) => {
  try {
    const query = 'SELECT * FROM promociones ORDER BY id DESC';
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
};

// CREAR UNA NUEVA PROMOCIÓN (ADMIN)
exports.crearPromocion = async (req, res) => {
  const { titulo, descripcion, precio, imagen_url, activa } = req.body;
  try {
    const query = 'INSERT INTO promociones (titulo, descripcion, precio, imagen_url, activa) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const values = [titulo, descripcion, precio, imagen_url, activa];
    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
};

// ACTUALIZAR UNA PROMOCIÓN (ADMIN)
exports.actualizarPromocion = async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, precio, imagen_url, activa } = req.body;
  try {
    const query = 'UPDATE promociones SET titulo = $1, descripcion = $2, precio = $3, imagen_url = $4, activa = $5 WHERE id = $6 RETURNING *';
    const values = [titulo, descripcion, precio, imagen_url, activa, id];
    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Promoción no encontrada.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
};

// ELIMINAR UNA PROMOCIÓN (ADMIN)
exports.eliminarPromocion = async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'DELETE FROM promociones WHERE id = $1';
    const result = await db.query(query, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Promoción no encontrada.' });
    }
    res.json({ msg: 'Promoción eliminada.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
};