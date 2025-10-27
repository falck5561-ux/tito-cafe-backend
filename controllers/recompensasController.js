// Archivo: controllers/recompensasController.js (CORREGIDO)

const db = require('../config/db');

// --- FUNCIÓN PARA CLIENTES (CORREGIDA PARA LEER DE LA TABLA 'recompensas') ---
exports.obtenerMisRecompensas = async (req, res) => {
  const { tiendaId } = req; // Obtenemos el ID de la tienda (string)
  const usuarioId = req.user.id;

  try {
    // PASO 1: Obtener TODAS las recompensas que el cliente ha GANADO para esta tienda
    const ganadasQuery = `
      SELECT id, nombre 
      FROM recompensas 
      WHERE id_cliente = $1 AND tienda_id = $2
      ORDER BY id ASC; -- O por fecha_creacion si la tienes
    `;
    const ganadasResult = await db.query(ganadasQuery, [usuarioId, tiendaId]);
    const todasLasGanadas = ganadasResult.rows; // [{id: 5, nombre: 'Gomitas...'}, {id: 12, nombre: 'Gomitas...'}]

    // PASO 2: Obtener los IDs de las recompensas que el cliente YA HA USADO para esta tienda
    const usadasQuery = `
      SELECT recompensa_id 
      FROM usuarios_recompensas 
      WHERE usuario_id = $1 AND tienda_id = $2;
    `;
    const usadasResult = await db.query(usadasQuery, [usuarioId, tiendaId]);
    // Crear un Set para búsqueda rápida: new Set([5, ...])
    const idsUsados = new Set(usadasResult.rows.map(row => row.recompensa_id)); 

    // PASO 3: Filtrar las ganadas para quedarse solo con las NO usadas (disponibles)
    const recompensasDisponibles = todasLasGanadas.filter(recompensa => !idsUsados.has(recompensa.id));
    
    // PASO 4: Preparar la respuesta con el formato esperado por el frontend
    // Agruparemos por nombre si hay varias iguales (aunque con la lógica actual solo habrá un tipo)
    const recompensasAgrupadas = recompensasDisponibles.reduce((acc, recompensa) => {
        // Usaremos el ID único de la recompensa como clave temporal para evitar agrupar accidentalmente
        // recompensas diferentes que pudieran llamarse igual en el futuro.
        const key = recompensa.id; 
        if (!acc[key]) {
            acc[key] = {
                id: recompensa.id, // ID único de esta recompensa específica
                nombre: recompensa.nombre, // El nombre que viene de la BD (ej. "Gomitas...")
                descripcion: `Recompensa #${recompensa.id}. Muéstrale esta pantalla al empleado para canjearla.`, // Descripción genérica
                cantidad: 0 // La cantidad ahora representa cuántas de *esta específica* recompensa tiene
            };
        }
        // Como cada fila es una recompensa única ganada, la cantidad siempre es 1 por fila
        acc[key].cantidad = 1; 
        return acc;
    }, {});
    
    // Convertir el objeto agrupado de nuevo a un array
    const recompensasParaEnviar = Object.values(recompensasAgrupadas);

    res.json(recompensasParaEnviar);

  } catch (error) {
    console.error('Error Crítico en obtenerMisRecompensas:', error.message, error.stack);
    res.status(500).json({ msg: "No se pudieron cargar tus recompensas." });
  }
};


