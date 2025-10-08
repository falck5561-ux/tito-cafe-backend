// Archivo: config/db.js
// Carga las variables de entorno para obtener la URL de la base de datos
require('dotenv').config();
const { Pool } = require('pg');

// Crea el pool de conexiones usando la URL del archivo .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Mensaje de confirmación cuando la conexión es exitosa
pool.on('connect', () => {
  console.log('¡Conectado a PostgreSQL!');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};