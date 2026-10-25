/**
 * @file session.js
 * @description Sesión local simulada (nombre + email @cipsa.com.pe).
 *              NO es autenticación: no hay backend que valide credenciales.
 *              Sirve para firmar los reportes y evitar pedir datos en cada uno.
 * @author @carloscus
 * @version 1.0.0
 */

export const SESSION_KEY = 'g360_session_v1';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMINIO_RE = /@cipsa\.com\.pe$/i;

/** Email válido: formato correcto y dominio @cipsa.com.pe. */
export function validarEmail(email) {
  const value = String(email || '').trim();
  return EMAIL_RE.test(value) && DOMINIO_RE.test(value);
}

/** Sesión guardada en este equipo, o null si no existe/es inválida. */
export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { nombre = '', email = '' } = JSON.parse(raw);
    if (String(nombre).trim().length < 3 || !validarEmail(email)) return null;
    return { nombre: String(nombre).trim(), email: String(email).trim().toLowerCase() };
  } catch {
    return null;
  }
}

/**
 * Guarda la sesión validada. Lanza si nombre/email no cumplen, para que la
 * vista de login muestre el error en vez de crear una sesión inválida.
 */
export function saveSession({ nombre, email } = {}) {
  const limpio = {
    nombre: String(nombre || '').trim(),
    email: String(email || '').trim().toLowerCase(),
  };
  if (limpio.nombre.length < 3) {
    throw new Error('El nombre debe tener al menos 3 caracteres.');
  }
  if (!validarEmail(limpio.email)) {
    throw new Error('Usa un correo corporativo @cipsa.com.pe.');
  }
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...limpio, ts: Date.now() }));
  } catch { /* almacenamiento no disponible */ }
  return limpio;
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch { /* noop */ }
}
