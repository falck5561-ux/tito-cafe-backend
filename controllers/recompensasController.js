const db = require('../config/db');

// --- OTRAS FUNCIONES (SE MANTIENEN IGUAL) ---
exports.obtenerMisRecompensas = async (req, res) => {
  try {
    const query = `
      SELECT r.* FROM recompensas r
      JOIN usuarios_recompensas ur ON r.id = ur.recompensa_id
      WHERE ur.usuario_id = $1 AND ur.utilizado = false
    `;
    const { rows } = await db.query(query, [req.user.id]);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener mis recompensas:', error.message);
    res.json([]);
  }
};

exports.obtenerRecompensasDisponibles = async (req, res) => {
  try {
    const query = 'SELECT * FROM recompensas';
    const { rows } = await db.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener las recompensas disponibles:', error.message);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
};

exports.marcarRecompensaUtilizada = async (req, res) => {
  try {
    const { id } = req.params;
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

// --- FUNCIÓN DE BÚSQUEDA CORREGIDA Y MEJORADA ---
exports.buscarRecompensasPorEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ msg: 'El correo es requerido.' });
  }

  try {
    // 1. Encontrar al usuario por su email. (Asumo que la tabla es 'usuarios')
    const userQuery = 'SELECT id, nombre FROM usuarios WHERE email = $1';
    const userResult = await db.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Cliente no encontrado.' });
    }
    const cliente = userResult.rows[0];

    // 2. Contar las compras totales del cliente.
    // IMPORTANTE: Revisa que tu tabla de ventas se llame 'ventas' y la columna sea 'cliente_id'.
    const comprasQuery = 'SELECT COUNT(*) FROM ventas WHERE cliente_id = $1';
    const comprasResult = await db.query(comprasQuery, [cliente.id]);
    const totalCompras = parseInt(comprasResult.rows[0].count, 10);

    // 3. Contar recompensas de café gratis ya usadas (de forma segura).
    let recompensasUsadas = 0;
    try {
      // Esta consulta puede fallar si no tienes la tabla 'usuarios_recompensas'.
      // IMPORTANTE: Revisa que la tabla se llame 'usuarios_recompensas'.
      const usadasQuery = 'SELECT COUNT(*) FROM usuarios_recompensas WHERE usuario_id = $1 AND recompensa_id = 1';
      const usadasResult = await db.query(usadasQuery, [cliente.id]);
      if (usadasResult.rows.length > 0) {
        recompensasUsadas = parseInt(usadasResult.rows[0].count, 10);
      }
    } catch (e) {
      // Si la tabla no existe, no detenemos el servidor.
      console.log("Nota: No se encontró la tabla 'usuarios_recompensas'. Se asumirá 0 recompensas usadas.");
    }

    // 4. Calcular recompensas disponibles
    const recompensasGanadas = Math.floor(totalCompras / 10);
    const recompensasDisponibles = recompensasGanadas - recompensasUsadas;
    
    let recompensasParaEnviar = [];
    if (recompensasDisponibles > 0) {
      recompensasParaEnviar.push({
        id: 1, // ID de la recompensa de café gratis
        nombre: 'Café o Frappe Gratis',
        descripcion: `Felicidades, tienes ${recompensasDisponibles} bebida(s) gratis disponibles.`,
        cantidad: recompensasDisponibles
      });
    }

    res.json({
      cliente: cliente,
      recompensas: recompensasParaEnviar
    });

  } catch (error) {
    // Este error SÍ es crítico, probablemente porque la tabla 'usuarios' o 'ventas' tiene un nombre incorrecto.
    console.error('Error Crítico al buscar recompensas. Revisa los nombres de las tablas y columnas.', error.message);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
};