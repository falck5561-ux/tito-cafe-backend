const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

//=================================================================
// REGISTRAR UN NUEVO USUARIO (CLIENTE)
//=================================================================
exports.register = async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ msg: 'Por favor, ingrese nombre, email y contraseña.' });
  }

  try {
    let user = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (user.rows.length > 0) {
      return res.status(400).json({ msg: 'El correo electrónico ya está registrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUserQuery = 'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id, rol';
    const newUser = await db.query(newUserQuery, [nombre, email, password_hash, 'Cliente']);
    
    const payload = { user: { id: newUser.rows[0].id, rol: newUser.rows[0].rol } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ token });
      }
    );
  } catch (err) {
    console.error("Error en register:", err.message);
    res.status(500).send('Error del Servidor');
  }
};

//=================================================================
// INICIAR SESIÓN (LOGIN)
//=================================================================
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ msg: 'Por favor, ingrese email y contraseña.' });
  }
  try {
    const userResult = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ msg: 'Credenciales inválidas.' });
    }
    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciales inválidas.' });
    }

    const payload = { user: { id: user.id, rol: user.rol } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error("Error en login:", err.message);
    res.status(500).send('Error del Servidor');
  }
};

//=================================================================
// BUSCAR CLIENTE Y SUS RECOMPENSAS (PARA EMPLEADOS)
//=================================================================
exports.findUserByEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ msg: 'El email es requerido.' });
  }
  try {
    const userQuery = 'SELECT id, nombre, email FROM usuarios WHERE email = $1 AND rol = \'Cliente\'';
    const userResult = await db.query(userQuery, [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Cliente no encontrado.' });
    }
    const cliente = userResult.rows[0];

    const recompensasQuery = 'SELECT * FROM recompensas WHERE id_cliente = $1 AND utilizado = FALSE';
    const recompensasResult = await db.query(recompensasQuery, [cliente.id]);

    res.json({ cliente, recompensas: recompensasResult.rows });
  } catch (err) {
    console.error("Error en findUserByEmail:", err.message);
    res.status(500).send('Error del Servidor');
  }
};

//=================================================================
// GESTIONAR DIRECCIÓN GUARDADA DEL CLIENTE (VERSIÓN ACTUALIZADA)
//=================================================================

// Obtiene la dirección guardada, incluyendo la referencia
exports.obtenerMiDireccion = async (req, res) => {
  try {
    const query = 'SELECT direccion_guardada FROM usuarios WHERE id = $1';
    const result = await db.query(query, [req.user.id]);

    if (result.rows.length > 0 && result.rows[0].direccion_guardada) {
      res.json(result.rows[0].direccion_guardada);
    } else {
      res.json(null); // Envía null si no hay nada guardado
    }
  } catch (error) {
    console.error("Error en obtenerMiDireccion:", error.message);
    res.status(500).send('Error en el servidor');
  }
};

// Actualiza la dirección Y la referencia del cliente
exports.actualizarMiDireccion = async (req, res) => {
  // Se extraen todos los campos, incluyendo la referencia (puede ser null)
  const { lat, lng, description, referencia } = req.body;
  const id_cliente = req.user.id;

  if (lat === undefined || lng === undefined || !description) {
    return res.status(400).json({ msg: 'Faltan datos de la dirección.' });
  }

  // Se construye el objeto completo que se guardará en la base de datos
  const direccionCompleta = {
    lat,
    lng,
    description,
    referencia
  };

  try {
    const query = 'UPDATE usuarios SET direccion_guardada = $1 WHERE id = $2 RETURNING direccion_guardada';
    // Se envía el objeto completo a la columna de tipo JSONB
    const result = await db.query(query, [direccionCompleta, id_cliente]);

    res.json(result.rows[0].direccion_guardada);
  } catch (error) {
    console.error('Error al actualizar la dirección:', error);
    res.status(500).send('Error en el servidor');
  }
};