// src/hooks/useTheme.ts
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

const getSystemTheme = (): Theme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const applyTheme = (t: Theme) => {
  const root = document.documentElement;
  const isDark = t === "dark";

  root.classList.toggle("dark", isDark); // Tailwind dark mode (class)
  root.dataset.theme = isDark ? "dark" : "light"; // opcional p/ lib de UI
};

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return saved ?? getSystemTheme();
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return { theme, setTheme } as const;
}
