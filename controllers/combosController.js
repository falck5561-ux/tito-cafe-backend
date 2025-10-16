const db = require('../config/db');

// OBTENER TODOS LOS COMBOS
exports.obtenerCombos = async (req, res) => {
  try {
    const query = "SELECT * FROM productos WHERE categoria = 'Combo' ORDER BY nombre ASC";
    const result = await db.query(query);

    const combosParaFrontend = result.rows.map(combo => ({
      ...combo,
      titulo: combo.nombre,
      imagenes: combo.imagen_url ? [combo.imagen_url] : [],
    }));

    res.json(combosParaFrontend);
  } catch (err) {
    console.error("Error al obtener combos:", err.message);
    res.status(500).send('Error del Servidor');
  }
};

// OBTENER UN SOLO COMBO POR SU ID
exports.obtenerComboPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const query = "SELECT * FROM productos WHERE id = $1 AND categoria = 'Combo'";
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Combo no encontrado' });
    }
    const comboDesdeDB = result.rows[0];

    const comboParaFrontend = {
      ...comboDesdeDB,
      titulo: comboDesdeDB.nombre,
      imagenes: comboDesdeDB.imagen_url ? [comboDesdeDB.imagen_url] : [],
      activa: comboDesdeDB.en_oferta, // Mapeamos 'en_oferta' a 'activa' para el switch
    };
    res.json(comboParaFrontend);

  } catch (err) {
    console.error("Error al obtener el combo:", err.message);
    res.status(500).send('Error del Servidor');
  }
};

// CREAR UN NUEVO COMBO
exports.crearCombo = async (req, res) => {
  // AHORA: Recibimos los nuevos campos del formulario
  const { titulo, descripcion, precio, imagenes, descuento_porcentaje, activa } = req.body;
  const imagen_url = (imagenes && imagenes.length > 0) ? imagenes[0] : null;

  if (!titulo || !precio) {
    return res.status(400).json({ msg: 'El título y el precio son obligatorios.' });
  }

  try {
    // AHORA: Insertamos los nuevos campos en la DB
    const query = `
      INSERT INTO productos (nombre, descripcion, precio, categoria, imagen_url, descuento_porcentaje, en_oferta) 
      VALUES ($1, $2, $3, 'Combo', $4, $5, $6) 
      RETURNING *`;
    
    const values = [
      titulo,
      descripcion,
      precio,
      imagen_url,
      descuento_porcentaje || 0,
      activa // 'activa' del switch se guarda en 'en_oferta'
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
  // AHORA: Recibimos los nuevos campos del formulario
  const { titulo, descripcion, precio, imagenes, descuento_porcentaje, activa } = req.body;
  const imagen_url = (imagenes && imagenes.length > 0) ? imagenes[0] : null;

  try {
    // AHORA: Actualizamos los nuevos campos en la DB
    const query = `
      UPDATE productos 
      SET nombre = $1, descripcion = $2, precio = $3, imagen_url = $4, descuento_porcentaje = $5, en_oferta = $6 
      WHERE id = $7 AND categoria = 'Combo'
      RETURNING *`;
      
    const values = [
      titulo,
      descripcion,
      precio,
      imagen_url,
      descuento_porcentaje || 0,
      activa,
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
