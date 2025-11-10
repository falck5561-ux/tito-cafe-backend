const db = require('../config/db');

// Obtener todos los productos (AHORA FILTRA INACTIVOS Y COMBOS)
exports.obtenerProductos = async (req, res) => {
  const { tiendaId } = req; // <--- MODIFICADO (Obtenemos el ID de la tienda)
  
  try {
    // ✅ CORRECCIÓN: Limpiado de espacios invisibles (NBSP)
    const query = `
      SELECT * FROM productos 
      WHERE esta_activo = true AND categoria != 'Combo' AND tienda_id = $1 
      ORDER BY nombre ASC
    `;
    
    const result = await db.query(query, [tiendaId]); // <--- MODIFICADO (Pasamos el ID de la tienda)
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener productos:", err.message);
    res.status(500).send('Error del Servidor');
  }
};

// Obtener un solo producto por su ID (¡AHORA CON OPCIONES!)
exports.obtenerProductoPorId = async (req, res) => {
  const { tiendaId } = req;
  const { id } = req.params;

  try {
    // Paso 1: Obtener el producto base
    const productoResult = await db.query(
      'SELECT * FROM productos WHERE id = $1 AND tienda_id = $2', 
      [id, tiendaId]
    );
    
    if (productoResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    const producto = productoResult.rows[0];

    // Paso 2: Obtener los grupos de opciones para este producto
    const gruposResult = await db.query(
      'SELECT * FROM grupos_opciones_producto WHERE producto_id = $1 ORDER BY id ASC',
      [id]
    );

    // Paso 3: Para cada grupo, obtener sus opciones
    const gruposConOpciones = [];
    for (const grupo of gruposResult.rows) {
      const opcionesResult = await db.query(
        'SELECT * FROM opciones_producto WHERE grupo_id = $1 ORDER BY id ASC',
        [grupo.id]
      );
      
      // Añadimos las opciones al objeto del grupo
      grupo.opciones = opcionesResult.rows;
      gruposConOpciones.push(grupo);
    }

    // Paso 4: Añadir el array de grupos/opciones al producto final
    producto.grupos_opciones = gruposConOpciones;

    res.json(producto);

  } catch (err) {
    console.error(`Error al obtener producto ${req.params.id}:`, err.message);
    res.status(500).send('Error del Servidor');
  }
};

// Crear un nuevo producto
exports.crearProducto = async (req, res) => {
  const { tiendaId } = req; // <--- MODIFICADO (Obtenemos el ID de la tienda)
  const { nombre, descripcion, precio, stock, categoria, imagen_url, descuento_porcentaje, en_oferta } = req.body;
  
  if (!nombre || !precio) {
    return res.status(400).json({ msg: 'El nombre y el precio son campos requeridos.' });
  }

  try {
    // ✅ CORRECCIÓN: Limpiado de espacios invisibles (NBSP)
    const query = `
      INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagen_url, descuento_porcentaje, en_oferta, esta_activo, tienda_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9) 
      RETURNING *`;
    
    const values = [
      nombre,
      descripcion || null,
      precio,
      stock || 0,
      categoria || 'General',
      imagen_url || null,
      descuento_porcentaje || 0,
      en_oferta || false,
      tiendaId // <--- MODIFICADO (Añadimos el ID de la tienda a los valores)
    ];

    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error al crear el producto:", err.message);
    res.status(500).send('Error del Servidor');
  }
};

// Actualizar un producto existente
exports.actualizarProducto = async (req, res) => {
  const { tiendaId } = req; // <--- MODIFICADO (Obtenemos el ID de la tienda)
  const { id } = req.params; // <--- MODIFICADO

  try {
    const { nombre, descripcion, precio, stock, categoria, imagen_url, descuento_porcentaje, en_oferta } = req.body;

    // ✅ CORRECCIÓN: Limpiado de espacios invisibles (NBSP)
    const query = `
      UPDATE productos 
      SET nombre = $1, descripcion = $2, precio = $3, stock = $4, categoria = $5, imagen_url = $6, descuento_porcentaje = $7, en_oferta = $8 
      WHERE id = $9 AND tienda_id = $10
      RETURNING *`;
    
    const values = [
      nombre,
      descripcion,
      precio,
      stock,
      categoria,
      imagen_url,
      descuento_porcentaje,
      en_oferta,
      id,
      tiendaId // <--- MODIFICADO (Añadimos el ID de la tienda a los valores)
    ];
    
    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Producto no encontrado para actualizar' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error al actualizar el producto ${req.params.id}:`, err.message);
    res.status(500).send('Error del Servidor');
  }
};

// "Eliminar" un producto (Soft Delete)
exports.eliminarProducto = async (req, res) => {
  const { tiendaId } = req; // <--- MODIFICADO (Obtenemos el ID de la tienda)
  const { id } = req.params; // <--- MODIFICADO

  try {
    // ✅ CORRECCIÓN: Limpiado de espacios invisibles (NBSP)
    const query = `
      UPDATE productos SET esta_activo = false 
      WHERE id = $1 AND tienda_id = $2 
      RETURNING *`;
    
    const result = await db.query(query, [id, tiendaId]); // <--- MODIFICADO (Pasamos ambos IDs)
    
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Producto no encontrado para desactivar' });
    }
    res.json({ msg: 'Producto desactivado exitosamente' });
  } catch (err) {
    console.error(`Error al desactivar el producto ${req.params.id}:`, err.message);
    res.status(500).send('Error del Servidor');
  }
};

