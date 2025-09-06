import { useTranslation } from "react-i18next";

export default function LanguageToggleCompact() {
  const { i18n } = useTranslation();
  const isEs = i18n.language?.toLowerCase().startsWith("es");

  return (
    <button
      type="button"
      aria-label="Change language"
      onClick={() => i18n.changeLanguage(isEs ? "en" : "es")}
      className="
        inline-flex items-center justify-center
        h-9 w-9 rounded-full text-[11px] font-semibold
        text-[#1280ff]
        hover:bg-slate-200/40 dark:hover:bg-white/5
        transition
      "
    >
      {isEs ? "ES" : "EN"}
    </button>
  );
}
