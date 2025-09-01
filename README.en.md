# Erdus
## ERDPlus Old ⇄ New Converter

[![CI](https://github.com/tobiager/Erdus/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/tobiager/Erdus/actions/workflows/ci.yml)
[![Vercel](https://img.shields.io/badge/deploy-Vercel-black?logo=vercel)](https://erdus-inky.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Stars](https://img.shields.io/github/stars/tobiager/Erdus?logo=github)
![Issues](https://img.shields.io/github/issues/tobiager/Erdus)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)
![Node](https://img.shields.io/badge/Node-≥18-339933?logo=node.js&logoColor=white)

Erdus is a **lossless** converter between ERDPlus **old** and **new** formats. It handles **composite foreign keys**, generates deterministic column IDs, preserves order and positions and rebuilds all relationships so the diagram looks identical after being restored in ERDPlus.

- **100% client side (privacy)**: files never leave the browser.
- **Input**: `.erdplus` or `.json` files (format detected automatically).
- **Output**: `name-old.erdplus` or `name-new.erdplus` depending on the conversion direction.
- **Relationships**: draws a single link for each FK (including composites) and anchors it to the actual child columns.

---

## 🔗 Demo
- Production: **https://erdus-inky.vercel.app**

> In ERDPlus (new version) choose **Menu → Restore → Upload** to open the converted file. Positions, types, constraints and connections remain intact.

---

## ✨ Features
- **Automatic detection** of the input format (old or new).
- **Old → New**: tables → *nodes*, attributes → *columns*, simple or composite FKs → a single grouped *edge* with stable `foreignKeyGroupId`.
- **New → Old**: *edges* → FK attributes and `connectors` with `fkSubIndex` to preserve order.
- **Deterministic IDs** for columns in NEW (`c-<tableId>-<attrId>`) allowing ERDPlus to anchor lines and tag columns as **(FK)**.
- **Private by design**: all processing happens locally; there is no backend or file upload.
- **Works on Windows, macOS and Linux**. Vite's dev server provides instant HMR.

---

## 🧠 How it works
### Old → New (identical visuals)
1. Reads `shapes[]` tables and creates nodes with `id = t-<id>` and columns `id = c-<tableId>-<attrId>`.
2. Reconstructs FKs prioritizing `connectors[]` (source of truth in Old).
   - Groups by (child → parent), **orders by `fkSubIndex`** and generates a single edge per composite FK.
   - Uses the real child column ID in `foreignKeyProps.columns[].id`; ERDPlus draws the line and labels *(FK)*.
3. Assigns a stable `foreignKeyGroupId` based on the child, parent and ordered set of attributes.

### New → Old (equivalent structure)
1. Converts nodes and columns to tables and attributes preserving PK, UNIQUE, NULL and types.
2. From each edge creates FK attributes in the child table with `references` pointing to the parent's PK and `fkSubIndex` following the edge column order.
3. Creates `connectors` per FK column so that legacy viewers can draw the connections.

> **Guarantees**
> - Round‑trip **old → new → old** without loss: structure, keys, order and positions are preserved.
> - Round‑trip **new → old → new**: nodes, edges and FK columns are preserved.
> - The “new” JSON may differ in internal invisible IDs but is visually and semantically equivalent.

---

## 🚀 Local usage

### Requirements
- **Node 18+** (20+ recommended)
- **npm** or **pnpm**

### Steps
```bash
# install dependencies
npm i
# or with pnpm:
# corepack enable && corepack prepare pnpm@8 --activate
# pnpm i

# run in development mode
npm run dev
# (opens http://localhost:5173)

# build for production
npm run build

# preview the build
npm run preview
```

---

## Testing the conversion
1. Open the local app at `http://localhost:5173`.
2. Drag or select a `.erdplus` file (old or new) and press **Convert**.
3. `*-new.erdplus` or `*-old.erdplus` will download automatically as appropriate.
4. In ERDPlus new: **Restore → Upload** to verify the diagram is identical.

On Windows/PowerShell, if peer dependency conflicts appear, pin ESLint 8.57:
```bash
npm i -D eslint@8.57.0
npm i
```

---

## ☁️ Deploy on Vercel
1. Import the repository (Framework: **Vite**).
2. Build: `npm run build`
3. Output directory: `dist/`

`vercel.json` already points to `dist/`.

---

## 📁 Project structure
```
.
├─ src/
│  ├─ app.ts           # UI: drag & drop, file input, download
│  ├─ convert.ts       # conversion logic old ⇄ new (lossless)
│  └─ types.ts         # types for both formats (Old/New)
├─ public/
│  └─ favicon.svg
├─ index.html          # minimal landing + dropzone
├─ vite.config.ts
├─ tsconfig.json
├─ vercel.json
├─ README.md
└─ LICENSE
```

---

## 🔒 Privacy & security
- Processing happens entirely in your browser.
- No files are sent to any server, not even Vercel.
- You can use it offline with `npm run build` followed by `npm run preview`.

---

## 🧭 Known limitations
- ERDPlus (new version) may route lines differently (curves) but connections and cardinalities are correct.
- If your NEW file comes from another tool with proprietary IDs, the converter will not clone those IDs. They are invisible and do not affect rendering.

---

## 🗺️ Roadmap
- CLI (Node) to convert from the command line.
- "Explain diff" view to compare original vs converted JSON.
- PWA (offline) and light/dark mode switch.
- More tests for edge cases: multiple FKs between the same tables, partially optional FKs, etc.

---

## 🤝 Contributing
1. Fork and create a `feat/my-improvement` branch.
2. `npm i` and `npm run dev`.
3. Include an example `.erdplus` file when relevant.
4. Open a PR — contributions are welcome!

---

## 🧪 Testing (optional)

If you enable tests (Vitest), you can validate round trips:
```bash
npm run test
```
- **old → new → old**: tables, attributes, positions and keys must be preserved.
- **new → old → new**: nodes, edges and FK columns must be preserved.

---

## 📝 License

MIT — see [LICENSE](LICENSE).