// =======================================================
// FUNCIONES PARA OPCIONES DE PRODUCTO (TOPPINGS)
// =======================================================

// --- Verificación de Seguridad ---
// Función interna para verificar que el admin (jefe/empleado)
// solo pueda modificar elementos de su propia tienda.

// Verifica si un PRODUCTO pertenece a la tienda del admin
const verificarPropiedadProducto = async (productoId, tiendaId) => {
  const result = await db.query(
    'SELECT id FROM productos WHERE id = $1 AND tienda_id = $2',
    [productoId, tiendaId]
  );
  return result.rowCount > 0;
};

// Verifica si un GRUPO pertenece a la tienda del admin
const verificarPropiedadGrupo = async (grupoId, tiendaId) => {
  const result = await db.query(
    `SELECT g.id FROM grupos_opciones_producto g
     JOIN productos p ON g.producto_id = p.id
     WHERE g.id = $1 AND p.tienda_id = $2`,
    [grupoId, tiendaId]
  );
  return result.rowCount > 0;
};

// Verifica si una OPCION pertenece a la tienda del admin
const verificarPropiedadOpcion = async (opcionId, tiendaId) => {
  // ✅ CORRECCIÓN: Limpiado de espacios invisibles (NBSP) y sintaxis
  const result = await db.query(
    `SELECT o.id FROM opciones_producto o
     JOIN grupos_opciones_producto g ON o.grupo_id = g.id
     JOIN productos p ON g.producto_id = p.id
     WHERE o.id = $1 AND p.tienda_id = $2`,
    [opcionId, tiendaId]
  );
  return result.rowCount > 0;
};
// --- Fin Verificación de Seguridad ---


// Crear un nuevo GRUPO de opciones (Ej: "Elige Jarabe")
exports.crearGrupoOpcion = async (req, res) => {
  const { productoId } = req.params;
  const { nombre, tipo_seleccion } = req.body;
  const { tiendaId } = req;

  try {
    // Seguridad: Verificar que el producto pertenece a esta tienda
    if (!(await verificarPropiedadProducto(productoId, tiendaId))) {
      return res.status(403).json({ msg: 'Acción no autorizada' });
    }

    // ✅ CORRECCIÓN: Limpiado de espacios invisibles (NBSP)
    const query = `
      INSERT INTO grupos_opciones_producto (producto_id, nombre, tipo_seleccion)
      VALUES ($1, $2, $3) RETURNING *
    `;
    const result = await db.query(query, [productoId, nombre, tipo_seleccion || 'unico']);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error al crear grupo de opción:", err.message);
    res.status(500).send('Error del Servidor');
  }
};

// Agregar una OPCION a un grupo (Ej: "Nutella" con precio $15)
exports.agregarOpcionAGrupo = async (req, res) => {
  const { grupoId } = req.params;
  const { nombre, precio_adicional } = req.body;
  const { tiendaId } = req;

  try {
    // Seguridad: Verificar que el grupo pertenece a esta tienda
    if (!(await verificarPropiedadGrupo(grupoId, tiendaId))) {
      return res.status(403).json({ msg: 'Acción no autorizada' });
    }

    // ✅ CORRECCIÓN: Limpiado de espacios invisibles (NBSP)
    const query = `
      INSERT INTO opciones_producto (grupo_id, nombre, precio_adicional)
      VALUES ($1, $2, $3) RETURNING *
    `;
    const result = await db.query(query, [grupoId, nombre, precio_adicional || 0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error al agregar opción:", err.message);
    res.status(500).send('Error del Servidor');
  }
};

// Eliminar un GRUPO de opciones (y todas sus opciones gracias a 'ON DELETE CASCADE')
exports.eliminarGrupoOpcion = async (req, res) => {
  const { grupoId } = req.params;
  const { tiendaId } = req;

  try {
    // Seguridad: Verificar que el grupo pertenece a esta tienda
    if (!(await verificarPropiedadGrupo(grupoId, tiendaId))) {
      return res.status(403).json({ msg: 'Acción no autorizada' });
    }

    await db.query('DELETE FROM grupos_opciones_producto WHERE id = $1', [grupoId]);
    res.json({ msg: 'Grupo de opciones eliminado' });
  } catch (err) {
    console.error("Error al eliminar grupo:", err.message);
    res.status(500).send('Error del Servidor');
  }
};

// Eliminar una OPCION específica
exports.eliminarOpcion = async (req, res) => {
  const { opcionId } = req.params;
  const { tiendaId } = req;

  try {
    // Seguridad: Verificar que la opción pertenece a esta tienda
    if (!(await verificarPropiedadOpcion(opcionId, tiendaId))) {
      return res.status(403).json({ msg: 'Acción no autorizada' });
    }

    await db.query('DELETE FROM opciones_producto WHERE id = $1', [opcionId]);
    res.json({ msg: 'Opción eliminada' });
  } catch (err) {
    console.error("Error al eliminar opción:", err.message);
    res.status(500).send('Error del Servidor');
  }
};