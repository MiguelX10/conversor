// Script para resetear conversiones y probar el nuevo sistema
// Ejecutar en DevTools -> Console

console.log('🔄 RESETEANDO SISTEMA DE CONVERSIONES...');

// 1. Ver estado actual
console.log('📊 Estado ANTES del reset:');
const oldUsage = localStorage.getItem('convertpro_usage');
const oldHistory = localStorage.getItem('conversionHistory');
console.log('Conversiones:', oldUsage ? JSON.parse(oldUsage) : 'No hay datos');
console.log('Historial:', oldHistory ? JSON.parse(oldHistory).length + ' elementos' : 'No hay datos');

// 2. Limpiar sistema de conversiones
localStorage.removeItem('convertpro_usage');
console.log('✅ Conversiones reseteadas');

// 3. Limpiar historial
localStorage.removeItem('conversionHistory');
console.log('✅ Historial limpiado');

console.log('🎯 SISTEMA COMPLETAMENTE RESETEADO');
console.log('📝 SIGUIENTE PASO:');
console.log('1. Recarga la página (Ctrl+R)');
console.log('2. Deberías ver "3 conversiones restantes hoy"');
console.log('3. Prueba convertir 3 imágenes a PDF');
console.log('4. Debería contar como 1 sola conversión');
console.log('5. Verificar en historial que aparece como "3 JPG → PDF"');

location.reload();