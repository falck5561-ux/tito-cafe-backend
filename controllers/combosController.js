const db = require('../config/db');

// OBTENER TODOS LOS COMBOS (PARA PÚBLICO Y ADMIN)
exports.obtenerCombos = async (req, res) => {
  try {
    const query = 'SELECT id, nombre, descripcion, precio, imagen_url FROM combos ORDER BY nombre ASC';
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener combos:", err.message);
    res.status(500).send('Error del Servidor');
  }
};

// CREAR UN NUEVO COMBO
exports.crearCombo = async (req, res) => {
  // ANTES: Esperábamos un 'id' que el frontend no enviaba.
  // AHORA: Ya no pedimos el 'id', solo los datos del formulario.
  const { nombre, descripcion, precio, imagen_url } = req.body;

  // ANTES: La validación fallaba porque el 'id' estaba vacío.
  // AHORA: La validación solo comprueba los datos que sí recibimos.
  if (!nombre || !precio) {
    return res.status(400).json({ msg: 'Los campos nombre y precio son obligatorios.' });
  }

  try {
    // --- ¡LA CORRECCIÓN ESTÁ AQUÍ! ---
    // Generamos el ID en el backend a partir del nombre (creando un "slug").
    const id = nombre
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '');

    const query = `
      INSERT INTO combos (id, nombre, descripcion, precio, imagen_url) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *`;
    
    const values = [
      id, // Usamos el ID que acabamos de generar
      nombre,
      descripcion, 
      precio, 
      imagen_url
    ];

    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error al crear combo:", err.message);
    res.status(500).send('Error del Servidor');
  }
};

// ACTUALIZAR UN COMBO (Esta función ya estaba correcta)
exports.actualizarCombo = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, imagen_url } = req.body;
  try {
    const query = `
      UPDATE combos 
      SET nombre = $1, descripcion = $2, precio = $3, imagen_url = $4 
      WHERE id = $5 
      RETURNING *`;
      
    const values = [
      nombre,
      descripcion, 
      precio, 
      imagen_url,
      id
    ];

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Combo no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error al actualizar combo:", err.message);
    res.status(500).send('Error del Servidor');
  }
};

// ELIMINAR UN COMBO (Esta función ya estaba correcta)
exports.eliminarCombo = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM combos WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Combo no encontrado' });
    }
    res.json({ msg: 'Combo eliminado' });
  } catch (err) {
    console.error("Error al eliminar combo:", err.message);
    res.status(500).send('Error del Servidor');
  }
};