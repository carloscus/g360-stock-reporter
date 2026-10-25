<!-- g360:agents:begin -->
# AGENTS.md — g360-stock-reporter-lit

Sistema de reportes de stock para CIPSA — PWA offline-first con datos en vivo desde API.

> El bloque entre los markers `g360:agents` lo genera `g360 agents` y se
> regenera sin perder lo que escribas afuera.

## Verificación

Un solo comando deja el repo listo y verifica que todo esté en verde:

```bash
npm ci
npm test
```

- Stack: node (npm)
- Tests: Vitest

## Instalación

```bash
npm ci
```


## Estructura

- `src/`
- `tests/`
- `g360/`
- `scripts/`
- `index.html`

## Convenciones

- Los scripts de `package.json` son la interfaz del repo: agregar un comando nuevo es agregar un script.
- Tests con Vitest/Jest junto al módulo (`*.test.js`).
- Comentarios que expliquen el *por qué*, no el *qué*.

## Reglas de este repo

- **Autosuficiente**: `git clone` + el comando de verificación debe dejar la app levantada y los tests en verde, sin red y sin ayuda de una persona.
- **Tests honestos**: nada de `it.skip`, `pytest.mark.skip`, `xfail` ni `assert true` para forzar verde.
- **Entorno declarativo**: toda variable de entorno va en `.env.example` con un default seguro.
- **Sin paths de tu máquina**: nada de rutas absolutas locales ni secretos en el código.
- **Evidencia**: al entregar, reportá el comando que corriste y su salida. Si no pudiste verificar, decilo.
<!-- g360:agents:end -->
