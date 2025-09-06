import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { sectionsEn } from "../docs/en";
import { sectionsEs } from "../docs/es";

// 0) Tipo fuerte para las claves de sección
type SectionKey = keyof typeof sectionsEn;

// 1) Mapa de etiquetas, tipado con SectionKey
const LABELS: Record<"en" | "es", Record<SectionKey, string>> = {
  en: {
    Overview: "Overview",
    "Getting Started": "Getting Started",
    "System Architecture": "System Architecture",
    "Conversion Engine": "Conversion Engine",
    "Data Format Specifications": "Data Format Specifications",
    "Web Interface": "Web Interface",
    "Integration Guide": "Integration Guide",
    "Development Guide": "Development Guide",
    Contributing: "Contributing",
    "How to Contribute": "How to Contribute",
    "Reporting Issues": "Reporting Issues",
    "Release Process": "Release Process",
  },
  es: {
    Overview: "Resumen",
    "Getting Started": "Primeros Pasos",
    "System Architecture": "Arquitectura del Sistema",
    "Conversion Engine": "Motor de Conversión",
    "Data Format Specifications": "Especificaciones de Datos",
    "Web Interface": "Interfaz Web",
    "Integration Guide": "Guía de Integración",
    "Development Guide": "Guía de Desarrollo",
    Contributing: "Contribuir",
    "How to Contribute": "Cómo Contribuir",
    "Reporting Issues": "Reportar Problemas",
    "Release Process": "Proceso de Lanzamiento",
  },
} as const;

export default function Documentation() {
  const { i18n } = useTranslation();
  const lang: "en" | "es" = i18n.language.startsWith("es") ? "es" : "en";

  // 2) Secciones por idioma, asegurando el tipo por clave
  const sections = useMemo<Record<SectionKey, React.ReactNode>>(
    () => (lang === "es" ? sectionsEs : sectionsEn) as Record<SectionKey, React.ReactNode>,
    [lang]
  );

  // 3) Estado activo con claves fuertes
  const [active, setActive] = useState<SectionKey>("Overview");

  // 4) Lista de claves ordenadas y tipadas
  const keys = useMemo(() => Object.keys(sectionsEn) as SectionKey[], []);

  // 5) Etiquetas visibles según idioma (tipadas)
  const labels: Record<SectionKey, string> = LABELS[lang];

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      {/* MOBILE TABS (xs-sm) */}
      <div
        className="
          md:hidden -mx-4 px-4 mb-4
          flex gap-2 overflow-x-auto whitespace-nowrap
          [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden
        "
      >
        {keys.map((k: SectionKey) => {
          const isActive = active === k;
          const activeCls = isActive
            ? "bg-blue-100 text-blue-700 border-blue-300 dark:bg-[#1280ff]/15 dark:text-[#1280ff] dark:border-[#1280ff]"
            : "text-slate-700 border-slate-200 hover:text-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:text-white";
          return (
            <button
              key={k}
              onClick={() => setActive(k)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1280ff]/40 ${activeCls}`}
            >
              {labels[k]}
            </button>
          );
        })}
      </div>

      <div className="md:flex md:gap-6">
        {/* SIDEBAR (md+) */}
        <aside className="hidden md:block md:w-64 shrink-0">
          <div className="sticky top-20 border-r border-slate-200 dark:border-slate-700 pr-4">
            <nav className="space-y-1">
              {keys.map((k: SectionKey) => {
                const isActive = active === k;
                const activeCls = isActive
                  ? "bg-blue-100 text-blue-700 font-semibold dark:bg-[#1280ff]/10 dark:text-[#1280ff]"
                  : "text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white";
                return (
                  <button
                    key={k}
                    onClick={() => setActive(k)}
                    className={`block w-full text-left px-2 py-1.5 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1280ff]/40 ${activeCls}`}
                  >
                    {labels[k]}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* CONTENT */}
        <main className="min-w-0 flex-1 md:p-2">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="space-y-6">
              <div className="overflow-x-auto">{sections[active]}</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
