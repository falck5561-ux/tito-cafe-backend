// Archivo: controllers/productosController.js

const db = require('../config/db');

// Obtener todos los productos (AHORA FILTRA INACTIVOS Y COMBOS)
exports.obtenerProductos = async (req, res) => {
  try {
    // ✅ CORRECCIÓN: Seleccionamos solo los productos que están activos y no son combos.
    const result = await db.query("SELECT * FROM productos WHERE esta_activo = true AND categoria != 'Combo' ORDER BY nombre ASC");
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
  const { nombre, descripcion, precio, stock, categoria, imagen_url, descuento_porcentaje, en_oferta } = req.body;
  
  if (!nombre || !precio) {
    return res.status(400).json({ msg: 'El nombre y el precio son campos requeridos.' });
  }

  try {
    // ✅ CORRECCIÓN: Al crear, se asegura de que el producto esté activo por defecto.
    const query = `
      INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagen_url, descuento_porcentaje, en_oferta, esta_activo) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true) 
      RETURNING *`;
    
    const values = [
      nombre,
      descripcion || null,
      precio,
      stock || 0,
      categoria || 'General',
      imagen_url || null,
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
      imagen_url,
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

// ✅ CORRECCIÓN: "Eliminar" un producto ahora lo desactiva (Soft Delete)
exports.eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    // En lugar de 'DELETE', hacemos un 'UPDATE' para cambiar el estado a inactivo.
    const query = 'UPDATE productos SET esta_activo = false WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Producto no encontrado para desactivar' });
    }
    res.json({ msg: 'Producto desactivado exitosamente' });
  } catch (err) {
    console.error(`Error al desactivar el producto ${req.params.id}:`, err.message);
    // Este error ya no debería ser por una 'foreign key', pero lo dejamos por si acaso.
    res.status(500).send('Error del Servidor');
  }
};
