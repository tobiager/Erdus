# ERDPlus Old ⇄ New Converter

[![CI](https://img.shields.io/github/actions/workflow/status/your-user/erdplus-converter/ci.yml?branch=main)](https://github.com/your-user/erdplus-converter/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Vercel](https://img.shields.io/badge/deploy-Vercel-black?logo=vercel)](https://erdplus-converter.vercel.app)

Conversor **lossless** entre formatos **old** y **new** de ERDPlus. Soporta **FKs compuestas**, mapeo determinístico de IDs y preserva orden/posiciones.

- 100% cliente (privacidad): los archivos no salen del navegador.
- Entrada: `.erdplus` o `.json` (detecta formato automáticamente).
- Salida: `nombre-old.erdplus` o `nombre-new.erdplus` según corresponda.

## Demo
- Prod: https://erdus-inky.vercel.app

## Uso local
```bash
npm i
npm run dev           # abre http://localhost:5173
npm run test          # round-trip tests
npm run build         # build para producción (dist/)
```

## Deploy en Vercel
1. Importá el repo en Vercel (Framework: **Vite**).
2. Build: `npm run build` · Output: `dist/` (ya configurado en `vercel.json`).

## ¿Cómo funciona?
- **Old → New**: Tablas → nodos, atributos → columnas; FKs (incluidas compuestas) → edges con `foreignKeyGroupId` estable.  
- **New → Old**: Edges → atributos FK + `connectors` con `fkSubIndex` para conservar el orden de claves.

## Roadmap
- CLI (Node) usando la misma librería TS.
- Vista “Explain diff” para comparar JSON original vs convertido.
- PWA (offline) + toggle dark/light.

## Licencia
MIT