// --- FUNCIÓN DE BÚSQUEDA PARA EMPLEADOS (CORREGIDA PARA LEER DE LA TABLA 'recompensas') ---
exports.buscarRecompensasPorEmail = async (req, res) => {
  const { tiendaId } = req; // Obtenemos el ID de la tienda (string)
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ msg: 'El correo es requerido.' });
  }

  console.log(`[REWARDS SEARCH] Iniciando búsqueda para email: ${email} EN TIENDA: ${tiendaId}`);

  try {
    // --- PASO 1: Buscar al cliente ---
    let cliente;
    try {
      console.log("[REWARDS SEARCH] PASO 1: Buscando usuario...");
      const userQuery = 'SELECT id, nombre FROM usuarios WHERE email = $1';
      const userResult = await db.query(userQuery, [email]);

      if (userResult.rows.length === 0) {
        console.log("[REWARDS SEARCH] PASO 1: Cliente no encontrado.");
        return res.status(404).json({ msg: 'Cliente no encontrado.' });
      }
      cliente = userResult.rows[0];
      console.log(`[REWARDS SEARCH] PASO 1: Cliente encontrado: ${cliente.nombre} (ID: ${cliente.id})`);
    } catch (e) {
      console.error("[REWARDS SEARCH] FALLO CRÍTICO EN PASO 1. Causa:", e.message);
      throw new Error("Error al buscar el cliente.");
    }

    // --- PASO 2: Obtener TODAS las recompensas ganadas por el cliente para esta tienda ---
    let todasLasGanadas = [];
    try {
        console.log(`[REWARDS SEARCH] PASO 2: Buscando recompensas GANADAS en tabla 'recompensas' para tienda ${tiendaId}...`);
        const ganadasQuery = `
            SELECT id, nombre 
            FROM recompensas 
            WHERE id_cliente = $1 AND tienda_id = $2
            ORDER BY id ASC;
        `;
        const ganadasResult = await db.query(ganadasQuery, [cliente.id, tiendaId]);
        todasLasGanadas = ganadasResult.rows;
        console.log(`[REWARDS SEARCH] PASO 2: Recompensas ganadas encontradas: ${todasLasGanadas.length}`);
    } catch (e) {
        console.error("[REWARDS SEARCH] FALLO EN PASO 2. Causa:", e.message);
        // Continuamos, puede que no haya ganado ninguna
    }

    // --- PASO 3: Obtener los IDs de las recompensas YA USADAS por el cliente para esta tienda ---
    let idsUsados = new Set();
    try {
        console.log(`[REWARDS SEARCH] PASO 3: Buscando recompensas USADAS en 'usuarios_recompensas' para tienda ${tiendaId}...`);
        const usadasQuery = `
            SELECT recompensa_id 
            FROM usuarios_recompensas 
            WHERE usuario_id = $1 AND tienda_id = $2;
        `;
        const usadasResult = await db.query(usadasQuery, [cliente.id, tiendaId]);
        idsUsados = new Set(usadasResult.rows.map(row => row.recompensa_id));
        console.log(`[REWARDS SEARCH] PASO 3: IDs de recompensas usadas encontradas: ${idsUsados.size}`);
    } catch (e) {
        console.error("[REWARDS SEARCH] FALLO EN PASO 3. Causa:", e.message);
        // Continuamos, puede que no haya usado ninguna
    }

    // --- PASO 4: Filtrar para obtener las DISPONIBLES ---
    console.log("[REWARDS SEARCH] PASO 4: Filtrando recompensas disponibles...");
    const recompensasDisponibles = todasLasGanadas.filter(recompensa => !idsUsados.has(recompensa.id));
    console.log(`[REWARDS SEARCH] PASO 4: Recompensas disponibles encontradas: ${recompensasDisponibles.length}`);
    
    // --- PASO 5: Preparar la respuesta con el formato esperado ---
    // Ya no calculamos, solo formateamos las que encontramos
    const recompensasParaEnviar = recompensasDisponibles.map(recompensa => ({
        id: recompensa.id, // ID ÚNICO de la recompensa específica
        nombre: recompensa.nombre, // El nombre que viene de la BD (debería ser el nuevo)
        // Puedes ajustar la descripción si quieres
        descripcion: `Recompensa #${recompensa.id} disponible.`, 
        cantidad: 1 // Cada fila es una recompensa individual disponible
    }));


    console.log("[REWARDS SEARCH] Búsqueda completada exitosamente.");
    res.json({
      cliente: cliente,
      recompensas: recompensasParaEnviar // Enviamos la lista filtrada y formateada
    });

  } catch (error) {
    console.error('Error final en buscarRecompensasPorEmail:', error.message, error.stack);
    res.status(500).json({ msg: 'Error interno del servidor. Revisa los logs del backend.' });
  }
};


// --- OTRAS FUNCIONES (SE MANTIENEN IGUAL, YA ESTABAN BIEN) ---
exports.obtenerRecompensasDisponibles = async (req, res) => {
  const { tiendaId } = req; 

  try {
    // Obtenemos solo las recompensas (promociones) de ESTA tienda
    // Esta función parece ser para otro propósito (¿promociones generales?) y está bien.
    const query = `
      SELECT * FROM recompensas 
      WHERE activo = true AND tienda_id = $1 AND id_cliente IS NULL -- Asumiendo que las generales no tienen id_cliente
    `; 
    const { rows } = await db.query(query, [tiendaId]); 
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener recompensas disponibles:', error.message);
    res.status(500).json({ msg: 'Error interno del servidor.' });
  }
};

exports.marcarRecompensaUtilizada = async (req, res) => {
    // Esta función no hace nada, la lógica de marcar como usada está en ventasController.js
    // cuando se crea la venta. Esto está bien.
  res.json({ msg: 'La recompensa se marcará al registrar la venta.' });
};
