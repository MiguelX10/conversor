// Utilidad para crear un fingerprint básico del navegador (anti-abuse)
export function getBrowserFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Datos del navegador que son únicos pero no invasivos
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.platform,
    navigator.cookieEnabled,
    // Canvas fingerprint básico
    (() => {
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Browser fingerprint', 2, 2);
        return canvas.toDataURL().slice(-50); // Solo últimos 50 chars
      }
      return '';
    })()
  ].join('|');

  // Crear hash simple (no criptográfico, solo para identificación)
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36).slice(0, 8); // 8 chars alfanuméricos
}