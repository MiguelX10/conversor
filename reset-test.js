// Script para resetear localStorage y probar el sistema
// Ejecutar en DevTools -> Console

console.log('🔄 RESETEANDO SISTEMA DE CONVERSIONES...');

// 1. Ver estado actual
console.log('📊 Estado ANTES del reset:');
const oldData = localStorage.getItem('convertpro_usage');
console.log('Datos antiguos:', oldData ? JSON.parse(oldData) : 'No hay datos');

// 2. Limpiar localStorage
localStorage.removeItem('convertpro_usage');
console.log('✅ localStorage limpiado');

// 3. Instrucciones
console.log('📝 SIGUIENTE PASO:');
console.log('1. Recarga la página (Ctrl+R)');
console.log('2. Deberías ver "3 conversiones restantes hoy" (si estás registrado)');
console.log('3. O "1 conversión restante hoy" (si estás como anónimo)');

console.log('🎯 Sistema reseteado correctamente. ¡Recarga la página!');