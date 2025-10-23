// Archivo: controllers/recompensasController.js

const db = require('../config/db');

// --- FUNCIÓN PARA CLIENTES (CORRECCIÓN FINAL) ---
exports.obtenerMisRecompensas = async (req, res) => {
  const { tiendaId } = req; // <--- MODIFICADO (Obtenemos el ID de la tienda)
  const usuarioId = req.user.id;

  try {
    // PASO 1: Contar las compras totales del cliente EN ESTA TIENDA
    const comprasQuery = `
      SELECT COUNT(*) FROM pedidos 
      WHERE id_cliente = $1 AND tienda_id = $2
    `; // <--- MODIFICADO
    const comprasResult = await db.query(comprasQuery, [usuarioId, tiendaId]); // <--- MODIFICADO
    const totalCompras = parseInt(comprasResult.rows[0].count, 10);

    // PASO 2: Contar las recompensas de "café gratis" que ya ha usado EN ESTA TIENDA
    const usadasQuery = `
      SELECT COUNT(*) FROM usuarios_recompensas 
      WHERE usuario_id = $1 AND recompensa_id = 1 AND tienda_id = $2
    `; // <--- MODIFICADO
    const usadasResult = await db.query(usadasQuery, [usuarioId, tiendaId]); // <--- MODIFICADO
    const recompensasUsadas = parseInt(usadasResult.rows[0].count, 10);

    // PASO 3: Calcular las recompensas que tiene disponibles
    const recompensasGanadas = Math.floor(totalCompras / 10);
    const recompensasDisponibles = recompensasGanadas - recompensasUsadas;

    let recompensasParaEnviar = [];
    if (recompensasDisponibles > 0) {
      recompensasParaEnviar.push({
        id: 1, 
        nombre: 'Café o Frappe Gratis',
        descripcion: `¡Felicidades! Has ganado ${recompensasDisponibles} bebida(s) gratis en esta tienda. Muéstrale esta pantalla al empleado para canjearla.`,
        cantidad: recompensasDisponibles
      });
    }
    
    res.json(recompensasParaEnviar);

  } catch (error) {
    console.error('Error Crítico en obtenerMisRecompensas:', error.message);
    res.status(500).json({ msg: "No se pudieron cargar tus recompensas." });
  }
};


// --- FUNCIÓN DE BÚSQUEDA PARA EMPLEADOS (CORREGIDA) ---
exports.buscarRecompensasPorEmail = async (req, res) => {
  const { tiendaId } = req; // <--- MODIFICADO (Obtenemos el ID de la tienda)
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ msg: 'El correo es requerido.' });
  }

  console.log(`[REWARDS] Iniciando búsqueda para email: ${email} EN TIENDA: ${tiendaId}`); // <--- MODIFICADO

  try {
    // --- PASO 1: Buscar al cliente (Esto es global, está bien) ---
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

    // --- PASO 2: Contar sus compras EN ESTA TIENDA ---
    let totalCompras = 0;
    try {
      console.log(`[REWARDS] PASO 2: Contando pedidos en 'pedidos' para tienda ${tiendaId}...`); // <--- MODIFICADO
      const comprasQuery = `
        SELECT COUNT(*) FROM pedidos 
        WHERE id_cliente = $1 AND tienda_id = $2
      `; // <--- MODIFICADO
      const comprasResult = await db.query(comprasQuery, [cliente.id, tiendaId]); // <--- MODIFICADO
      totalCompras = parseInt(comprasResult.rows[0].count, 10);
      console.log(`[REWARDS] PASO 2: Total de pedidos encontrados: ${totalCompras}`);
    } catch (e) {
      console.error("[REWARDS] FALLO EN PASO 2. Causa:", e.message);
    }

    // --- PASO 3: Contar recompensas usadas EN ESTA TIENDA ---
    let recompensasUsadas = 0;
    try {
      console.log(`[REWARDS] PASO 3: Contando en 'usuarios_recompensas' para tienda ${tiendaId}...`); // <--- MODIFICADO
      const usadasQuery = `
        SELECT COUNT(*) FROM usuarios_recompensas 
        WHERE usuario_id = $1 AND recompensa_id = 1 AND tienda_id = $2
      `; // <--- MODIFICADO
      const usadasResult = await db.query(usadasQuery, [cliente.id, tiendaId]); // <--- MODIFICADO
      if (usadasResult.rows.length > 0) {
        recompensasUsadas = parseInt(usadasResult.rows[0].count, 10);
      }
      console.log(`[REWARDS] PASO 3: Recompensas usadas encontradas: ${recompensasUsadas}`);
    } catch (e) {
      console.error("[REWARDS] FALLO EN PASO 3. Causa:", e.message);
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
        descripcion: `Felicidades, tienes ${recompensasDisponibles} bebida(s) gratis en esta tienda.`,
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
  const { tiendaId } = req; // <--- MODIFICADO (Obtenemos el ID de la tienda)

  try {
    // AHORA: Obtenemos solo las recompensas (promociones) de ESTA tienda
    const query = `
      SELECT * FROM recompensas 
      WHERE activo = true AND tienda_id = $1
    `; // <--- MODIFICADO
    const { rows } = await db.query(query, [tiendaId]); // <--- MODIFICADO
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener recompensas disponibles:', error.message);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
};

exports.marcarRecompensaUtilizada = async (req, res) => {
  res.json({ msg: 'La recompensa se marcará al registrar la venta.' });
};