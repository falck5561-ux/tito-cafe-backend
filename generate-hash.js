// Archivo: generate-hash.js
const bcrypt = require('bcryptjs');
const password = process.argv[2];
if (!password) {
  console.log('Por favor, proporciona una contraseña.');
  process.exit(1);
}
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);
console.log(`\nContraseña Original: ${password}`);
console.log('✅ Hash Generado (¡COPIA ESTA LÍNEA!):');
console.log(hash);
console.log('\n');