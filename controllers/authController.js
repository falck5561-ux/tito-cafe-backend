// Archivo: controllers/authController.js (Actualizado con Google Login)

// --- Tus imports actuales ---
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- NUEVO: Imports para Google ---
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID; 
const client = new OAuth2Client(GOOGLE_CLIENT_ID);


// --- Tu función de LOGIN (sin cambios) ---
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ msg: 'Por favor, ingrese email y contraseña' });
  }
  try {
    const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }
    
    // Verificamos si el usuario tiene contraseña (los de Google no tendrán)
    if (!user.password_hash) {
      return res.status(400).json({ msg: 'Por favor, inicia sesión con Google.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    // Tu payload actual
    const payload = {
      user: { id: user.id, rol: user.rol }
    };

    // Tu firma de token actual
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' }, // Usamos tu tiempo de expiración
      (err, token) => {
        if (err) throw err;
        res.json({ token }); // Enviamos solo el token
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(5.00).send('Error del servidor');
  }
};


// --- NUEVO: Función para GOOGLE LOGIN ---
exports.googleLogin = async (req, res) => {
  const { token } = req.body; 

  try {
    // 1. Verificar el token de Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    
    const { name, email, sub } = ticket.getPayload();
    const googleId = sub; 

    // 2. Buscar al usuario por googleid
    let userResult = await db.query('SELECT * FROM usuarios WHERE googleid = $1', [googleId]);
    let user = userResult.rows[0];

    if (!user) {
      // 3. Si no existe, buscar por email (para vincular)
      userResult = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
      user = userResult.rows[0];

      if (user) {
        // 4A. Usuario existe (se registró con email/pass), vinculamos su googleId
        userResult = await db.query(
          'UPDATE usuarios SET googleid = $1 WHERE email = $2 RETURNING *',
          [googleId, email]
        );
        user = userResult.rows[0];
      } else {
        // 4B. Usuario no existe. Lo creamos (sin password_hash)
        userResult = await db.query(
          'INSERT INTO usuarios (nombre, email, googleid, rol) VALUES ($1, $2, $3, $4) RETURNING *',
          [name, email, googleId, 'Cliente'] // Rol por defecto 'Cliente'
        );
        user = userResult.rows[0];
      }
    }

    // 5. Creamos el payload EXACTAMENTE IGUAL que en tu login normal
    const payload = {
      user: { id: user.id, rol: user.rol }
    };
    
    // 6. Firmamos el token EXACTAMENTE IGUAL que en tu login normal
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' },
      (err, miToken) => {
        if (err) throw err;
        res.json({ token: miToken }); // Enviamos solo el token
      }
    );

  } catch (error) {
    console.error("Error en Google Login:", error.message);
    res.status(401).json({ msg: 'Autenticación de Google fallida.' });
  }
};