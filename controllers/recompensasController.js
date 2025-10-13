const db = require('../config/db');

// --- TU LÓGICA DE RECOMPENSAS (SIN CAMBIOS) ---
exports.obtenerMisRecompensas = async (req, res) => { /* ... tu código existente ... */ };
exports.obtenerRecompensasDisponibles = async (req, res) => { /* ... tu código existente ... */ };
exports.marcarRecompensaUtilizada = async (req, res) => { /* ... tu código existente ... */ };


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

    // 3. Contar recompensas de café gratis ya usadas.
    let recompensasUsadas = 0;
    try {
      // Esta consulta puede fallar si no tienes la tabla 'usuarios_recompensas'.
      // Si falla, asumimos que no se ha usado ninguna recompensa.
      // IMPORTANTE: Revisa que la tabla se llame 'usuarios_recompensas'.
      const usadasQuery = 'SELECT COUNT(*) FROM usuarios_recompensas WHERE usuario_id = $1 AND recompensa_id = 1';
      const usadasResult = await db.query(usadasQuery, [cliente.id]);
      recompensasUsadas = parseInt(usadasResult.rows[0].count, 10);
    } catch (e) {
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
    console.error('Error Crítico al buscar recompensas por email:', error.message);
    res.status(500).json({ msg: 'Error interno del servidor. Revisa los nombres de las tablas y columnas en el controlador.' });
  }
};