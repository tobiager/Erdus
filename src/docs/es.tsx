import { ReactNode } from "react";

export const sectionsEs: Record<string, ReactNode> = {
    Overview: (
        <>
          <h2 className="text-xl font-semibold mb-2">Resumen</h2>
          <p>
            Erdus es un conversor universal open-source de diagramas ER. Permite la
            migración entre los formatos viejo/nuevo de ERDPlus, esquemas SQL, modelos
            Prisma y entidades TypeORM, preservando la integridad estructural.
          </p>
      
          <h3 className="text-lg font-semibold mt-4">Propósito y Alcance</h3>
          <p>
            Este documento ofrece una visión completa de Erdus, un conversor de
            formato ERDPlus que habilita conversiones bidireccionales sin pérdida entre
            los formatos viejo y nuevo. Esta página cubre el propósito central del
            sistema, los principios de arquitectura, las características clave y la
            filosofía de diseño orientada a la privacidad.
          </p>
          <p>
            Para detalles de implementación de los algoritmos de conversión, ver{" "}
            <strong>Motor de Conversión</strong>. Para integración en otros proyectos,
            ver <strong>Guía de Integración</strong>. Para la configuración de
            desarrollo y lineamientos de contribución, ver{" "}
            <strong>Guía de Desarrollo</strong>.
          </p>
      
          <h3 className="text-lg font-semibold mt-4">¿Qué es Erdus?</h3>
          <p>
            Erdus es una utilidad especializada de transformación de datos diseñada para
            resolver un problema concreto en los flujos de diseño de bases de datos:
            convertir entre los formatos viejo y nuevo de ERDPlus manteniendo la
            integridad estructural completa. ERDPlus es una herramienta popular de
            diagramas entidad-relación utilizada en educación y en ámbitos
            profesionales.
          </p>
          <p>El sistema funciona como:</p>
          <ul className="list-disc pl-6">
            <li>Aplicación web</li>
            <li>Librería reutilizable (<code>erdplus-converter</code>)</li>
          </ul>
          <p>Ofrece:</p>
          <ul className="list-disc pl-6">
            <li>Conversión sin pérdida entre formatos ERDPlus</li>
            <li>Soporte de claves foráneas compuestas para relaciones complejas</li>
            <li>100% de procesamiento en el cliente para máxima privacidad</li>
            <li>Generación determinística de IDs para conversiones consistentes</li>
            <li>Validación de ida y vuelta que garantiza equivalencia estructural</li>
          </ul>
      
          <h3 className="text-lg font-semibold mt-4">Visión de la Arquitectura</h3>
          <p>
            Erdus sigue una separación clara de responsabilidades con tres capas
            principales. La arquitectura prioriza la privacidad por diseño: todo el
            procesamiento ocurre en el navegador, sin componentes de servidor.
          </p>
          <p>
            El motor de conversión en <code>src/convert.ts</code> maneja la lógica
            central de transformación, mientras que <code>src/app.ts</code> gestiona
            las interacciones de usuario y las operaciones con archivos.
          </p>
      
          <h3 className="text-lg font-semibold mt-4">Proceso de Conversión</h3>
          <p>
            Erdus implementa conversión bidireccional con algoritmos específicos para
            cada dirección. El proceso mantiene la integridad de FKs compuestas
            agrupando columnas relacionadas mediante{" "}
            <code>foreignKeyGroupId</code> y preservando el orden de columnas con{" "}
            <code>fkSubIndex</code>.
          </p>
      
          <h3 className="text-lg font-semibold mt-4">Características y Garantías</h3>
          <ul className="list-disc pl-6">
            <li>
              <strong>Arquitectura privacy-first:</strong> toda la lógica corre en el
              navegador; no se suben archivos.
            </li>
            <li>
              <strong>Modo offline:</strong> el build estático funciona sin red.
            </li>
            <li>
              <strong>Garantías de conversión:</strong> bidireccional y sin pérdida,
              manteniendo equivalencia estructural.
            </li>
            <li>
              <strong>Soporte de FKs compuestas:</strong> manejo multi-columna.
            </li>
            <li>
              <strong>IDs determinísticos:</strong> IDs estables (
              <code>c-&lt;tableId&gt;-&lt;attrId&gt;</code>).
            </li>
            <li>
              <strong>Detección automática de formato:</strong> viejo vs. nuevo.
            </li>
            <li>
              <strong>Anclaje de relaciones:</strong> las FKs se conectan a nivel de
              columna.
            </li>
          </ul>
      
          <h3 className="text-lg font-semibold mt-4">Stack y Herramientas</h3>
          <p>
            Erdus usa un stack moderno de TypeScript. El flujo de trabajo enfatiza la
            iteración rápida con Vite (HMR) y pruebas con Vitest para validar los
            algoritmos de conversión.
          </p>
      
          <h3 className="text-lg font-semibold mt-4">Casos de Uso e Integración</h3>
          <ul className="list-disc pl-6">
            <li>
              <strong>App web independiente:</strong> usar en{" "}
              <code>erdus-inky.vercel.app</code>
            </li>
            <li>
              <strong>Integración como librería:</strong> instalar{" "}
              <code>npm i erdplus-converter</code>
            </li>
            <li>
              <strong>Procesamiento en backend:</strong> conversión en PHP o Node.js
            </li>
            <li>
              <strong>Herramientas de base de datos:</strong> preprocesamiento para
              herramientas de gestión de esquemas
            </li>
          </ul>
      
          <h3 className="text-lg font-semibold mt-4">
            Limitaciones y Consideraciones Técnicas
          </h3>
          <ul className="list-disc pl-6">
            <li>Diferencias de ruteo visual (curvas vs. rectas en ERDPlus nuevo).</li>
            <li>
              IDs propietarios de herramientas no-ERDPlus no pueden preservarse (son
              invisibles).
            </li>
            <li>La conversión depende de la adherencia al spec de ERDPlus.</li>
          </ul>
          <p>
            Rendimiento: maneja archivos &lt; 10&nbsp;MB de forma eficiente; conversiones
            en milisegundos y uso mínimo de memoria.
          </p>
        </>
      ),
      

  "Resumen": (
    <>
      <h2 className="text-xl font-semibold mb-2">Resumen</h2>
      <p>
        Erdus es un conversor universal open-source de diagramas ER. Permite la
        migración entre formatos viejo/nuevo de ERDPlus, esquemas SQL, modelos
        Prisma y entidades TypeORM, preservando la integridad estructural.
      </p>

      <h3 className="text-lg font-semibold mt-4">Propósito y Alcance</h3>
      <p>
        Este documento ofrece una visión completa de Erdus, un conversor de
        formato ERDPlus que habilita conversiones bidireccionales sin pérdida
        entre los formatos viejo y nuevo. Cubre el propósito del sistema, sus
        principios de arquitectura, funcionalidades clave y la filosofía
        privacy-first.
      </p>
      <p>
        Para detalles de implementación de los algoritmos, ver{" "}
        <strong>Motor de Conversión</strong>. Para integrar en otros proyectos,
        ver <strong>Guía de Integración</strong>. Para el entorno de desarrollo
        y lineamientos de contribución, ver <strong>Guía de Desarrollo</strong>.
      </p>

      <h3 className="text-lg font-semibold mt-4">¿Qué es Erdus?</h3>
      <p>
        Erdus es una utilidad de transformación de datos diseñada para resolver
        un problema específico en flujos de diseño de bases: convertir entre
        los formatos viejo y nuevo de ERDPlus manteniendo la integridad
        estructural completa.
      </p>
      <p>El sistema funciona como:</p>
      <ul className="list-disc pl-6">
        <li>Aplicación web</li>
        <li>Librería reutilizable (<code>erdplus-converter</code>)</li>
      </ul>
      <p>Ofreciendo:</p>
      <ul className="list-disc pl-6">
        <li>Conversión sin pérdida entre formatos ERDPlus</li>
        <li>Soporte de claves foráneas compuestas</li>
        <li>100% procesamiento en el cliente (privacidad total)</li>
        <li>Generación determinística de IDs</li>
        <li>Validación de ida y vuelta (equivalencia estructural)</li>
      </ul>

      <h3 className="text-lg font-semibold mt-4">Visión de Arquitectura</h3>
      <p>
        La arquitectura separa responsabilidades en tres capas y prioriza
        privacidad por diseño: todo se procesa en el navegador sin componentes
        de servidor.
      </p>
      <p>
        El motor en <code>src/convert.ts</code> maneja la transformación;{" "}
        <code>src/app.ts</code> gestiona interacciones y archivos.
      </p>

      <h3 className="text-lg font-semibold mt-4">Proceso de Conversión</h3>
      <p>
        La conversión es bidireccional con algoritmos específicos. Se mantiene
        la integridad de claves compuestas agrupando columnas relacionadas con{" "}
        <code>foreignKeyGroupId</code> y preservando el orden mediante{" "}
        <code>fkSubIndex</code>.
      </p>

      <h3 className="text-lg font-semibold mt-4">Características y Garantías</h3>
      <ul className="list-disc pl-6">
        <li><strong>Privacy-First:</strong> todo corre en el navegador.</li>
        <li><strong>Offline:</strong> build estático sin red.</li>
        <li><strong>Conversión sin pérdida:</strong> equivalencia estructural.</li>
        <li><strong>FK compuestas:</strong> múltiples columnas.</li>
        <li><strong>IDs determinísticos:</strong> <code>c-&lt;tableId&gt;-&lt;attrId&gt;</code>.</li>
        <li><strong>Detección automática:</strong> viejo vs nuevo.</li>
        <li><strong>Anclaje de relaciones:</strong> unión a nivel de columna.</li>
      </ul>

      <h3 className="text-lg font-semibold mt-4">Stack y Herramientas</h3>
      <p>
        TypeScript + Vite (HMR) + Vitest para validar que las conversiones
        preserven la estructura.
      </p>

      <h3 className="text-lg font-semibold mt-4">Casos de Uso</h3>
      <ul className="list-disc pl-6">
        <li><strong>App Web:</strong> <code>erdus-inky.vercel.app</code></li>
        <li><strong>Integración como librería:</strong> <code>npm i erdplus-converter</code></li>
        <li><strong>Back-end:</strong> conversión en PHP/Node</li>
        <li><strong>Tooling de DB:</strong> preprocesamiento para gestión de esquemas</li>
      </ul>

      <h3 className="text-lg font-semibold mt-4">Limitaciones</h3>
      <ul className="list-disc pl-6">
        <li>Diferencias visuales de ruteo en ERDPlus nuevo.</li>
        <li>IDs propietarios de otras herramientas no se preservan.</li>
        <li>Depende de adherencia al spec de ERDPlus.</li>
      </ul>
      <p>Rendimiento: &lt;10 MB con latencia de ms y bajo uso de memoria.</p>
    </>
  ),

  "Getting Started": (
    <>
      <h2 className="text-xl font-semibold mb-2">Primeros Pasos</h2>
      <p>
        Esta página ofrece una guía de inicio rápido para usar de inmediato la
        aplicación web de Erdus y convertir tus archivos ERDPlus entre los
        formatos viejo y nuevo. Cubre cómo acceder a la app, realizar
        conversiones y entender los archivos generados.
      </p>
      <p>
        Para integrarlo en otros proyectos, consultá la{" "}
        <strong>Guía de Integración</strong>. Para preparar un entorno local de
        desarrollo, ver <strong>Configuración del Entorno de Desarrollo</strong>.
      </p>

      <h3 className="text-lg font-semibold mt-4">Acceso a la Aplicación Web</h3>
      <p>
        Erdus está disponible como una aplicación web que corre íntegramente en
        tu navegador, garantizando privacidad total: tus archivos nunca se
        suben a ningún servidor.
      </p>

      <h4 className="font-semibold mt-3">Aplicación en Producción</h4>
      <p>
        La versión de producción está disponible en:{" "}
        <a href="https://erdus-inky.vercel.app" className="text-[#1280ff]">
          https://erdus-inky.vercel.app
        </a>
      </p>

      <h4 className="font-semibold mt-3">Versión de Desarrollo Local</h4>
      <pre>
        <code>
{`git clone https://github.com/tobiager/Erdus.git
cd Erdus
pnpm install
pnpm dev`}
        </code>
      </pre>
      <p>Luego abrí http://localhost:5173 en tu navegador.</p>

      <h3 className="text-lg font-semibold mt-4">Componentes de la Interfaz</h3>
      <table className="table-auto border-collapse border border-slate-500 text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Componente</th>
            <th className="border px-2 py-1">Propósito</th>
            <th className="border px-2 py-1">Ubicación en el código</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-2 py-1">Zona Drag & Drop</td>
            <td className="border px-2 py-1">Método principal de ingreso</td>
            <td className="border px-2 py-1">index.html:94</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">Botón de Archivo</td>
            <td className="border px-2 py-1">Selección alternativa</td>
            <td className="border px-2 py-1">index.html:96</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">Botón Convertir</td>
            <td className="border px-2 py-1">Dispara la conversión</td>
            <td className="border px-2 py-1">index.html:97</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">Panel de Log</td>
            <td className="border px-2 py-1">Muestra estado/resultados</td>
            <td className="border px-2 py-1">index.html:100</td>
          </tr>
        </tbody>
      </table>

      <h3 className="text-lg font-semibold mt-4">Flujo de Conversión</h3>
      <p>
        El proceso sigue un flujo simple de arrastrar y soltar, con detección
        automática de formato y generación de archivo.
      </p>
      <ol className="list-decimal pl-6">
        <li>
          <strong>Entrada:</strong> Arrastrá tu archivo .erdplus o .json a la
          dropzone, o hacé clic para seleccionarlo.
        </li>
        <li>
          <strong>Detección:</strong> El sistema identifica automáticamente
          formato viejo vs. nuevo de ERDPlus.
        </li>
        <li>
          <strong>Conversión:</strong> Hacé clic en el botón <em>Convertir</em>.
        </li>
        <li>
          <strong>Descarga:</strong> Se descarga el archivo convertido con el
          sufijo correspondiente.
        </li>
      </ol>

      <h4 className="font-semibold mt-3">Formatos de Entrada Soportados</h4>
      <table className="table-auto border-collapse border border-slate-500 text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Formato</th>
            <th className="border px-2 py-1">Extensiones</th>
            <th className="border px-2 py-1">Método de detección</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-2 py-1">ERDPlus Viejo</td>
            <td className="border px-2 py-1">.erdplus, .json</td>
            <td className="border px-2 py-1">
              Presencia de <code>shapes[]</code> y <code>connectors[]</code>
            </td>
          </tr>
          <tr>
            <td className="border px-2 py-1">ERDPlus Nuevo</td>
            <td className="border px-2 py-1">.erdplus, .json</td>
            <td className="border px-2 py-1">
              Presencia de <code>nodes</code> y <code>edges</code>
            </td>
          </tr>
        </tbody>
      </table>

      <h3 className="text-lg font-semibold mt-4">Entendiendo la Salida</h3>
      <p>
        El sistema genera archivos con nombres predecibles y preserva todas las
        relaciones estructurales.
      </p>
      <h4 className="font-semibold mt-3">Garantías de Conversión</h4>
      <ul className="list-disc pl-6">
        <li>Integridad estructural: tablas, columnas y relaciones.</li>
        <li>Claves primarias: restricciones y orden preservados.</li>
        <li>Claves foráneas: simples y compuestas.</li>
        <li>Disposición visual: posiciones y tamaños de tablas.</li>
        <li>Tipos de datos: tipos, nulos y únicos preservados.</li>
      </ul>

      <h4 className="font-semibold mt-3">Detalles por Dirección</h4>
      <p>
        <strong>Viejo → Nuevo:</strong> <code>shapes[]</code> → <code>nodes</code>, IDs estables, <em>edges</em> agrupados
        <br />
        <strong>Nuevo → Viejo:</strong> <code>nodes/edges</code> → tablas/atributos con FKs correctas
      </p>

      <h3 className="text-lg font-semibold mt-4">Solución de Problemas</h3>
      <ul className="list-disc pl-6">
        <li>
          <strong>No convierte:</strong> verificá que el .erdplus/.json sea válido.
        </li>
        <li>
          <strong>Diferencias visuales:</strong> ERDPlus puede rutear líneas de
          otra manera; la estructura es correcta.
        </li>
        <li>
          <strong>No descarga:</strong> revisá bloqueadores de popups/descargas.
        </li>
      </ul>

      <h3 className="text-lg font-semibold mt-4">Privacidad y Seguridad</h3>
      <ul className="list-disc pl-6">
        <li>Todo el procesamiento ocurre localmente en el navegador.</li>
        <li>No se suben archivos a ningún servidor.</li>
        <li>Funciona offline luego de la primera carga.</li>
        <li>Tus diagramas ERDPlus no salen de tu dispositivo.</li>
      </ul>
    </>
  ),

  "System Architecture": (
    <>
      <h2 className="text-xl font-semibold mb-2">Arquitectura del Sistema</h2>
      <p>
        Este documento brinda una visión técnica completa de la arquitectura
        interna de Erdus: algoritmos de conversión, estructuras de datos e
        implementación de frontend. Para funcionalidad de usuario ver{" "}
        <strong>Primeros Pasos</strong>. Para especificaciones de conversión ver{" "}
        <strong>Motor de Conversión</strong> y{" "}
        <strong>Especificaciones de Datos</strong>. Para detalles de frontend,{" "}
        <strong>Interfaz Web</strong>.
      </p>

      <h3 className="text-lg font-semibold mt-4">Visión Arquitectónica</h3>
      <p>
        Erdus implementa una arquitectura cliente, privacy-first, para conversión
        bidireccional sin pérdida entre formatos viejo y nuevo de ERDPlus. Todo
        se procesa localmente sin componentes de servidor.
      </p>

      <h3 className="text-lg font-semibold mt-4">Principios Clave</h3>
      <table className="table-auto border-collapse border border-slate-500 text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Principio</th>
            <th className="border px-2 py-1">Implementación</th>
            <th className="border px-2 py-1">Referencia</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-2 py-1">Privacidad por Diseño</td>
            <td className="border px-2 py-1">100% procesamiento en cliente</td>
            <td className="border px-2 py-1">index.html, README.md</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">Conversión sin Pérdida</td>
            <td className="border px-2 py-1">
              IDs determinísticos + validación de ida y vuelta
            </td>
            <td className="border px-2 py-1">src/convert.ts</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">Agnóstico de Formato</td>
            <td className="border px-2 py-1">Detección automática</td>
            <td className="border px-2 py-1">src/convert.ts</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">Integridad Estructural</td>
            <td className="border px-2 py-1">
              Preserva relaciones, posiciones y constraints
            </td>
            <td className="border px-2 py-1">src/convert.ts</td>
          </tr>
        </tbody>
      </table>

      <h3 className="text-lg font-semibold mt-4">Arquitectura del Motor</h3>
      <p>
        Flujo bidireccional: ERDPlus viejo → IR → nuevo, y ERDPlus nuevo → IR → viejo.
        Todas las transformaciones pasan por la{" "}
        <strong>Representación Intermedia (IR)</strong>, garantizando consistencia y
        validación en cada paso.
      </p>

      <h3 className="text-lg font-semibold mt-4">Estrategia de IDs</h3>
      <p>Generación determinística para resultados consistentes:</p>
      <ul className="list-disc pl-6">
        <li><code>t-&lt;id&gt;</code> para tablas</li>
        <li><code>c-&lt;tableId&gt;-&lt;attrId&gt;</code> para columnas</li>
        <li><code>fkSubIndex</code> para orden de FKs</li>
      </ul>

      <h3 className="text-lg font-semibold mt-4">Interacción de Componentes</h3>
      <p>
        El frontend (<code>src/app.ts</code>) provee la UI y delega el
        procesamiento a <code>src/convert.ts</code>, separando interfaz y motor.
      </p>

      <h3 className="text-lg font-semibold mt-4">Mapeo de Estructuras</h3>
      <table className="table-auto border-collapse border border-slate-500 text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Formato Viejo</th>
            <th className="border px-2 py-1">Formato Nuevo</th>
            <th className="border px-2 py-1">Función</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-2 py-1">shapes[] tipo 'Table'</td>
            <td className="border px-2 py-1">nodes[] tipo 'Table'</td>
            <td className="border px-2 py-1">src/convert.ts:42-62</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">OldAttr[] en attributes</td>
            <td className="border px-2 py-1">NewCol[] en columns</td>
            <td className="border px-2 py-1">src/convert.ts:44-52</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">connectors[] TableConnector</td>
            <td className="border px-2 py-1">edges[] tipo Relational</td>
            <td className="border px-2 py-1">src/convert.ts:124-152</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">Orden fkSubIndex</td>
            <td className="border px-2 py-1">Agrupado por foreignKeyGroupId</td>
            <td className="border px-2 py-1">src/convert.ts:126-129</td>
          </tr>
        </tbody>
      </table>

      <h3 className="text-lg font-semibold mt-4">Build y Desarrollo</h3>
      <p>
        Vite + TypeScript como sistema de build (<code>vite.config.ts</code>,{" "}
        <code>tsconfig.json</code>). Se prioriza iteración rápida (HMR) y tipado
        fuerte con dependencias mínimas.
      </p>

      <h3 className="text-lg font-semibold mt-4">Dependencias en Runtime</h3>
      <p>Diseño con dependencias mínimas para carga rápida y modo offline.</p>
      <table className="table-auto border-collapse border border-slate-500 text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Componente</th>
            <th className="border px-2 py-1">Dependencias</th>
            <th className="border px-2 py-1">Propósito</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-2 py-1">Frontend</td>
            <td className="border px-2 py-1">Sin librerías externas</td>
            <td className="border px-2 py-1">Manipulación directa del DOM</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">Sistema de tipos</td>
            <td className="border px-2 py-1">Tipos nativos de TypeScript</td>
            <td className="border px-2 py-1">Chequeo estático</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">Build</td>
            <td className="border px-2 py-1">Vite, TypeScript</td>
            <td className="border px-2 py-1">Dev & producción</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">Lógica de conversión</td>
            <td className="border px-2 py-1">JavaScript puro</td>
            <td className="border px-2 py-1">Sin dependencias</td>
          </tr>
        </tbody>
      </table>

      <h3 className="text-lg font-semibold mt-4">Privacidad de Datos</h3>
      <ul className="list-disc pl-6">
        <li><strong>Procesamiento local:</strong> en <code>src/convert.ts</code>.</li>
        <li><strong>Sin solicitudes de red:</strong> solo archivos estáticos.</li>
        <li><strong>Modo offline:</strong> operativo tras la primera carga.</li>
        <li><strong>Memoria:</strong> uso temporal, sin almacenamiento persistente.</li>
      </ul>
    </>
  ),

  "Conversion Engine": (
    <>
      <h2 className="text-xl font-semibold mb-2">Motor de Conversión</h2>
      <p>
        El motor realiza transformaciones determinísticas y bidireccionales entre
        los formatos viejo y nuevo de ERDPlus. Todo pasa por una representación
        intermedia (IR) compartida, preservando la integridad estructural y
        habilitando validación de ida y vuelta.
      </p>

      <h3 className="text-lg font-semibold mt-4">Flujo de Procesamiento</h3>
      <ol className="list-decimal pl-6">
        <li>Detectar el formato de entrada (viejo o nuevo).</li>
        <li>Parsear a la representación intermedia.</li>
        <li>Validar elementos y relaciones estructurales.</li>
        <li>Generar el formato objetivo con IDs estables y FKs agrupadas.</li>
      </ol>

      <h3 className="text-lg font-semibold mt-4">IDs Determinísticos</h3>
      <p>
        Los IDs se calculan a partir de índices de tablas y atributos, garantizando
        resultados predecibles y comparaciones precisas.
      </p>

      <h3 className="text-lg font-semibold mt-4">Validación Round-Trip</h3>
      <p>
        Tras convertir, el motor vuelve a convertir la salida al formato fuente y
        compara estructuras para asegurar transformación sin pérdida.
      </p>
    </>
  ),

  "Data Format Specifications": (
    <>
      <h2 className="text-xl font-semibold mb-2">Especificaciones de Datos</h2>
      <p>
        Esta sección documenta la estructura de los formatos viejo y nuevo de
        ERDPlus y la representación intermedia utilizada durante la conversión.
      </p>

      <h3 className="text-lg font-semibold mt-4">Formato ERDPlus Viejo</h3>
      <ul className="list-disc pl-6">
        <li>
          <strong>shapes[]:</strong> Tablas con atributos y metadatos de layout.
        </li>
        <li>
          <strong>connectors[]:</strong> Relaciones entre atributos de tablas.
        </li>
        <li>
          <strong>attributes[]:</strong> Definiciones de columnas con flags PK/FK.
        </li>
      </ul>

      <h3 className="text-lg font-semibold mt-4">Formato ERDPlus Nuevo</h3>
      <ul className="list-disc pl-6">
        <li><strong>nodes[]:</strong> Tablas y relaciones con posición.</li>
        <li>
          <strong>edges[]:</strong> Claves foráneas que enlazan columnas vía{" "}
          <code>foreignKeyGroupId</code>.
        </li>
        <li><strong>columns[]:</strong> Metadatos de columnas, tipos y constraints.</li>
      </ul>

      <h3 className="text-lg font-semibold mt-4">Representación Intermedia</h3>
      <p>
        La IR normaliza tablas, columnas y FKs en estructuras explícitas,
        permitiendo consistencia entre formatos y validación cruzada.
      </p>
    </>
  ),

  "Web Interface": (
    <>
      <h2 className="text-xl font-semibold mb-2">Interfaz Web</h2>
      <p>
        La interfaz ofrece una experiencia de arrastrar y soltar para convertir
        diagramas ERDPlus. Todo el procesamiento ocurre localmente en el navegador.
      </p>

      <h3 className="text-lg font-semibold mt-4">Componentes de UI</h3>
      <ul className="list-disc pl-6">
        <li><strong>Dropzone:</strong> Selección de archivo y eventos de drag.</li>
        <li><strong>Botón Convertir:</strong> Dispara el motor de conversión.</li>
        <li><strong>Salida de Log:</strong> Estado y resultado de validaciones.</li>
      </ul>

      <h3 className="text-lg font-semibold mt-4">Flujo de Eventos</h3>
      <ol className="list-decimal pl-6">
        <li>Carga y parseo del archivo al soltarlo.</li>
        <li>Detección de formato y ejecución de la conversión.</li>
        <li>Generación y descarga automática del archivo de salida.</li>
      </ol>
    </>
  ),

  "Integration Guide": (
    <>
      <h2 className="text-xl font-semibold mb-2">Guía de Integración</h2>
      <p>
        Erdus puede usarse como aplicación web independiente o integrarse como
        librería en otros proyectos.
      </p>

      <h3 className="text-lg font-semibold mt-4">Instalación de la Librería</h3>
      <pre>
        <code>npm i erdplus-converter</code>
      </pre>

      <h3 className="text-lg font-semibold mt-4">Uso Básico</h3>
      <pre>
        <code>
{`import { convert } from "erdplus-converter";
const output = convert(inputFileBuffer);`}
        </code>
      </pre>

      <h3 className="text-lg font-semibold mt-4">Uso en Servidor</h3>
      <p>
        La librería es agnóstica al entorno y puede ejecutarse en Node.js o
        navegador para pipelines automatizados de conversión.
      </p>
    </>
  ),

  "Development Guide": (
    <>
      <h2 className="text-xl font-semibold mb-2">Guía de Desarrollo</h2>
      <p>
        Esta sección cubre la configuración de desarrollo, estructura del
        proyecto y flujo de contribución de Erdus.
      </p>

      <h3 className="text-lg font-semibold mt-4">Setup del Proyecto</h3>
      <pre>
        <code>
{`git clone https://github.com/tobiager/Erdus.git
cd Erdus
pnpm install`}
        </code>
      </pre>

      <h3 className="text-lg font-semibold mt-4">Ejecución en Desarrollo</h3>
      <pre>
        <code>pnpm dev</code>
      </pre>
      <p>Abrí http://localhost:5173 para ver la app.</p>

      <h3 className="text-lg font-semibold mt-4">Testing</h3>
      <pre>
        <code>pnpm test</code>
      </pre>
      <p>
        Vitest verifica que los algoritmos mantengan la equivalencia estructural.
      </p>

      <h3 className="text-lg font-semibold mt-4">Flujo de Contribución</h3>
      <ul className="list-disc pl-6">
        <li>Hacés fork y trabajás en ramas de feature.</li>
        <li>Corré tests antes de abrir el PR.</li>
        <li>Mensajes de commit convencionales y claros.</li>
      </ul>
    </>
  ),

  Contributing: (
    <>
      <h2 className="text-xl font-semibold mb-2">Contribuir</h2>
      <p>
        Erdus crece con la comunidad. Se agradecen contribuciones de cualquier
        tamaño: fixes, features, documentación o traducciones. Esta sección
        resume expectativas para mantener un entorno colaborativo y de calidad.
      </p>
      <h3 className="text-lg font-semibold mt-4">Guías de Comunidad</h3>
      <ul className="list-disc pl-6">
        <li>Comunicación respetuosa y feedback constructivo.</li>
        <li>Adherencia a estándares de código y cobertura de tests.</li>
        <li>
          Commits claros siguiendo <em>Conventional Commits</em>.
        </li>
        <li>
          Alineación con la filosofía privacy-first del proyecto.
        </li>
      </ul>
      <p className="mt-4">
        Antes de empezar, revisá issues y PRs abiertos para evitar duplicar. En
        caso de duda, abrí una discusión o un borrador para feedback temprano.
      </p>
    </>
  ),

  "How to Contribute": (
    <>
      <h2 className="text-xl font-semibold mb-2">Cómo Contribuir</h2>
      <p>
        ¿Listo para contribuir? Seguí estos pasos para un proceso fluido desde el
        desarrollo hasta el pull request.
      </p>
      <ol className="list-decimal pl-6 mt-4">
        <li>
          <strong>Fork y Clone:</strong> hacé fork en GitHub y cloná tu fork.
        </li>
        <li>
          <strong>Instalar dependencias:</strong> ejecutá <code>pnpm install</code>.
        </li>
        <li>
          <strong>Crear rama de feature:</strong> desde <code>main</code> con un
          nombre descriptivo (p. ej. <code>feat/add-export-option</code>).
        </li>
        <li>
          <strong>Implementar cambios:</strong> respetando patrones y estilo de docs.
        </li>
        <li>
          <strong>Ejecutar tests:</strong> <code>pnpm test</code>.
        </li>
        <li>
          <strong>Commits:</strong> mensajes significativos (ej.
          <code>feat: add export option</code>).
        </li>
        <li>
          <strong>Abrir PR:</strong> contra <code>main</code> con descripción,
          motivo y issues relacionadas.
        </li>
      </ol>
      <p className="mt-4">
        Los PRs son revisados por mantenedores y contribuidores. Preparáte para
        incorporar feedback.
      </p>
    </>
  ),

  "Reporting Issues": (
    <>
      <h2 className="text-xl font-semibold mb-2">Reportar Problemas</h2>
      <p>
        Si encontrás un bug, tenés problemas con una conversión o querés proponer
        una nueva función, abrir un issue ayuda a mejorar Erdus. Los reportes
        claros aceleran el triage y la resolución.
      </p>
      <h3 className="text-lg font-semibold mt-4">Cómo Reportar Bugs</h3>
      <ul className="list-disc pl-6">
        <li>
          <strong>Issue Tracker:</strong> en GitHub, clic en <em>New Issue</em>.
        </li>
        <li>
          <strong>Detalles:</strong> describí problema, comportamiento esperado y real.
        </li>
        <li>
          <strong>Reproducción:</strong> ejemplo mínimo (idealmente el archivo ERDPlus).
        </li>
        <li>
          <strong>Entorno:</strong> navegador, SO y versiones relevantes.
        </li>
        <li>
          <strong>Logs/Capturas:</strong> si aplica, agregá evidencia.
        </li>
      </ul>
      <h3 className="text-lg font-semibold mt-4">Pedir Funcionalidades</h3>
      <p>
        Describí el problema que resuelve y posibles enfoques. Facilita discusión
        y priorización para futuras versiones.
      </p>
    </>
  ),

  "Release Process": (
    <>
      <h2 className="text-xl font-semibold mb-2">Proceso de Lanzamiento</h2>
      <p>
        El proceso de release asegura que cada versión de Erdus sea estable,
        verificable y documentada. Solo los maintainers publican, pero es útil
        conocer el flujo.
      </p>
      <ol className="list-decimal pl-6 mt-4">
        <li>
          <strong>Cerrar issues:</strong> mergear PRs objetivo y pasar tests.
        </li>
        <li>
          <strong>Versionado y changelog:</strong> subir semver en{" "}
          <code>package.json</code> y actualizar <code>CHANGELOG.md</code>.
        </li>
        <li>
          <strong>Build:</strong> <code>pnpm build</code> para artefactos optimizados.
        </li>
        <li>
          <strong>Tag y publicación:</strong> crear tag (p. ej.{" "}
          <code>v1.2.0</code>) y pushearlo; publicar en npm si corresponde.
        </li>
        <li>
          <strong>Deploy web:</strong> desplegar (p. ej., Vercel) y verificar que esté online.
        </li>
        <li>
          <strong>Anuncio:</strong> crear release en GitHub con notas y highlights.
        </li>
      </ol>
      <p className="mt-4">
        Estos pasos garantizan releases confiables y brindan a usuarios un camino
        de actualización claro.
      </p>
    </>
  ),
};
