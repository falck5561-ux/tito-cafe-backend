const bcrypt = require('bcryptjs');

async function crearCredenciales() {
  // --- Define aquí las contraseñas que quieres usar ---
  const passwordJefe = 'jefe1234';
  const passwordEmpleado = 'empleado1234';
  // ---------------------------------------------------

  console.log('Generando credenciales...');

  // Generar hash para el Jefe
  const saltJefe = await bcrypt.genSalt(10);
  const hashJefe = await bcrypt.hash(passwordJefe, saltJefe);

  // Generar hash para el Empleado
  const saltEmpleado = await bcrypt.genSalt(10);
  const hashEmpleado = await bcrypt.hash(passwordEmpleado, saltEmpleado);

  console.log('\n--- Copia y pega estos hashes en el comando SQL ---');
  console.log('Hash para Jefe:', hashJefe);
  console.log('Hash para Empleado:', hashEmpleado);
}

crearCredenciales();