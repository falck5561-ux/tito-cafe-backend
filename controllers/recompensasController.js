const db = require('../config/db');

//=================================================================
// 1. OBTENER MIS RECOMPENSAS (Cliente)
//=================================================================
// Lógica: Lee la tabla 'recompensas' (lo que ganaste) y resta lo que está 
// en 'usuarios_recompensas' (lo que ya gastaste).
exports.obtenerMisRecompensas = async (req, res) => {
  const { tiendaId } = req; 
  const usuarioId = req.user.id;

  try {
    // PASO 1: Obtener TODAS las recompensas que el cliente ha GANADO en esta tienda
    const ganadasQuery = `
      SELECT id, nombre 
      FROM recompensas 
      WHERE id_cliente = $1 AND tienda_id = $2
      ORDER BY id ASC;
    `;
    const ganadasResult = await db.query(ganadasQuery, [usuarioId, tiendaId]);
    const todasLasGanadas = ganadasResult.rows; 

    // PASO 2: Obtener los IDs de las recompensas que el cliente YA HA USADO en esta tienda
    const usadasQuery = `
      SELECT recompensa_id 
      FROM usuarios_recompensas 
      WHERE usuario_id = $1 AND tienda_id = $2;
    `;
    const usadasResult = await db.query(usadasQuery, [usuarioId, tiendaId]);
    
    // Crear un Set para búsqueda rápida de IDs usados
    const idsUsados = new Set(usadasResult.rows.map(row => row.recompensa_id)); 

    // PASO 3: Filtrar las ganadas para quedarse solo con las NO usadas (disponibles)
    const recompensasDisponibles = todasLasGanadas.filter(recompensa => !idsUsados.has(recompensa.id));
    
    // PASO 4: Formatear para el Frontend
    // Convertimos cada recompensa disponible en un objeto individual con cantidad 1
    const recompensasFormateadas = recompensasDisponibles.map(recompensa => ({
        id: recompensa.id,         // ID único para canjear esta específica
        nombre: recompensa.nombre, // Nombre (ej. "Dona Gratis")
        descripcion: `Recompensa #${recompensa.id}. Muéstrale esta pantalla al empleado para canjearla.`,
        cantidad: 1                // 1 unidad de esta recompensa específica
    }));

    res.json(recompensasFormateadas);

  } catch (error) {
    console.error('Error Crítico en obtenerMisRecompensas:', error.message, error.stack);
    res.status(500).json({ msg: "No se pudieron cargar tus recompensas." });
  }
};


//=================================================================
// 2. BUSCAR RECOMPENSAS POR EMAIL (Empleado)
//=================================================================
exports.buscarRecompensasPorEmail = async (req, res) => {
  const { tiendaId } = req;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ msg: 'El correo es requerido.' });
  }

  console.log(`[REWARDS] Buscando rewards para: ${email} en Tienda: ${tiendaId}`);

  try {
    // --- PASO 1: Buscar al cliente por email ---
    const userQuery = 'SELECT id, nombre FROM usuarios WHERE email = $1';
    const userResult = await db.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Cliente no encontrado.' });
    }
    const cliente = userResult.rows[0];

    // --- PASO 2: Obtener TODAS las recompensas ganadas (Historial) ---
    const ganadasQuery = `
        SELECT id, nombre 
        FROM recompensas 
        WHERE id_cliente = $1 AND tienda_id = $2
        ORDER BY id ASC;
    `;
    const ganadasResult = await db.query(ganadasQuery, [cliente.id, tiendaId]);
    const todasLasGanadas = ganadasResult.rows;

    // --- PASO 3: Obtener las ya USADAS ---
    const usadasQuery = `
        SELECT recompensa_id 
        FROM usuarios_recompensas 
        WHERE usuario_id = $1 AND tienda_id = $2;
    `;
    const usadasResult = await db.query(usadasQuery, [cliente.id, tiendaId]);
    const idsUsados = new Set(usadasResult.rows.map(row => row.recompensa_id));

    // --- PASO 4: Filtrar (Ganadas - Usadas = Disponibles) ---
    const recompensasDisponibles = todasLasGanadas.filter(recompensa => !idsUsados.has(recompensa.id));
    
    // --- PASO 5: Formatear respuesta ---
    const recompensasParaEnviar = recompensasDisponibles.map(recompensa => ({
        id: recompensa.id,
        nombre: recompensa.nombre,
        descripcion: `Recompensa #${recompensa.id} disponible.`, 
        cantidad: 1
    }));

    res.json({
      cliente: cliente,
      recompensas: recompensasParaEnviar
    });

  } catch (error) {
    console.error('Error en buscarRecompensasPorEmail:', error.message, error.stack);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
};


//=================================================================
// 3. OTRAS FUNCIONES (Promociones Generales / Placeholders)
//=================================================================

// Obtener promociones generales (no asignadas a un cliente específico)
exports.obtenerRecompensasDisponibles = async (req, res) => {
  const { tiendaId } = req; 
  try {
    const query = `
      SELECT * FROM recompensas 
      WHERE activo = true AND tienda_id = $1 AND id_cliente IS NULL
    `; 
    const { rows } = await db.query(query, [tiendaId]); 
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener recompensas generales:', error.message);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
};

// Placeholder: El marcado real se hace en ventasController al procesar el pedido
exports.marcarRecompensaUtilizada = async (req, res) => {
  res.json({ msg: 'La recompensa se marcará automáticamente al registrar la venta.' });
};