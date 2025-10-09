// Archivo: controllers/userController.js (Completo y Actualizado)

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Registrar un nuevo usuario (Cliente)
exports.register = async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ msg: 'Por favor, ingrese nombre, email y contraseña.' });
  }

  try {
    // 1. Verificar si el email ya existe
    let user = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (user.rows.length > 0) {
      return res.status(400).json({ msg: 'El correo electrónico ya está registrado.' });
    }

    // 2. Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 3. Guardar el nuevo usuario en la base de datos con rol 'Cliente'
    const newUserQuery = 'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id, rol';
    const newUser = await db.query(newUserQuery, [nombre, email, password_hash, 'Cliente']);
    
    // 4. Crear y devolver un token para que el usuario inicie sesión automáticamente
    const payload = {
      user: {
        id: newUser.rows[0].id,
        rol: newUser.rows[0].rol
      }
    };

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
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
};

// --- FUNCIÓN AÑADIDA ---
// Busca un cliente por su email y devuelve sus recompensas pendientes (para empleados/jefes)
exports.findUserByEmail = async (req, res) => {
  const { email } = req.body;
  try {
    // Busca al cliente por su email
    const userQuery = 'SELECT id, nombre, email FROM usuarios WHERE email = $1 AND rol = \'Cliente\'';
    const userResult = await db.query(userQuery, [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Cliente no encontrado.' });
    }
    const cliente = userResult.rows[0];

    // Busca las recompensas pendientes de ese cliente
    const recompensasQuery = 'SELECT * FROM recompensas WHERE id_cliente = $1 AND utilizado = FALSE';
    const recompensasResult = await db.query(recompensasQuery, [cliente.id]);

    res.json({ cliente, recompensas: recompensasResult.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
};