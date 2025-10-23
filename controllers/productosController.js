// Archivo: controllers/productosController.js

const db = require('../config/db');

// Obtener todos los productos (AHORA FILTRA INACTIVOS Y COMBOS)
exports.obtenerProductos = async (req, res) => {
  const { tiendaId } = req; // <--- MODIFICADO (Obtenemos el ID de la tienda)
  
  try {
    // ✅ CORRECCIÓN: Seleccionamos solo los productos que están activos, no son combos Y PERTENECEN A LA TIENDA.
    const query = `
      SELECT * FROM productos 
      WHERE esta_activo = true AND categoria != 'Combo' AND tienda_id = $1 
      ORDER BY nombre ASC
    `; // <--- MODIFICADO
    
    const result = await db.query(query, [tiendaId]); // <--- MODIFICADO (Pasamos el ID de la tienda)
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener productos:", err.message);
    res.status(500).send('Error del Servidor');
  }
};

// Obtener un solo producto por su ID
exports.obtenerProductoPorId = async (req, res) => {
  const { tiendaId } = req; // <--- MODIFICADO (Obtenemos el ID de la tienda)
  const { id } = req.params; // <--- MODIFICADO

  try {
    // ✅ CORRECCIÓN: Buscamos el producto por ID y nos aseguramos que sea de la tienda correcta.
    const result = await db.query(
      'SELECT * FROM productos WHERE id = $1 AND tienda_id = $2', 
      [id, tiendaId] // <--- MODIFICADO
    );
    
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
  const { tiendaId } = req; // <--- MODIFICADO (Obtenemos el ID de la tienda)
  const { nombre, descripcion, precio, stock, categoria, imagen_url, descuento_porcentaje, en_oferta } = req.body;
  
  if (!nombre || !precio) {
    return res.status(400).json({ msg: 'El nombre y el precio son campos requeridos.' });
  }

  try {
    // ✅ CORRECCIÓN: Al crear, se asegura de que esté activo Y SE LE ASIGNA EL ID DE LA TIENDA.
    const query = `
      INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagen_url, descuento_porcentaje, en_oferta, esta_activo, tienda_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9) 
      RETURNING *`; // <--- MODIFICADO (Añadimos tienda_id y $9)
    
    const values = [
      nombre,
      descripcion || null,
      precio,
      stock || 0,
      categoria || 'General',
      imagen_url || null,
      descuento_porcentaje || 0,
      en_oferta || false,
      tiendaId // <--- MODIFICADO (Añadimos el ID de la tienda a los valores)
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
  const { tiendaId } = req; // <--- MODIFICADO (Obtenemos el ID de la tienda)
  const { id } = req.params; // <--- MODIFICADO

  try {
    const { nombre, descripcion, precio, stock, categoria, imagen_url, descuento_porcentaje, en_oferta } = req.body;

    // ✅ CORRECCIÓN: Al actualizar, se asegura de que solo se actualice el producto de la tienda correcta.
    const query = `
      UPDATE productos 
      SET nombre = $1, descripcion = $2, precio = $3, stock = $4, categoria = $5, imagen_url = $6, descuento_porcentaje = $7, en_oferta = $8 
      WHERE id = $9 AND tienda_id = $10
      RETURNING *`; // <--- MODIFICADO (Añadimos AND tienda_id = $10)
    
    const values = [
      nombre,
      descripcion,
      precio,
      stock,
      categoria,
      imagen_url,
      descuento_porcentaje,
      en_oferta,
      id,
      tiendaId // <--- MODIFICADO (Añadimos el ID de la tienda a los valores)
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

// "Eliminar" un producto (Soft Delete)
exports.eliminarProducto = async (req, res) => {
  const { tiendaId } = req; // <--- MODIFICADO (Obtenemos el ID de la tienda)
  const { id } = req.params; // <--- MODIFICADO

  try {
    // ✅ CORRECCIÓN: Solo desactiva el producto si el ID y el ID de la tienda coinciden.
    const query = `
      UPDATE productos SET esta_activo = false 
      WHERE id = $1 AND tienda_id = $2 
      RETURNING *`; // <--- MODIFICADO (Añadimos AND tienda_id = $2)
      
    const result = await db.query(query, [id, tiendaId]); // <--- MODIFICADO (Pasamos ambos IDs)
    
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Producto no encontrado para desactivar' });
    }
    res.json({ msg: 'Producto desactivado exitosamente' });
  } catch (err) {
    console.error(`Error al desactivar el producto ${req.params.id}:`, err.message);
    res.status(500).send('Error del Servidor');
  }
};