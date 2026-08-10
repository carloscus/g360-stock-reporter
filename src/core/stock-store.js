/**
 * @file stock-store.js
 * @description Store centralizado con 3 capas de persistencia + frescura de datos.
 *   1. Memoria (in-memory) — inmediata, sesión actual
 *   2. sessionStorage — sobrevive recargas (TTL 5 min)
 *   3. localStorage — persiste entre sesiones (7 días)
 *
 *   FRESCHNESS (15 min): si los datos tienen >15 min, se marca como stale
 *   y se fuerza refresh en segundo plano sin bloquear la UI.
 *
 * Flujo de carga: memoria → sessionStorage → localStorage → API
 * Flujo de guardado: API → localStorage → sessionStorage → memoria
 * @author @carloscus
 * @version 3.0.0
 */

export const INSPECCION_ALMACEN = '121';

const KEYS = {
  session: 'g360_stock_data_v1',
  local: 'g360_stock_data_local_v1',
  meta: 'g360_stock_meta_v1',
  theme: 'g360-theme',
};

const LOCAL_TTL = 7 * 24 * 60 * 60 * 1000; // 7 días
const SESSION_TTL = 5 * 60 * 1000;         // 5 minutos
const FRESHNESS_TTL = 15 * 60 * 1000;      // 15 minutos — API se actualiza cada ~15 min

let _subscribers = new Set();
let _cachedData = null;
let _meta = null;
let _stalenessTimer = null;

// ── Helpers seguros ────────────────────────────────────────────────
function _safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function _safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* quota exceeded */ }
}
function _safeSessionGet(key) {
  try { return sessionStorage.getItem(key); } catch { return null; }
}
function _safeSessionSet(key, value) {
  try { sessionStorage.setItem(key, value); } catch { /* noop */ }
}

// ── Metadatos ──────────────────────────────────────────────────────
export function getMeta() {
  if (_meta) return _meta;
  const raw = _safeGet(KEYS.meta);
  if (raw) {
    try { _meta = JSON.parse(raw); } catch { _meta = null; }
  }
  return _meta;
}

function setMeta(meta) {
  _meta = meta;
  _safeSet(KEYS.meta, JSON.stringify(meta));
}

// ── isStale: ¿los datos necesitan refresh? ────────────────────────
export function isStale(timestamp) {
  // Si se provee timestamp (ej: data.lastUpdated del API), usar ese.
  // Si no, usar meta.lastFetchedAt (cuando se guardó en localStorage).
  if (timestamp) {
    const age = Date.now() - new Date(timestamp).getTime();
    return age > FRESHNESS_TTL;
  }
  const meta = getMeta();
  if (!meta || !meta.lastFetchedAt) return true;
  const age = Date.now() - new Date(meta.lastFetchedAt).getTime();
  return age > FRESHNESS_TTL;
}

// ── getTimeAgo: formato legible del tiempo transcurrido ───────────
export function getTimeAgo(isoString) {
  if (!isoString) return null;
  const age = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(age / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m`;
  return `${hrs}h`;
}

// ── loadData: prioridad + verificación de frescura ────────────────
export function loadData() {
  // 1. Memoria
  if (_cachedData) return _cachedData;

  // 2. sessionStorage (< 5 min)
  const sessionRaw = _safeSessionGet(KEYS.session);
  if (sessionRaw) {
    try {
      const { ts, data } = JSON.parse(sessionRaw);
      if (Date.now() - ts < SESSION_TTL) {
        _cachedData = data;
        return data;
      }
    } catch { /* corrupt */ }
  }

  // 3. localStorage (hasta 7 días)
  const localRaw = _safeGet(KEYS.local);
  if (localRaw) {
    try {
      const { ts, data } = JSON.parse(localRaw);
      if (Date.now() - ts < LOCAL_TTL) {
        _cachedData = data;
        _safeSessionSet(KEYS.session, JSON.stringify({ ts, data }));
        return data;
      }
    } catch { /* corrupt */ }
  }

  return null;
}

// ── saveData: escribe en las 3 capas ──────────────────────────────
export function saveData(data, meta = {}) {
  const ts = Date.now();
  const payload = { ts, data };

  _cachedData = data;
  _meta = { ...meta, lastFetchedAt: new Date(ts).toISOString() };

  _safeSessionSet(KEYS.session, JSON.stringify(payload));
  _safeSet(KEYS.local, JSON.stringify(payload));
  _safeSet(KEYS.meta, JSON.stringify(_meta));

  // Cancelar timer anterior y programar nuevo check de frescura
  if (_stalenessTimer) clearTimeout(_stalenessTimer);
  _stalenessTimer = setTimeout(() => {
    for (const fn of _subscribers) {
      if (fn._onStale) fn._onStale();
    }
  }, FRESHNESS_TTL);

  // Notificar suscriptores
  for (const fn of _subscribers) fn(data);
}

// ── Suscripción (pub/sub) ─────────────────────────────────────────
export function subscribe(fn) {
  _subscribers.add(fn);
  // Forzar carga desde sessionStorage/localStorage → memoria.
  // Si no se hace, un arranque con cache pero sin memoria deja la UI en blanco
  // hasta que saveData() notifique (p. ej. hasta que termine el fetch de API).
  const mem = loadData();
  if (mem) fn(mem);
  return () => {
    _subscribers.delete(fn);
    if (_subscribers.size === 0 && _stalenessTimer) {
      clearTimeout(_stalenessTimer);
      _stalenessTimer = null;
    }
  };
}

// ── Invalidar todo ─────────────────────────────────────────────────
export function invalidateAll() {
  _cachedData = null;
  _meta = null;
  if (_stalenessTimer) { clearTimeout(_stalenessTimer); _stalenessTimer = null; }
  try { sessionStorage.removeItem(KEYS.session); } catch { /* noop */ }
  try { localStorage.removeItem(KEYS.local); } catch { /* noop */ }
  try { localStorage.removeItem(KEYS.meta); } catch { /* noop */ }
}

// ── Estado del cache ──────────────────────────────────────────────
export function getCacheStatus() {
  const meta = getMeta();
  const sessionRaw = _safeSessionGet(KEYS.session);
  const localRaw = _safeGet(KEYS.local);

  return {
    hasMemory: !!_cachedData,
    hasSession: !!sessionRaw,
    hasLocal: !!localRaw,
    isFresh: meta ? (Date.now() - new Date(meta.lastFetchedAt).getTime() <= FRESHNESS_TTL) : false,
    meta: meta || null,
    source: _cachedData?.fuente || 'unknown',
  };
}

// ── Theme ──────────────────────────────────────────────────────────
export function getTheme() {
  return localStorage.getItem(KEYS.theme) || 'dark';
}
export function setTheme(theme) {
  localStorage.setItem(KEYS.theme, theme);
}
