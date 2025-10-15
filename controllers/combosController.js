const db = require('../config/db');

// OBTENER TODOS LOS COMBOS ACTIVOS (PARA PÚBLICO/CLIENTES)
exports.obtenerCombosActivos = async (req, res) => {
  try {
    const query = 'SELECT * FROM combos WHERE activa = true ORDER BY id ASC';
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener combos activos:", err.message);
    res.status(500).send('Error del Servidor');
  }
};

// OBTENER ABSOLUTAMENTE TODOS LOS COMBOS (PARA GESTIÓN DE ADMIN)
exports.obtenerTodosLosCombos = async (req, res) => {
  try {
    const query = 'SELECT * FROM combos ORDER BY id ASC';
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener todos los combos para admin:", err.message);
    res.status(500).send('Error del Servidor');
  }
};

// CREAR UN NUEVO COMBO
exports.crearCombo = async (req, res) => {
  const { titulo, descripcion, precio, imagenes, descuento_porcentaje, activa } = req.body;
  try {
    const precioOferta = (descuento_porcentaje > 0) 
      ? precio * (1 - descuento_porcentaje / 100) 
      : 0;

    const query = `
      INSERT INTO combos (titulo, descripcion, precio, imagenes, descuento_porcentaje, activa, precio_oferta) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`;
    
    const values = [
      titulo, 
      descripcion, 
      precio, 
      JSON.stringify(imagenes || []), 
      descuento_porcentaje || 0, 
      activa || false,
      precioOferta
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
  const { titulo, descripcion, precio, imagenes, descuento_porcentaje, activa } = req.body;
  try {
    const precioOferta = (descuento_porcentaje > 0) 
      ? precio * (1 - descuento_porcentaje / 100) 
      : 0;

    const query = `
      UPDATE combos 
      SET titulo = $1, descripcion = $2, precio = $3, imagenes = $4, descuento_porcentaje = $5, activa = $6, precio_oferta = $7 
      WHERE id = $8 
      RETURNING *`;
      
    const values = [
      titulo, 
      descripcion, 
      precio, 
      JSON.stringify(imagenes || []), 
      descuento_porcentaje || 0, 
      activa || false,
      precioOferta,
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

// ELIMINAR UN COMBO
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

