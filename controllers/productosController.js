// Archivo: controllers/productosController.js
// VERSIÓN FINAL CON CORRECCIÓN PARA GUARDAR IMÁGENES JSON

const db = require('../config/db');

// Obtener todos los productos
exports.obtenerProductos = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM productos ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener productos:", err.message);
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
    console.error(`Error al obtener producto ${req.params.id}:`, err.message);
    res.status(500).send('Error del Servidor');
  }
};

// Crear un nuevo producto (con corrección para JSON)
exports.crearProducto = async (req, res) => {
  const { nombre, descripcion, precio, stock, categoria, imagenes, descuento_porcentaje, en_oferta } = req.body;
  if (!nombre || !precio) {
    return res.status(400).json({ msg: 'El nombre y el precio son campos requeridos.' });
  }
  try {
    const query = `
      INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagenes, descuento_porcentaje, en_oferta) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`;
    
    // CORRECCIÓN: Convertimos explícitamente el arreglo a un string JSON.
    const imagenesJson = JSON.stringify(imagenes || []);

    const values = [
      nombre,
      descripcion || null,
      precio,
      stock || 0,
      categoria || null,
      imagenesJson, // Se pasa el string JSON
      descuento_porcentaje || 0,
      en_oferta || false
    ];
    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error al crear el producto:", err.message);
    res.status(500).send('Error del Servidor');
  }
};

// Actualizar un producto existente (con corrección para JSON)
exports.actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, categoria, imagenes, descuento_porcentaje, en_oferta } = req.body;

    if (nombre === undefined || precio === undefined) {
      return res.status(400).json({ msg: 'El nombre y el precio no pueden estar vacíos.' });
    }

    const query = `
      UPDATE productos 
      SET nombre = $1, descripcion = $2, precio = $3, stock = $4, categoria = $5, imagenes = $6, descuento_porcentaje = $7, en_oferta = $8 
      WHERE id = $9 
      RETURNING *`;
    
    // CORRECCIÓN: Convertimos explícitamente el arreglo a un string JSON.
    const imagenesJson = JSON.stringify(imagenes || []);
    
    const values = [
      nombre,
      descripcion,
      precio,
      stock,
      categoria,
      imagenesJson, // Se pasa el string JSON
      descuento_porcentaje,
      en_oferta,
      id
    ];
    
    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Producto no encontrado para actualizar' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error al actualizar el producto ${req.params.id}:`, err.message);
    res.status(500).send('Error del Servidor');
  }
};

// Eliminar un producto
exports.eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Producto no encontrado para eliminar' });
    }
    res.json({ msg: 'Producto eliminado exitosamente' });
  } catch (err) {
    console.error(`Error al eliminar el producto ${req.params.id}:`, err.message);
    res.status(500).send('Error del Servidor');
  }
};