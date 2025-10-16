// Archivo: controllers/combosController.js

const db = require('../config/db');

// OBTENER TODOS LOS COMBOS
exports.obtenerCombos = async (req, res) => {
  try {
    // ✅ CORRECCIÓN: Lee de la tabla 'productos' y filtra por categoría
    const query = "SELECT * FROM productos WHERE categoria = 'Combo' ORDER BY nombre ASC";
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener combos:", err.message);
    res.status(500).send('Error del Servidor');
  }
};

// ✅ NUEVA FUNCIÓN AÑADIDA: OBTENER UN SOLO COMBO POR SU ID
// Esto es lo que llenará los datos en tu formulario de "Editar Combo"
exports.obtenerComboPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const query = "SELECT * FROM productos WHERE id = $1 AND categoria = 'Combo'";
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Combo no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error al obtener el combo:", err.message);
    res.status(500).send('Error del Servidor');
  }
};

// CREAR UN NUEVO COMBO
exports.crearCombo = async (req, res) => {
  // El formulario de admin usa 'Título', lo mapeamos a 'nombre'
  const { Titulo_del_Combo, Descripcion, Precio, Imagenes_del_Combo } = req.body;

  // Extraemos la primera URL del arreglo de imágenes
  const imagen_url = (Imagenes_del_Combo && Imagenes_del_Combo.length > 0) ? Imagenes_del_Combo[0] : null;

  if (!Titulo_del_Combo || !Precio) {
    return res.status(400).json({ msg: 'El título y el precio son obligatorios.' });
  }

  try {
    // ✅ CORRECCIÓN: Inserta en la tabla 'productos' con categoría 'Combo'
    const query = `
      INSERT INTO productos (nombre, descripcion, precio, categoria, imagen_url) 
      VALUES ($1, $2, $3, 'Combo', $4) 
      RETURNING *`;
    
    const values = [
      Titulo_del_Combo,
      Descripcion,
      Precio,
      imagen_url
    ];

    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error al crear combo:", err.message);
    res.status(500).send('Error del Servidor');
  }
};


// ACTUALIZAR UN COMBO
exports.actualizarCombo = async (req, res) => {
  const { id } = req.params;
  const { Titulo_del_Combo, Descripcion, Precio, Imagenes_del_Combo } = req.body;
  const imagen_url = (Imagenes_del_Combo && Imagenes_del_Combo.length > 0) ? Imagenes_del_Combo[0] : null;

  try {
    // ✅ CORRECCIÓN: Actualiza en la tabla 'productos'
    const query = `
      UPDATE productos 
      SET nombre = $1, descripcion = $2, precio = $3, imagen_url = $4 
      WHERE id = $5 AND categoria = 'Combo'
      RETURNING *`;
      
    const values = [
      Titulo_del_Combo,
      Descripcion,
      Precio,
      imagen_url,
      id
    ];

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Combo no encontrado para actualizar' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error al actualizar combo:", err.message);
    res.status(500).send('Error del Servidor');
  }
};

// ELIMINAR UN COMBO
exports.eliminarCombo = async (req, res) => {
  const { id } = req.params;
  try {
    // ✅ CORRECCIÓN: Elimina de la tabla 'productos'
    const result = await db.query("DELETE FROM productos WHERE id = $1 AND categoria = 'Combo'", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Combo no encontrado' });
    }
    res.json({ msg: 'Combo eliminado' });
  } catch (err) {
    console.error("Error al eliminar combo:", err.message);
    res.status(500).send('Error del Servidor');
  }
};