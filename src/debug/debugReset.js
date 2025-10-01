// Debug script para verificar el reset diario
// Ejecutar en DevTools -> Console

function debugMonetizationReset() {
  console.log('🔍 === DEBUG RESET DIARIO ===');

  // 1. Ver datos actuales en localStorage
  const stored = localStorage.getItem('convertpro_usage');
  console.log('📦 LocalStorage actual:', stored);

  if (stored) {
    const usage = JSON.parse(stored);
    console.log('📊 Datos parseados:', usage);

    // 2. Ver fechas
    const storedDate = new Date(usage.lastReset);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('📅 Fecha almacenada:', storedDate);
    console.log('📅 Fecha hoy (00:00):', today);
    console.log('⏰ Diferencia en días:', Math.floor((today - storedDate) / (1000 * 60 * 60 * 24)));

    // 3. Verificar condición de reset
    console.log('🔄 ¿Necesita reset?', storedDate < today);
    console.log('🔄 Comparación exacta:', storedDate.getTime(), '<', today.getTime());
  }

  console.log('=== FIN DEBUG ===');
}

// Función para forzar reset manual
function forceReset() {
  console.log('🔄 Forzando reset manual...');
  localStorage.removeItem('convertpro_usage');
  console.log('✅ Reset completado. Recarga la página.');
}

// Función para simular reset de ayer
function simulateYesterday() {
  console.log('📅 Simulando que el último reset fue ayer...');
  const stored = localStorage.getItem('convertpro_usage');
  if (stored) {
    const usage = JSON.parse(stored);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    usage.lastReset = yesterday.toISOString();
    localStorage.setItem('convertpro_usage', JSON.stringify(usage));
    console.log('✅ Simulación completada. Recarga la página.');
  }
}

console.log('🛠️ Funciones de debug disponibles:');
console.log('- debugMonetizationReset() - Ver estado actual');
console.log('- forceReset() - Limpiar todo');
console.log('- simulateYesterday() - Simular reset de ayer');