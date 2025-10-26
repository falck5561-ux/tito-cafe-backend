// Archivo: controllers/combosController.js
const db = require('../config/db');

// OBTENER TODOS LOS COMBOS (PÚBLICO - PARA CLIENTES)
// Esta función está bien, solo obtiene los activos.
exports.obtenerCombos = async (req, res) => {
  const { tiendaId } = req; 

  try {
    const query = `
      SELECT * FROM productos 
      WHERE categoria = 'Combo' AND esta_activo = true AND tienda_id = $1 
      ORDER BY nombre ASC
    `; 
    
    const result = await db.query(query, [tiendaId]); 

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

// =============================================================
// ¡NUEVA FUNCIÓN PARA TU PANEL DE ADMIN!
// =============================================================
// OBTENER TODOS LOS COMBOS (PARA ADMIN)
// Esta trae activos E inactivos, para que puedas ver todo en tu panel.
exports.obtenerTodosLosCombosAdmin = async (req, res) => {
  const { tiendaId } = req; 

  try {
    // La única diferencia es que NO filtramos por "esta_activo = true"
    const query = `
      SELECT * FROM productos 
      WHERE categoria = 'Combo' AND tienda_id = $1 
      ORDER BY id ASC
    `;
    
    const result = await db.query(query, [tiendaId]);
    
    // El panel de admin puede recibir los datos "crudos" de la DB
    res.json(result.rows);

  } catch (err) {
    console.error("Error al obtener combos (Admin):", err.message);
    res.status(500).send('Error del Servidor');
  }
};
// =============================================================


// OBTENER UN SOLO COMBO POR SU ID
exports.obtenerComboPorId = async (req, res) => {
  // ... (Tu código existente está bien, no hay que cambiarlo) ...
  const { tiendaId } = req; 
  const { id } = req.params;
  try {
    const query = `
      SELECT * FROM productos 
      WHERE id = $1 AND categoria = 'Combo' AND tienda_id = $2
    `;
    const result = await db.query(query, [id, tiendaId]); 
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
  // ... (Tu código existente está bien, no hay que cambiarlo) ...
  const { tiendaId } = req;
  const { id } = req.params; 
  const { titulo, descripcion, precio, imagenes, descuento_porcentaje, activa, oferta_activa } = req.body;
  const imagen_url = (imagenes && imagenes.length > 0) ? imagenes[0] : null;
  if (!titulo || !precio) {
    return res.status(400).json({ msg: 'El título y el precio son obligatorios.' });
  }
  try {
    let query, values;
    if (id) {
      query = `
        UPDATE productos 
        SET nombre = $1, descripcion = $2, precio = $3, imagen_url = $4, 
            descuento_porcentaje = $5, en_oferta = $6, esta_activo = $7 
        WHERE id = $8 AND categoria = 'Combo' AND tienda_id = $9 
        RETURNING *`;
      values = [titulo, descripcion, precio, imagen_url, descuento_porcentaje || 0, oferta_activa, activa, id, tiendaId];
    } else {
      query = `
        INSERT INTO productos (nombre, descripcion, precio, categoria, imagen_url, descuento_porcentaje, en_oferta, esta_activo, tienda_id) 
        VALUES ($1, $2, $3, 'Combo', $4, $5, $6, $7, $8) 
        RETURNING *`;
      values = [titulo, descripcion, precio, imagen_url, descuento_porcentaje || 0, oferta_activa, activa, tiendaId];
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


// =============================================================
// ¡AQUÍ ESTÁ LA CORRECCIÓN!
// =============================================================
// DESACTIVAR UN COMBO (Soft Delete)
// Reemplaza a 'eliminarCombo'
exports.desactivarCombo = async (req, res) => {
  const { tiendaId } = req; 
  const { id } = req.params;

  try {
    // En lugar de DELETE, usamos UPDATE para poner "esta_activo = false"
    const query = `
      UPDATE productos 
      SET esta_activo = false 
      WHERE id = $1 AND categoria = 'Combo' AND tienda_id = $2
      RETURNING *
    `; // <--- MODIFICADO
    
    const result = await db.query(query, [id, tiendaId]); // <--- MODIFICADO
    
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Combo no encontrado o no pertenece a esta tienda' });
    }
    // Enviamos 200 (OK) y un mensaje.
    res.json({ msg: 'Combo desactivado exitosamente' });

  } catch (err) {
    // ¡Esto ya no debería fallar por "foreign key"!
    console.error("Error al desactivar combo:", err.message);
    res.status(500).send('Error del Servidor');
  }
};

// Esta función ya no la usaremos, pero la dejamos comentada
// exports.eliminarCombo = async (req, res) => { ... }
// =============================================================

