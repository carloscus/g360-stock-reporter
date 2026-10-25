import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const css = readFileSync(
  fileURLToPath(new URL('../src/styles/main.css', import.meta.url)),
  'utf8',
);

const TOKENS = [
  '--g360-accent', '--g360-accent-strong', '--g360-on-accent',
  '--g360-success', '--g360-success-bg', '--g360-success-border',
  '--g360-warning', '--g360-warning-bg', '--g360-warning-border',
  '--g360-danger', '--g360-danger-bg', '--g360-danger-border',
  '--g360-info', '--g360-info-bg', '--g360-info-border',
  '--lote-ves', '--lote-ves-bg', '--lote-ves-border',
  '--lote-129', '--lote-129-bg', '--lote-129-border',
  '--lote-40', '--lote-40-bg', '--lote-40-border',
  '--lote-121', '--lote-121-bg', '--lote-121-border',
  '--lote-122', '--lote-122-bg', '--lote-122-border',
];

describe('paleta semántica', () => {
  it('define cada token en ambos temas (dark y light)', () => {
    for (const token of TOKENS) {
      const veces = css.split(`${token}:`).length - 1;
      expect(veces, `${token} debe definirse en dark y en light`).toBeGreaterThanOrEqual(2);
    }
  });

  it('no depende del light-dark() invertido de los tokens generados', () => {
    const sinComentarios = css.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(sinComentarios).not.toContain('light-dark(');
  });

  it('el acento de marca se mantiene y el claro usa un verde AA', () => {
    expect(css).toContain('--g360-accent: #00d084');
    expect(css).toContain('--g360-accent: #047857');
  });
});
