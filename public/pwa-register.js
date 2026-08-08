/**
 * @file pwa-register.js
 * @description Registro del Service Worker con soporte de actualización
 *              y sincronización de datos desde SW a localStorage.
 */

// Solo activar PWA en producción (GitHub Pages) — en dev interfiere con Vite
if ('serviceWorker' in navigator && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  window.addEventListener('load', () => {
    // Base resolvida dinámicament desde la ruta actual (funciona en dev y producción)
    const base = new URL('./', window.location.href);
    navigator.serviceWorker
      .register(new URL('sw.js', base), { scope: base })
      .then((registration) => {
        console.log('[PWA] SW registrado:', registration.scope);

        // Escuchar mensajes del SW (sync de datos)
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'STOCK_SYNC' && event.data.data) {
            console.log('[PWA] Datos sincronizados desde SW');
            // Notificar a la app para actualizar UI
            window.dispatchEvent(new CustomEvent('stock-synced', { detail: event.data.data }));
          }
        });

        // Verificar actualizaciones cada 30 min
        setInterval(() => registration.update(), 30 * 60 * 1000);

        // Notificar cuando hay nueva versión
        registration.addEventListener('updatefound', () => {
          const newSW = registration.installing;
          if (!newSW) return;
          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] Nueva versión disponible, refresca para actualizar');
            }
          });
        });
      })
      .catch((err) => console.error('[PWA] SW falló:', err));
  });
}

// Prompt de instalación PWA
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('[PWA] Instalable detectado');
});

export function promptInstall() {
  if (!deferredPrompt) return null;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then((result) => {
    if (result.outcome === 'accepted') {
      console.log('[PWA] Instalado');
    }
    deferredPrompt = null;
  });
  return deferredPrompt;
}
