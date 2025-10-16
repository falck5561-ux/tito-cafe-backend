const db = require('../config/db');

// OBTENER TODOS LOS COMBOS
exports.obtenerCombos = async (req, res) => {
  try {
    // AHORA: Solo obtenemos los combos que están marcados como visibles ('esta_activo = true')
    const query = "SELECT * FROM productos WHERE categoria = 'Combo' AND esta_activo = true ORDER BY nombre ASC";
    const result = await db.query(query);

    // Mapeamos los nombres para el frontend, como lo hemos hecho antes
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
      // AHORA: Mapeamos los dos campos por separado para los dos interruptores del frontend
      activa: comboDesdeDB.esta_activo,    // Para el interruptor de visibilidad
      oferta_activa: comboDesdeDB.en_oferta // Para el interruptor de descuento
    };
    res.json(comboParaFrontend);

  } catch (err) {
    console.error("Error al obtener el combo:", err.message);
    res.status(500).send('Error del Servidor');
  }
};

// Lógica unificada para CREAR y ACTUALIZAR un combo
const guardarCombo = async (req, res) => {
  const { id } = req.params; // Será undefined si es una creación
  // AHORA: Recibimos los dos valores de los interruptores del frontend
  const { titulo, descripcion, precio, imagenes, descuento_porcentaje, activa, oferta_activa } = req.body;
  const imagen_url = (imagenes && imagenes.length > 0) ? imagenes[0] : null;

  if (!titulo || !precio) {
    return res.status(400).json({ msg: 'El título y el precio son obligatorios.' });
  }

  try {
    let query, values;
    if (id) { // Es una actualización
      query = `
        UPDATE productos 
        SET nombre = $1, descripcion = $2, precio = $3, imagen_url = $4, 
            descuento_porcentaje = $5, en_oferta = $6, esta_activo = $7 
        WHERE id = $8 AND categoria = 'Combo' RETURNING *`;
      values = [titulo, descripcion, precio, imagen_url, descuento_porcentaje || 0, oferta_activa, activa, id];
    } else { // Es una creación
      query = `
        INSERT INTO productos (nombre, descripcion, precio, categoria, imagen_url, descuento_porcentaje, en_oferta, esta_activo) 
        VALUES ($1, $2, $3, 'Combo', $4, $5, $6, $7) RETURNING *`;
      values = [titulo, descripcion, precio, imagen_url, descuento_porcentaje || 0, oferta_activa, activa];
    }

    const result = await db.query(query, values);
    if (result.rows.length === 0 && id) {
      return res.status(404).json({ msg: 'Combo no encontrado para actualizar' });
    }
    res.status(id ? 200 : 201).json(result.rows[0]);
  } catch (err) {
    console.error(`Error al ${id ? 'actualizar' : 'crear'} combo:`, err.message);
    res.status(500).send('Error del Servidor');
  }
};

exports.crearCombo = guardarCombo;
exports.actualizarCombo = guardarCombo;


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

