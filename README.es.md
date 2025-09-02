<div align="center">

[![Erdus](assets/Banner.JPEG)](https://erdus-inky.vercel.app)

# Erdus
### Conversor universal de diagramas ER

[Disponible en inglés](README.md) ✦ [Demo](https://erdus-inky.vercel.app) ✦ [Docs](#) ✦ [Contribuir](#-contribuir) ✦ [Roadmap](#-roadmap-erdus--conversor-universal)

**One IR to map them all.** Erdus es el **conversor universal open source** para diagramas ER y esquemas de bases de datos.  
Unifica ERDPlus, SQL DDL, Prisma, JSON Schema y más bajo una estricta **Representación Intermedia (IR)**.  
Construí una vez, convertí en cualquier lugar. 🚀

</div>

<br>

<div align="center">

![Stars](https://img.shields.io/github/stars/tobiager/Erdus?labelColor=black&style=for-the-badge&color=1280ff&logo=github)
![MIT](https://img.shields.io/badge/Licencia-MIT-FFF?labelColor=black&style=for-the-badge&color=1280ff)
![CI](https://img.shields.io/github/actions/workflow/status/tobiager/Erdus/ci.yml?label=CI&labelColor=black&style=for-the-badge&color=1280ff)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-FFF?labelColor=black&logo=vercel&style=for-the-badge&color=1280ff)

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white&style=for-the-badge&labelColor=black)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white&style=for-the-badge&labelColor=black)
![Node](https://img.shields.io/badge/Node-≥18-339933?logo=node.js&logoColor=white&style=for-the-badge&labelColor=black)

![Vercel OSS Program](https://vercel.com/oss/program-badge.svg)

</div>


- **100 % cliente (privacidad)**: los archivos nunca abandonan el navegador.
- **Entrada**: archivos `.erdplus` o `.json` (se detecta el formato automáticamente).
- **Salida**: `nombre-old.erdplus` o `nombre-new.erdplus` según la dirección de conversión.
- **Relaciones**: dibuja un solo enlace por cada FK (incluidas las compuestas) y lo ancla a las columnas reales de la tabla hija.

**Módulos disponibles**
- ERDPlus Old ⇄ New (incluido)

---

## 📁 Estructura del proyecto
```
.
├─ src/
│  ├─ app.ts           # UI: drag & drop, file input, descarga
│  ├─ convert.ts       # lógica de conversión old ⇄ new (lossless)
│  └─ types.ts         # tipos de ambos formatos (Old/New)
├─ public/
│  └─ favicon.svg
├─ index.html          # landing minimalista + dropzone
├─ vite.config.ts
├─ tsconfig.json
├─ vercel.json
├─ README.md
└─ LICENSE
```

---

## 🔗 Demo
- Producción: **https://erdus-inky.vercel.app**
- StackBlitz: [Sandbox interactivo](https://stackblitz.com/github/tobiager/Erdus)

> En ERDPlus (versión nueva) seleccioná **Menu → Restore → Upload** para abrir el archivo convertido. Las posiciones, tipos, restricciones y conexiones se mantienen intactas.

---

## ⚡ Quickstart (1 min)

```bash
git clone https://github.com/tobiager/Erdus.git
cd Erdus
npm i
npm run dev
```

Abrí [http://localhost:5173](http://localhost:5173) y arrastrá tu archivo `.erdplus` para convertirlo.

---

## ✨ Módulo ERDPlus Old ⇄ New
- **Detección automática** del formato de entrada (old o new).
- **Old → New**: tablas → *nodes*, atributos → *columns*, FKs simples o compuestas → una sola *edge* agrupada con `foreignKeyGroupId` estable.
- **New → Old**: *edges* → atributos FK y `connectors` con `fkSubIndex` para preservar el orden.
- **IDs determinísticos** para las columnas en NEW (`c-<idTabla>-<idAtributo>`), lo que permite a ERDPlus anclar las líneas y marcar las columnas como **(FK)**.
- **Privado por diseño**: todo el procesamiento ocurre localmente; no hay backend ni subida de archivos.
- **Compatible con Windows, macOS y Linux**. El servidor de desarrollo de Vite ofrece HMR instantáneo.

---

## 👐 Open source y escalable

- Proyecto con licencia MIT y núcleo modular.
- Nuevos convertidores o exportadores pueden sumarse como plugins simples.
- Incluye una CLI y una API mínima para integrarse en pipelines CI/CD, funciones serverless o clústeres de contenedores.

---

## 🧠 Módulo ERDPlus: ¿cómo funciona?
### Old → New (visual idéntico)
1. Lee las tablas de `shapes[]` y crea nodos con `id = t-<id>` y columnas `id = c-<idTabla>-<idAttr>`.
2. Reconstruye las FKs priorizando `connectors[]` (fuente de verdad en Old).
   - Agrupa por (tablaHija → tablaPadre), **ordena por `fkSubIndex`** y genera una sola *edge* por FK compuesta.
   - En `foreignKeyProps.columns[].id` utiliza el identificador de la columna real del hijo; ERDPlus dibuja la línea y etiqueta *(FK)*.
3. Asigna un `foreignKeyGroupId` estable en base al hijo, el padre y el conjunto ordenado de atributos.

### New → Old (estructura equivalente)
1. Convierte nodos y columnas a tablas y atributos conservando PK, UNIQUE, NULL y tipos.
2. De cada *edge* genera atributos FK en la tabla hija con `references` apuntando a la PK del padre y `fkSubIndex` siguiendo el orden de columnas de la *edge*.
3. Crea `connectors` por cada columna FK para que cualquier visor antiguo pueda dibujar las conexiones.

> **Garantías**
> - Round‑trip **old → new → old** sin pérdida: estructura, claves, orden y posiciones se preservan.
> - Round‑trip **new → old → new**: mantiene nodos, *edges* y columnas FK.
> - El JSON “new” puede diferir en IDs internos no visibles, pero es visual y semánticamente equivalente.

---

## 🚀 Uso local

### Requisitos
- **Node 18+** (ideal 20+)
- **npm** o **pnpm**

### Pasos
```bash
# instalar dependencias
npm i
# o con pnpm:
# corepack enable && corepack prepare pnpm@8 --activate
# pnpm i

# levantar en modo desarrollo
npm run dev
# (abre http://localhost:5173)

# compilar para producción
npm run build

# previsualizar la compilación
npm run preview
```

---

## Probar la conversión
1. Abrí la aplicación local en `http://localhost:5173`.
2. Arrastrá o seleccioná un archivo `.erdplus` (old o new) y presioná **Convertir**.
3. Se descargará automáticamente `*-new.erdplus` o `*-old.erdplus` según corresponda.
4. En ERDPlus nuevo: **Restore → Upload** para verificar que el diagrama sea idéntico.

En Windows/PowerShell, si aparecen conflictos de peer dependencies al instalar, fijá ESLint 8.57:
```bash
npm i -D eslint@8.57.0
npm i
```

---

## 📚 Ejemplos

- [examples/next](examples/next)
- [examples/ci4](examples/ci4)
- [examples/supabase](examples/supabase)
- Documentación: [docs](docs/README.md)

---

## ☁️ Deploy en Vercel
1. Importá el repositorio (Framework: **Vite**).
2. Build: `npm run build`
3. Directorio de salida: `dist/`

El archivo `vercel.json` ya apunta a `dist/`.


---

## 🔒 Privacidad y seguridad
- El procesamiento se realiza completamente en tu navegador.
- No se envían archivos a ningún servidor, ni siquiera a Vercel.
- Podés usarlo offline con `npm run build` seguido de `npm run preview`.

---

## 🧭 Limitaciones conocidas
- ERDPlus (versión new) puede enrutar las líneas de forma distinta (curvas), pero las conexiones y cardinalidades son correctas.
- Si tu archivo NEW proviene de otra herramienta con IDs propietarios, el conversor no clonará esos IDs. No son visibles y no afectan el render.

---

## 🗺️ Roadmap ERDUS — Conversor Universal

🟢 **Fase 0 – Lo que ya existe (base)**

- ERDPlus old ⇄ new
- ✔️ Soporte completo de PK, FK, unique groups
- ✔️ Round-trip lossless
-  Público: estudiantes, profes, ejercicios de facu

---

🟡 **Fase 1 – MVP “útil + viral”**

 *Objetivo*: hacer que cualquiera lo pueda usar online y le sirva YA

- IR canónico (v1) → núcleo
- IR → PostgreSQL DDL → generar `CREATE TABLE` real
- IR → Prisma schema → conectar con Next.js/TS
- Web demo (Vercel) → drag & drop + pestañas con resultados + loss report
- CLI simple (`erdus convert ...`)
-  Atrae: fullstackers, devs indie, estudiantes → primeras ⭐

---

🔵 **Fase 2 – Import & documentación**

 *Objetivo*: importar modelos existentes y documentarlos

- PostgreSQL DDL → IR (parser robusto)
- IR → dbml → usar en dbdiagram.io
- IR → Mermaid ER → documentar en Markdown/repos
- Ejemplos completos (blog, e‑commerce, escuela)
-  Atrae: devs que documentan, OSS maintainers → visibilidad en GitHub

---

🟣 **Fase 3 – Ecosistema dev**

 *Objetivo*: ser útil en pipelines y proyectos serios

- IR → JSON Schema (APIs, validación)
- IR → TypeORM/Sequelize models
- IR → Supabase schema (+ políticas RLS opcionales)
- Diff/Migration plan: comparar dos IR → script SQL `ALTER`
-  Atrae: startups, proyectos SaaS → estrellas de gente productiva

---

🔴 **Fase 4 – Advanced / killer features**

 *Objetivo*: expandirse a NoSQL y APIs modernas

- IR ↔ Mongoose schemas (MongoDB)
- IR ↔ OpenAPI schemas
- IR ↔ GraphQL SDL
- Visualizer: editor web básico con vista ERD interactiva
-  Atrae: devs modernos, comunidad API/GraphQL
-  Este es el punto donde se puede volver referencia estándar OSS

---

📈 **Orden de salida recomendado**

1. Fase 1 (MVP): Postgres + Prisma + web demo (rápido valor, viral)
2. Fase 2: Documentación (dbml/Mermaid) → viralidad en GitHub/Reddit
3. Fase 3: JSON Schema + Supabase + Diff → devs serios
4. Fase 4: MongoDB + GraphQL + Visualizer → consolidación como suite universal

---

🌟 **Estrategia de crecimiento**

- Cada fase = un release con changelog y post en Reddit/HN/Twitter
- README con GIFs cortos (drag & drop, output instantáneo)
- Badges de CI + demo online → confianza
- Good first issues para invitar a PRs → comunidad

---

## 🤝 Contribuir
1. Hacé un fork y creá una rama `feat/mi-mejora`.
2. `npm i` y `npm run dev`.
3. Acompañá los cambios con un archivo `.erdplus` de ejemplo si aplica.
4. Abrí un PR — ¡los PRs son bienvenidos!

---

## 🧪 Testing (opcional)

Si activás los tests (Vitest), podés validar los round‑trips:
```bash
npm run test
```
- **old → new → old**: deben conservarse tablas, atributos, posiciones y claves.
- **new → old → new**: deben conservarse nodos, *edges* y columnas FK.

---

## ❓ FAQ

**¿El conversor sube mis archivos?** No, todo corre en tu navegador.

**¿Funciona con claves foráneas compuestas?** Sí, soporta FKs múltiples sin perder información.

---

## 🤝🏻 Principales contribuidores

Gracias a todas las personas que contribuyen al crecimiento de este proyecto. ¡Tu contribución también puede aparecer aquí!

<p align="center">
  <a href="https://github.com/tobiager/erdus/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=tobiager/erdus" alt="Principales contribuidores" />
  </a>
</p>

---

## 📝 Licencia

MIT — ver [LICENSE](LICENSE).

