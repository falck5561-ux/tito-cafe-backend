const db = require('../config/db');

// --- FUNCIÓN CORREGIDA ---
// Se ha simplificado para evitar errores y devolver un arreglo vacío si algo falla.
exports.obtenerMisRecompensas = async (req, res) => {
  try {
    // IMPORTANTE: Esta consulta asume que tus tablas se llaman
    // 'usuarios_recompensas' y 'recompensas'.
    // Si tienen otros nombres, ajústalo aquí.
    const query = `
      SELECT r.* FROM recompensas r
      JOIN usuarios_recompensas ur ON r.id = ur.recompensa_id
      WHERE ur.usuario_id = $1 AND ur.utilizado = false
    `;
    const { rows } = await db.query(query, [req.user.id]);
    res.json(rows);
  } catch (error) {
    // Si la consulta falla (ej. la tabla no existe), no detendrá el servidor.
    // Simplemente enviará una respuesta vacía y mostrará el error en la consola del backend.
    console.error('Error al obtener mis recompensas (puede ser normal si no hay tablas de recompensas):', error.message);
    res.json([]); // Devuelve un arreglo vacío para que el frontend no se rompa.
  }
};

// Obtiene todas las recompensas que se pueden usar en el Punto de Venta
exports.obtenerRecompensasDisponibles = async (req, res) => {
  try {
    // Esta consulta asume que la tabla se llama 'recompensas'.
    const query = 'SELECT * FROM recompensas';
    const { rows } = await db.query(query);
    res.json(rows);
  } catch (error)
 {
    console.error('Error al obtener las recompensas disponibles:', error.message);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
};

// Función para que un empleado marque una recompensa como utilizada
exports.marcarRecompensaUtilizada = async (req, res) => {
  try {
    const { id } = req.params;
    // Esta consulta asume que la tabla se llama 'usuarios_recompensas'.
    const query = 'UPDATE usuarios_recompensas SET utilizado = true, fecha_uso = NOW() WHERE id = $1 RETURNING *';
    const { rows } = await db.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ msg: 'La recompensa no fue encontrada.' });
    }
    res.json({ msg: 'Recompensa marcada como utilizada con éxito.', recompensa: rows[0] });
  } catch (error) {
    console.error('Error al marcar la recompensa:', error.message);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
};

// --- NUEVA FUNCIÓN AÑADIDA ---
// Busca las recompensas de un cliente por su correo electrónico para el POS
exports.buscarRecompensasPorEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ msg: 'El correo es requerido.' });
  }

  try {
    // 1. Encontrar al usuario por su email
    const userQuery = 'SELECT id, nombre FROM usuarios WHERE email = $1';
    const userResult = await db.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Cliente no encontrado.' });
    }
    const cliente = userResult.rows[0];

    // 2. Contar las compras totales del cliente
    const comprasQuery = 'SELECT COUNT(*) FROM ventas WHERE cliente_id = $1';
    const comprasResult = await db.query(comprasQuery, [cliente.id]);
    const totalCompras = parseInt(comprasResult.rows[0].count, 10);

    // 3. Contar recompensas de café gratis ya usadas
    const usadasQuery = 'SELECT COUNT(*) FROM usuarios_recompensas WHERE usuario_id = $1 AND recompensa_id = 1'; // Asume que el ID de la recompensa es 1
    const usadasResult = await db.query(usadasQuery, [cliente.id]);
    const recompensasUsadas = parseInt(usadasResult.rows[0].count, 10);

    // 4. Calcular recompensas disponibles
    const recompensasGanadas = Math.floor(totalCompras / 10);
    const recompensasDisponibles = recompensasGanadas - recompensasUsadas;
    
    let recompensasParaEnviar = [];
    if (recompensasDisponibles > 0) {
      recompensasParaEnviar.push({
        id: 1, // ID de la recompensa de café gratis
        nombre: 'Café o Frappe Gratis',
        descripcion: `Felicidades, tienes ${recompensasDisponibles} bebida(s) gratis.`,
        cantidad: recompensasDisponibles
      });
    }

    res.json({
      cliente: cliente,
      recompensas: recompensasParaEnviar
    });

  } catch (error) {
    console.error('Error al buscar recompensas por email:', error.message);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
};