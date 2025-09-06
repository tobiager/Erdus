import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const lang = i18n.language.startsWith("es") ? "es" : "en";

  const items = useMemo(
    () => ([
      { id: "en", label: "EN" },
      { id: "es", label: "ES" },
    ] as const),
    []
  );

  const onSelect = (id: "en" | "es") => {
    if (lang !== id) {
      i18n.changeLanguage(id);
      localStorage.setItem("i18nextLng", id); // 👈 guarda la preferencia
    }
  };

  const selectedIndex = items.findIndex((x) => x.id === lang);

  return (
    <div
      role="tablist"
      aria-label="Language selector"
      className="
        relative h-8 sm:h-9 w-[90px] sm:w-24
        rounded-full border border-slate-200 dark:border-slate-700
        bg-white/60 dark:bg-slate-900/40
        backdrop-blur-md
        text-[13px] sm:text-sm
        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35)]
        overflow-hidden
      "
    >
      {/* highlight animado */}
      <motion.span
        aria-hidden
        className="absolute top-0 bottom-0 rounded-full bg-[#1280ff]/15 border border-[#1280ff]/30"
        initial={false}
        animate={{ left: `${selectedIndex * 50}%`, width: "50%" }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />

      <div className="grid grid-cols-2 h-full relative z-10">
        {items.map((item) => {
          const isActive = item.id === lang;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(item.id)}
              className={[
                "flex items-center justify-center font-medium transition-colors",
                isActive
                  ? "text-[#1280ff]"
                  : "text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1280ff]/40 rounded-full",
              ].join(" ")}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
