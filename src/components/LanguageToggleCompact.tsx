import { useTranslation } from "react-i18next";
import clsx from "clsx";

type Props = { className?: string };

export default function LanguageToggleCompact({ className }: Props) {
  const { i18n } = useTranslation();
  const isEs = i18n.language?.toLowerCase().startsWith("es");

  return (
    <button
      type="button"
      aria-label="Change language"
      onClick={() => i18n.changeLanguage(isEs ? "en" : "es")}
      className={clsx(
        "inline-flex items-center justify-center rounded-full",
        "text-[11px] font-semibold text-[#1280ff]",
        // ⬇️ anulamos foco/ring internos (el halo lo pone el wrapper)
        "focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none",
        className
      )}
    >
      {isEs ? "ES" : "EN"}
    </button>
  );
}
