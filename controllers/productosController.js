// Archivo: controllers/productosController.js

const db = require('../config/db');

// Obtener todos los productos (AHORA FILTRA LOS COMBOS)
exports.obtenerProductos = async (req, res) => {
  try {
    // ✅ CORRECCIÓN: Seleccionamos solo los que NO son de categoría 'Combo'
    const result = await db.query("SELECT * FROM productos WHERE categoria != 'Combo' ORDER BY nombre ASC");
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

// Crear un nuevo producto
exports.crearProducto = async (req, res) => {
  // ✅ CORRECCIÓN: Usamos 'imagen_url' en lugar de 'imagenes'
  const { nombre, descripcion, precio, stock, categoria, imagen_url, descuento_porcentaje, en_oferta } = req.body;
  
  if (!nombre || !precio) {
    return res.status(400).json({ msg: 'El nombre y el precio son campos requeridos.' });
  }

  try {
    const query = `
      INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagen_url, descuento_porcentaje, en_oferta) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`;
    
    const values = [
      nombre,
      descripcion || null,
      precio,
      stock || 0,
      categoria || 'General', // Categoria por defecto si no se especifica
      imagen_url || null,    // Se guarda la URL directamente
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

// Actualizar un producto existente
exports.actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    // ✅ CORRECCIÓN: Usamos 'imagen_url' en lugar de 'imagenes'
    const { nombre, descripcion, precio, stock, categoria, imagen_url, descuento_porcentaje, en_oferta } = req.body;

    const query = `
      UPDATE productos 
      SET nombre = $1, descripcion = $2, precio = $3, stock = $4, categoria = $5, imagen_url = $6, descuento_porcentaje = $7, en_oferta = $8 
      WHERE id = $9 
      RETURNING *`;
    
    const values = [
      nombre,
      descripcion,
      precio,
      stock,
      categoria,
      imagen_url, // Se pasa la URL directamente
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