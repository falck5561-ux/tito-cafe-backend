// Ruta: TITO-CAFE-BACKEND/controllers/combosController.js
// VERSIÓN MEJORADA CON IMÁGENES MÚLTIPLES Y DESCUENTOS

const db = require('../config/db');

// OBTENER SOLO COMBOS ACTIVOS (PARA CLIENTES)
exports.obtenerPromocionesActivas = async (req, res) => {
  try {
    // La consulta no cambia, ya que trae todas las columnas
    const query = 'SELECT * FROM promociones WHERE activa = true ORDER BY id DESC';
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
};

// OBTENER TODOS LOS COMBOS (PARA ADMIN)
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

// CREAR UN NUEVO COMBO (ADMIN)
exports.crearPromocion = async (req, res) => {
  // Añadimos los nuevos campos que vienen del frontend
  const { titulo, descripcion, precio, imagenes, activa, en_oferta, descuento_porcentaje } = req.body;
  try {
    const query = `
      INSERT INTO promociones (titulo, descripcion, precio, imagenes, activa, en_oferta, descuento_porcentaje) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
    
    const imagenesJson = JSON.stringify(imagenes || []);
    const values = [titulo, descripcion, precio, imagenesJson, activa, en_oferta || false, descuento_porcentaje || 0];
    
    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
};

// ACTUALIZAR UN COMBO (ADMIN)
exports.actualizarPromocion = async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, precio, imagenes, activa, en_oferta, descuento_porcentaje } = req.body;
  try {
    const query = `
      UPDATE promociones 
      SET titulo = $1, descripcion = $2, precio = $3, imagenes = $4, activa = $5, en_oferta = $6, descuento_porcentaje = $7 
      WHERE id = $8 RETURNING *`;
      
    const imagenesJson = JSON.stringify(imagenes || []);
    const values = [titulo, descripcion, precio, imagenesJson, activa, en_oferta, descuento_porcentaje, id];
    
    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Combo no encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
};

// ELIMINAR UN COMBO (ADMIN)
exports.eliminarPromocion = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM promociones WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Combo no encontrado.' });
    }
    res.json({ msg: 'Combo eliminado.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
};