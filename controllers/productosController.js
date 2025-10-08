// Archivo: controllers/productosController.js (Versión Completa y Corregida)
const db = require('../config/db');

// Obtener todos los productos
exports.obtenerProductos = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM productos ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
};

// Obtener un solo producto por su ID
exports.obtenerProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM productos WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
};

// Crear un nuevo producto (incluye la URL de la imagen)
exports.crearProducto = async (req, res) => {
  const { nombre, precio, stock, categoria, imagen_url } = req.body;
  if (!nombre || !precio) {
    return res.status(400).json({ msg: 'Nombre y precio son requeridos' });
  }
  try {
    const result = await db.query(
      'INSERT INTO productos (nombre, precio, stock, categoria, imagen_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nombre, precio, stock || 0, categoria, imagen_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
};

// Actualizar un producto existente (incluye la URL de la imagen)
exports.actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precio, stock, categoria, imagen_url } = req.body;
    const result = await db.query(
      'UPDATE productos SET nombre = $1, precio = $2, stock = $3, categoria = $4, imagen_url = $5 WHERE id = $6 RETURNING *',
      [nombre, precio, stock, categoria, imagen_url, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
};

// Eliminar un producto
exports.eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }
    res.json({ msg: 'Producto eliminado' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
};
