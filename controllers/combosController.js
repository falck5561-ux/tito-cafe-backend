// Archivo: controllers/combosController.js

const db = require('../config/db');

// OBTENER TODOS LOS COMBOS
exports.obtenerCombos = async (req, res) => {
  const { tiendaId } = req; // <--- MODIFICADO (Obtenemos el ID de la tienda)

  try {
    // AHORA: Obtenemos combos activos Y que pertenezcan a la tienda.
    const query = `
      SELECT * FROM productos 
      WHERE categoria = 'Combo' AND esta_activo = true AND tienda_id = $1 
      ORDER BY nombre ASC
    `; // <--- MODIFICADO
    
    const result = await db.query(query, [tiendaId]); // <--- MODIFICADO (Pasamos el ID)

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
  const { tiendaId } = req; // <--- MODIFICADO (Obtenemos el ID de la tienda)
  const { id } = req.params;

  try {
    // AHORA: Buscamos el combo por ID y que pertenezca a la tienda.
    const query = `
      SELECT * FROM productos 
      WHERE id = $1 AND categoria = 'Combo' AND tienda_id = $2
    `; // <--- MODIFICADO
    
    const result = await db.query(query, [id, tiendaId]); // <--- MODIFICADO (Pasamos ambos IDs)

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Combo no encontrado' });
    }
    const comboDesdeDB = result.rows[0];

    const comboParaFrontend = {
      ...comboDesdeDB,
      titulo: comboDesdeDB.nombre,
      imagenes: comboDesdeDB.imagen_url ? [comboDesdeDB.imagen_url] : [],
      activa: comboDesdeDB.esta_activo,
      oferta_activa: comboDesdeDB.en_oferta
    };
    res.json(comboParaFrontend);

  } catch (err) {
    console.error("Error al obtener el combo:", err.message);
    res.status(500).send('Error del Servidor');
  }
};

// Lógica unificada para CREAR y ACTUALIZAR un combo
const guardarCombo = async (req, res) => {
  const { tiendaId } = req; // <--- MODIFICADO (Obtenemos el ID de la tienda)
  const { id } = req.params; 
  const { titulo, descripcion, precio, imagenes, descuento_porcentaje, activa, oferta_activa } = req.body;
  const imagen_url = (imagenes && imagenes.length > 0) ? imagenes[0] : null;

  if (!titulo || !precio) {
    return res.status(400).json({ msg: 'El título y el precio son obligatorios.' });
  }

  try {
    let query, values;
    if (id) { // Es una actualización
      // AHORA: Solo actualiza si el ID Y el tienda_id coinciden.
      query = `
        UPDATE productos 
        SET nombre = $1, descripcion = $2, precio = $3, imagen_url = $4, 
            descuento_porcentaje = $5, en_oferta = $6, esta_activo = $7 
        WHERE id = $8 AND categoria = 'Combo' AND tienda_id = $9 
        RETURNING *`; // <--- MODIFICADO (Añadimos tienda_id = $9)
      values = [titulo, descripcion, precio, imagen_url, descuento_porcentaje || 0, oferta_activa, activa, id, tiendaId]; // <--- MODIFICADO (Añadimos tiendaId)
    
    } else { // Es una creación
      // AHORA: Al crear, se "etiqueta" con el tienda_id.
      query = `
        INSERT INTO productos (nombre, descripcion, precio, categoria, imagen_url, descuento_porcentaje, en_oferta, esta_activo, tienda_id) 
        VALUES ($1, $2, $3, 'Combo', $4, $5, $6, $7, $8) 
        RETURNING *`; // <--- MODIFICADO (Añadimos tienda_id y $8)
      values = [titulo, descripcion, precio, imagen_url, descuento_porcentaje || 0, oferta_activa, activa, tiendaId]; // <--- MODIFICADO (Añadimos tiendaId)
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
  const { tiendaId } = req; // <--- MODIFICADO (Obtenemos el ID de la tienda)
  const { id } = req.params;

  try {
    // AHORA: Solo elimina si el ID Y el tienda_id coinciden.
    const query = `
      DELETE FROM productos 
      WHERE id = $1 AND categoria = 'Combo' AND tienda_id = $2
    `; // <--- MODIFICADO
    
    const result = await db.query(query, [id, tiendaId]); // <--- MODIFICADO (Pasamos ambos IDs)
    
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Combo no encontrado o no pertenece a esta tienda' });
    }
    res.json({ msg: 'Combo eliminado' });
  } catch (err) {
    console.error("Error al eliminar combo:", err.message);
    res.status(500).send('Error del Servidor');
  }
};