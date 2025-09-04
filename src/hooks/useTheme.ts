// src/hooks/useTheme.ts
import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme";

const applyTheme = (t: Theme) => {
  const root = document.documentElement;
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = t === "dark" || (t === "system" && systemDark);

  root.classList.toggle("dark", isDark);      // Tailwind dark mode (class)
  root.dataset.theme = isDark ? "dark" : "light"; // opcional p/ lib de UI
};

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Theme) || "system";
    return saved;
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // re-aplicar cuando cambie el sistema si estamos en "system"
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const saved = (localStorage.getItem(STORAGE_KEY) as Theme) || "system";
      if (saved === "system") applyTheme("system");
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return { theme, setTheme } as const;
}
