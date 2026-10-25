import { describe, it, expect } from 'vitest';
import { validarEmail, saveSession, loadSession, clearSession } from '../src/core/session.js';

describe('validarEmail', () => {
  it('acepta correos del dominio cipsa', () => {
    expect(validarEmail('ccusi@cipsa.com.pe')).toBe(true);
    expect(validarEmail('  usuario.apellido@cipsa.com.pe  ')).toBe(true);
    expect(validarEmail('USER@CIPSA.COM.PE')).toBe(true);
  });

  it('rechaza otros dominios y formatos inválidos', () => {
    expect(validarEmail('ccusi@gmail.com')).toBe(false);
    expect(validarEmail('ccusi@cipsa.com')).toBe(false);
    expect(validarEmail('ccusi@sub.cipsa.com.pe')).toBe(false);
    expect(validarEmail('sin-arroba')).toBe(false);
    expect(validarEmail('')).toBe(false);
  });
});

describe('saveSession', () => {
  it('devuelve la sesión normalizada', () => {
    const s = saveSession({ nombre: '  Carlos Cusi ', email: ' CCUSI@CIPSA.COM.PE ' });
    expect(s).toEqual({ nombre: 'Carlos Cusi', email: 'ccusi@cipsa.com.pe' });
  });

  it('rechaza nombre corto', () => {
    expect(() => saveSession({ nombre: 'CV', email: 'ccusi@cipsa.com.pe' }))
      .toThrow(/al menos 3/);
  });

  it('rechaza correo fuera del dominio', () => {
    expect(() => saveSession({ nombre: 'Carlos', email: 'ccusi@gmail.com' }))
      .toThrow(/@cipsa\.com\.pe/);
  });
});

describe('loadSession / clearSession', () => {
  it('sin almacenamiento disponible devuelve null y no rompe', () => {
    expect(loadSession()).toBeNull();
    expect(() => clearSession()).not.toThrow();
  });
});
