import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      nav: {
        home: 'Home',
        converter: 'Converter',
        documentation: 'Documentation',
        docs: 'Docs',
      },
      home: {
        welcome: 'Welcome to',
        tagline:
          'Convert ERDPlus diagrams, SQL schemas, Prisma models, and TypeORM entities seamlessly.',
        convertNow: 'Convert now',
        starOnGitHub: 'Star on GitHub',
      },
      dropzone: {
        label: 'Input file',
        hint: 'You can also paste a file (Ctrl/Cmd + V).',
        aria: 'Dropzone: drag & drop your file or click',
        selected: 'Selected:',
        dragDrop: 'Drag & drop your file',
        clickBrowse: 'or click to browse',
      },
      converter: {
        title: 'Converter',
        status: {
          processing: '● Processing…',
          done: '● Done',
          error: '● Error',
          idle: '● Idle',
        },
        actions: {
          convertFile: 'Convert a file',
          instruction: 'Drag & drop an ERDPlus JSON, SQL, Prisma, or TypeORM file, then choose the output format.',
          outputFormat: 'Output format',
          convert: 'Convert',
          copy: 'Copy',
          download: 'Download',
        },
        help: {
          title: 'How it works',
          list: {
            item1: 'Auto-detects ERDPlus (old/new), SQL, Prisma, or TypeORM inputs.',
            item2: 'Keeps entity positions/order, PKs and simple FKs.',
            item3: 'Converts to ERDPlus (old/new), PostgreSQL SQL, Prisma, or TypeORM.',
            item4: 'Outputs appear below; ERDPlus JSON downloads automatically.',
            privacyLabel: 'Privacy:',
            privacyText: 'everything runs locally in your browser.',
          },
        },
        terminal: 'Terminal',
        output: 'Output',
        notes: 'Notes',
        targets: {
          sql: 'SQL (PostgreSQL)',
          prisma: 'Prisma schema',
          typeorm: 'TypeORM entities',
          new: 'ERDPlus (new)',
          old: 'ERDPlus (old)',
        },
        log: {
          ready: 'Ready to convert...',
          reading: 'Reading "{{file}}"...',
          detected: 'Detected input: {{fmt}}',
          target: 'Target: {{tgt}}',
          generatedSQL: 'Generated PostgreSQL DDL.',
          generatedPrisma: 'Generated Prisma schema.',
          generatedTypeorm: 'Generated TypeORM entities.',
          downloaded: 'Downloaded {{name}}',
          error: 'Error: {{error}}',
          chooseFile: 'Choose a file first.',
          nothingToCopy: 'Nothing to copy.',
          copied: 'Copied to clipboard.',
          nothingToDownload: 'Nothing to download.',
          downloadedAs: 'Downloaded as {{name}}.',
        },
        loss: {
          none: 'No losses detected.',
          connectorsIgnored: '{{count}} connectors ignored',
          nonRelationalEdgesIgnored: '{{count}} non-relational edges ignored',
          commentsIgnored: 'Comments and non-table statements are ignored',
          typeormIgnored: 'Unsupported TypeORM features were ignored',
          prismaIgnored: 'Unsupported Prisma features were ignored',
        },
        errors: {
          unsupported: 'Unsupported input format',
        },
      },
    },
  },
  es: {
    translation: {
      nav: {
        home: 'Inicio',
        converter: 'Convertidor',
        documentation: 'Documentación',
        docs: 'Docs',
      },
      home: {
        welcome: 'Bienvenido a',
        tagline:
          'Convierte diagramas ERDPlus, esquemas SQL, modelos de Prisma y entidades de TypeORM sin esfuerzo.',
        convertNow: 'Convertir ahora',
        starOnGitHub: 'Dar estrella en GitHub',
      },
      dropzone: {
        label: 'Archivo de entrada',
        hint: 'También puedes pegar un archivo (Ctrl/Cmd + V).',
        aria: 'Zona de carga: arrastra y suelta tu archivo o haz clic',
        selected: 'Seleccionado:',
        dragDrop: 'Arrastra y suelta tu archivo',
        clickBrowse: 'o haz clic para buscar',
      },
      converter: {
        title: 'Convertidor',
        status: {
          processing: '● Procesando…',
          done: '● Listo',
          error: '● Error',
          idle: '● Inactivo',
        },
        actions: {
          convertFile: 'Convertir un archivo',
          instruction: 'Arrastra y suelta un archivo ERDPlus JSON, SQL, Prisma o TypeORM, luego elige el formato de salida.',
          outputFormat: 'Formato de salida',
          convert: 'Convertir',
          copy: 'Copiar',
          download: 'Descargar',
        },
        help: {
          title: 'Cómo funciona',
          list: {
            item1: 'Detecta automáticamente entradas ERDPlus (old/new), SQL, Prisma o TypeORM.',
            item2: 'Mantiene posiciones/orden de entidades, PKs y FKs simples.',
            item3: 'Convierte a ERDPlus (old/new), SQL de PostgreSQL, Prisma o TypeORM.',
            item4: 'Las salidas aparecen abajo; ERDPlus JSON se descarga automáticamente.',
            privacyLabel: 'Privacidad:',
            privacyText: 'todo se ejecuta localmente en tu navegador.',
          },
        },
        terminal: 'Terminal',
        output: 'Salida',
        notes: 'Notas',
        targets: {
          sql: 'SQL (PostgreSQL)',
          prisma: 'Esquema Prisma',
          typeorm: 'Entidades TypeORM',
          new: 'ERDPlus (nuevo)',
          old: 'ERDPlus (antiguo)',
        },
        log: {
          ready: 'Listo para convertir...',
          reading: 'Leyendo "{{file}}"...',
          detected: 'Entrada detectada: {{fmt}}',
          target: 'Objetivo: {{tgt}}',
          generatedSQL: 'SQL de PostgreSQL generada.',
          generatedPrisma: 'Esquema de Prisma generado.',
          generatedTypeorm: 'Entidades de TypeORM generadas.',
          downloaded: '{{name}} descargado',
          error: 'Error: {{error}}',
          chooseFile: 'Elige un archivo primero.',
          nothingToCopy: 'Nada para copiar.',
          copied: 'Copiado al portapapeles.',
          nothingToDownload: 'Nada para descargar.',
          downloadedAs: 'Descargado como {{name}}.',
        },
        loss: {
          none: 'No se detectaron pérdidas.',
          connectorsIgnored: '{{count}} conectores ignorados',
          nonRelationalEdgesIgnored: '{{count}} aristas no relacionales ignoradas',
          commentsIgnored: 'Se ignoran comentarios y sentencias que no son tablas',
          typeormIgnored: 'Se ignoraron características no soportadas de TypeORM',
          prismaIgnored: 'Se ignoraron características no soportadas de Prisma',
        },
        errors: {
          unsupported: 'Formato de entrada no soportado',
        },
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
