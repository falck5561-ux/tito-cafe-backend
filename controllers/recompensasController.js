const db = require('../config/db');

// --- FUNCIÓN PARA CLIENTES (CORRECCIÓN FINAL) ---
// Ahora calcula las recompensas ganadas en lugar de solo buscar las usadas.
exports.obtenerMisRecompensas = async (req, res) => {
  // El ID del usuario que ha iniciado sesión se obtiene del middleware de autenticación
  const usuarioId = req.user.id;

  try {
    // PASO 1: Contar las compras totales del cliente desde la tabla 'pedidos'
    const comprasQuery = 'SELECT COUNT(*) FROM pedidos WHERE id_cliente = $1';
    const comprasResult = await db.query(comprasQuery, [usuarioId]);
    const totalCompras = parseInt(comprasResult.rows[0].count, 10);

    // PASO 2: Contar las recompensas de "café gratis" que ya ha usado
    const usadasQuery = 'SELECT COUNT(*) FROM usuarios_recompensas WHERE usuario_id = $1 AND recompensa_id = 1';
    const usadasResult = await db.query(usadasQuery, [usuarioId]);
    const recompensasUsadas = parseInt(usadasResult.rows[0].count, 10);

    // PASO 3: Calcular las recompensas que tiene disponibles
    const recompensasGanadas = Math.floor(totalCompras / 10);
    const recompensasDisponibles = recompensasGanadas - recompensasUsadas;

    let recompensasParaEnviar = [];
    if (recompensasDisponibles > 0) {
      // Si tiene recompensas, las añadimos a la respuesta
      recompensasParaEnviar.push({
        id: 1, // ID de la recompensa
        nombre: 'Café o Frappe Gratis',
        descripcion: `¡Felicidades! Has ganado ${recompensasDisponibles} bebida(s) gratis por tus compras. Muéstrale esta pantalla al empleado para canjearla.`,
        cantidad: recompensasDisponibles
      });
    }
    
    // Enviamos la lista (que puede estar vacía si no tiene recompensas)
    res.json(recompensasParaEnviar);

  } catch (error) {
    console.error('Error Crítico en obtenerMisRecompensas:', error.message);
    res.status(500).json({ msg: "No se pudieron cargar tus recompensas." });
  }
};


// --- FUNCIÓN DE BÚSQUEDA PARA EMPLEADOS (YA ESTÁ CORRECTA) ---
exports.buscarRecompensasPorEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ msg: 'El correo es requerido.' });
  }

  console.log(`[REWARDS] Iniciando búsqueda para email: ${email}`);

  try {
    // --- PASO 1: Buscar al cliente ---
    let cliente;
    try {
      console.log("[REWARDS] PASO 1: Buscando usuario en la tabla 'usuarios'...");
      const userQuery = 'SELECT id, nombre FROM usuarios WHERE email = $1';
      const userResult = await db.query(userQuery, [email]);

      if (userResult.rows.length === 0) {
        console.log("[REWARDS] PASO 1: Cliente no encontrado.");
        return res.status(404).json({ msg: 'Cliente no encontrado.' });
      }
      cliente = userResult.rows[0];
      console.log(`[REWARDS] PASO 1: Cliente encontrado: ${cliente.nombre} (ID: ${cliente.id})`);
    } catch (e) {
      console.error("[REWARDS] FALLO CRÍTICO EN PASO 1. Causa:", e.message);
      throw new Error("Error al buscar el cliente. Revisa que la tabla 'usuarios' exista.");
    }

    // --- PASO 2: Contar sus compras ---
    let totalCompras = 0;
    try {
      console.log("[REWARDS] PASO 2: Contando pedidos en la tabla 'pedidos'...");
      const comprasQuery = 'SELECT COUNT(*) FROM pedidos WHERE id_cliente = $1';
      const comprasResult = await db.query(comprasQuery, [cliente.id]);
      totalCompras = parseInt(comprasResult.rows[0].count, 10);
      console.log(`[REWARDS] PASO 2: Total de pedidos encontrados: ${totalCompras}`);
    } catch (e) {
      console.error("[REWARDS] FALLO EN PASO 2. Revisa que la tabla 'pedidos' y la columna 'id_cliente' existan. Causa:", e.message);
    }

    // --- PASO 3: Contar recompensas usadas ---
    let recompensasUsadas = 0;
    try {
      console.log("[REWARDS] PASO 3: Contando en 'usuarios_recompensas'...");
      const usadasQuery = 'SELECT COUNT(*) FROM usuarios_recompensas WHERE usuario_id = $1 AND recompensa_id = 1';
      const usadasResult = await db.query(usadasQuery, [cliente.id]);
      if (usadasResult.rows.length > 0) {
        recompensasUsadas = parseInt(usadasResult.rows[0].count, 10);
      }
      console.log(`[REWARDS] PASO 3: Recompensas usadas encontradas: ${recompensasUsadas}`);
    } catch (e) {
      console.error("[REWARDS] FALLO EN PASO 3. Revisa que la tabla 'usuarios_recompensas' exista. Causa:", e.message);
    }

    // --- PASO 4: Calcular y enviar el resultado ---
    console.log("[REWARDS] PASO 4: Calculando resultado final...");
    const recompensasGanadas = Math.floor(totalCompras / 10);
    const recompensasDisponibles = recompensasGanadas - recompensasUsadas;
    
    let recompensasParaEnviar = [];
    if (recompensasDisponibles > 0) {
      recompensasParaEnviar.push({
        id: 1,
        nombre: 'Café o Frappe Gratis',
        descripcion: `Felicidades, tienes ${recompensasDisponibles} bebida(s) gratis.`,
        cantidad: recompensasDisponibles
      });
    }

    console.log("[REWARDS] Búsqueda completada exitosamente.");
    res.json({
      cliente: cliente,
      recompensas: recompensasParaEnviar
    });

  } catch (error) {
    console.error('Error final en buscarRecompensasPorEmail:', error.message);
    res.status(500).json({ msg: 'Error interno del servidor. Revisa los logs del backend.' });
  }
};

// --- OTRAS FUNCIONES (SE MANTIENEN IGUAL) ---
exports.obtenerRecompensasDisponibles = async (req, res) => {
  try {
    const query = 'SELECT * FROM recompensas WHERE activo = true';
    const { rows } = await db.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener recompensas disponibles:', error.message);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
};

exports.marcarRecompensaUtilizada = async (req, res) => {
  res.json({ msg: 'La recompensa se marcará al registrar la venta.' });
};