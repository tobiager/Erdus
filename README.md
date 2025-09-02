<div align="center">

[![Erdus](assets/Banner.JPEG)](https://erdus-inky.vercel.app)

# Erdus
### Universal ER Diagram Converter

[Also available in Spanish](README.es.md) ✦ [Demo](https://erdus-inky.vercel.app) ✦ [Docs](#) ✦ [Contributing](#contributing) ✦ [Roadmap](#%EF%B8%8F-roadmap--universal-converter)

**One IR to map them all.** Erdus is the **open-source universal converter** for ER diagrams and database schemas.  
It unifies ERDPlus, SQL DDL, Prisma, JSON Schema and more under a strict **Intermediate Representation (IR)**.  
Build once, convert everywhere. 🚀

</div>

<br>

<div align="center">

![Stars](https://img.shields.io/github/stars/tobiager/Erdus?labelColor=black&style=for-the-badge&color=1280ff&logo=github)
![MIT](https://img.shields.io/badge/License-MIT-FFF?labelColor=black&style=for-the-badge&color=1280ff)
![CI](https://img.shields.io/github/actions/workflow/status/tobiager/Erdus/ci.yml?label=CI&labelColor=black&style=for-the-badge&color=1280ff)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-FFF?labelColor=black&logo=vercel&style=for-the-badge&color=1280ff)

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white&style=for-the-badge&labelColor=black)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white&style=for-the-badge&labelColor=black)
![Node](https://img.shields.io/badge/Node-≥18-339933?logo=node.js&logoColor=white&style=for-the-badge&labelColor=black)

![Vercel OSS Program](https://vercel.com/oss/program-badge.svg)

</div>


- **100% client side (privacy)**: files never leave the browser.
- **Input**: `.erdplus` or `.json` files (format detected automatically).
- **Output**: `name-old.erdplus` or `name-new.erdplus` depending on the conversion direction.
- **Relationships**: draws a single link for each FK (including composites) and anchors it to the actual child columns.

**Available modules**
- ERDPlus Old ⇄ New (bundled)

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

## 🔗 Demo
- Production: **https://erdus-inky.vercel.app**

> In ERDPlus (new version) choose **Menu → Restore → Upload** to open the converted file. Positions, types, constraints and connections remain intact.

---

## ✨ ERDPlus module features
- **Automatic detection** of the input format (old or new).
- **Old → New**: tables → *nodes*, attributes → *columns*, simple or composite FKs → a single grouped *edge* with stable `foreignKeyGroupId`.
- **New → Old**: *edges* → FK attributes and `connectors` with `fkSubIndex` to preserve order.
- **Deterministic IDs** for columns in NEW (`c-<tableId>-<attrId>`) allowing ERDPlus to anchor lines and tag columns as **(FK)**.
- **Private by design**: all processing happens locally; there is no backend or file upload.
- **Works on Windows, macOS and Linux**. Vite's dev server provides instant HMR.

---

## 👐 Open source & scalable

- MIT-licensed with a lightweight, modular core.
- New converters or exporters can plug in as simple modules.
- Ships a CLI and minimal API so it fits CI/CD pipelines, serverless functions or container clusters.

---

## 🧠 ERDPlus module: how it works
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

## 🔒 Privacy & security
- Processing happens entirely in your browser.
- No files are sent to any server, not even Vercel.
- You can use it offline with `npm run build` followed by `npm run preview`.

---

## 🧭 Known limitations
- ERDPlus (new version) may route lines differently (curves) but connections and cardinalities are correct.
- If your NEW file comes from another tool with proprietary IDs, the converter will not clone those IDs. They are invisible and do not affect rendering.

---

## 🗺️ Roadmap — Universal Converter

🟢 **Phase 0 – What exists today (base)**

- ERDPlus old ⇄ new
- ✅ Full support for PK, FK, unique groups
- ✅ Lossless round-trip
-  Audience: students, teachers, university exercises

---

🟡 **Phase 1 – “Useful + viral” MVP**

 *Goal*: anyone can use it online and get value right away

- Canonical IR (v1) → core
- IR → PostgreSQL DDL → generate real `CREATE TABLE`
- IR → Prisma schema → connect with Next.js/TypeScript
- Web demo (Vercel) → drag & drop, result tabs, loss report
- Simple CLI (`erdus convert ...`)
-  Attracts: fullstack devs, indie hackers, students → first stars

---

🔵 **Phase 2 – Import & documentation**

 *Goal*: import existing models and document them

- PostgreSQL DDL → IR (robust parser)
- IR → dbml → use in dbdiagram.io
- IR → Mermaid ER → document in Markdown/repos
- Complete examples (blog, e‑commerce, school)
-  Attracts: devs who document, OSS maintainers → visibility on GitHub

---

🟣 **Phase 3 – Developer ecosystem**

 *Goal*: be useful in pipelines and serious projects

- IR → JSON Schema (APIs, validation)
- IR → TypeORM/Sequelize models
- IR → Supabase schema (+ optional RLS policies)
- Diff/Migration plan: compare two IR → SQL `ALTER` script
-  Attracts: startups, SaaS projects → stars from productive folks

---

🔴 **Phase 4 – Advanced / killer features**

 *Goal*: expand to NoSQL and modern APIs

- IR ↔ Mongoose schemas (MongoDB)
- IR ↔ OpenAPI schemas
- IR ↔ GraphQL SDL
- Visualizer: basic web editor with interactive ERD view
-  Attracts: modern devs, API/GraphQL community
-  This is where ERDUS could become the OSS standard

---

📈 **Recommended release order**

1. Phase 1 (MVP): Postgres + Prisma + web demo (fast value, viral)
2. Phase 2: Documentation (dbml/Mermaid) → virality on GitHub/Reddit
3. Phase 3: JSON Schema + Supabase + Diff → serious devs
4. Phase 4: MongoDB + GraphQL + Visualizer → universal suite consolidation

---

🌟 **Growth strategy**

- Each phase = a release with changelog and post on Reddit/HN/Twitter
- README with short GIFs (drag & drop, instant output)
- CI badges + online demo → trust
- “Good first issues” to invite PRs → community

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

