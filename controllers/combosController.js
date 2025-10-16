const db = require('../config/db');

// OBTENER TODOS LOS COMBOS (PARA PÚBLICO Y ADMIN)
// Nota: Se unificaron las funciones ya que la nueva tabla no tiene columna 'activa'.
exports.obtenerCombos = async (req, res) => {
  try {
    // Es mejor ser explícito con las columnas que pides
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
  // AHORA: Usamos los nombres de columna correctos de nuestra base de datos.
  const { id, nombre, descripcion, precio, imagen_url } = req.body;

  // Verificación simple para asegurar que los datos necesarios lleguen
  if (!id || !nombre || !precio) {
    return res.status(400).json({ msg: 'Los campos id, nombre y precio son obligatorios.' });
  }

  try {
    const query = `
      INSERT INTO combos (id, nombre, descripcion, precio, imagen_url) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *`;
    
    const values = [
      id, 
      nombre, // ANTES: 'titulo'
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

// ACTUALIZAR UN COMBO
exports.actualizarCombo = async (req, res) => {
  const { id } = req.params;
  // AHORA: Usamos los nombres de columna correctos
  const { nombre, descripcion, precio, imagen_url } = req.body;
  try {
    const query = `
      UPDATE combos 
      SET nombre = $1, descripcion = $2, precio = $3, imagen_url = $4 
      WHERE id = $5 
      RETURNING *`;
      
    const values = [
      nombre, // ANTES: 'titulo'
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

// ELIMINAR UN COMBO (Esta función estaba correcta, no necesita cambios)
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