import { useState, useRef, useEffect } from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

export default function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  const select = (value: "light" | "dark" | "system") => {
    setTheme(value);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="Theme"
        onClick={() => setOpen((o) => !o)}
        className="
          relative rounded-full p-2 text-[#1280ff] transition
          hover:bg-slate-200/60 dark:hover:bg-white/5
          hover:ring-2 hover:ring-[#1280ff]/50

          before:absolute before:inset-0 before:rounded-full
          before:bg-[radial-gradient(60%_60%_at_50%_50%,rgba(18,128,255,0.28),transparent_70%)]
          before:opacity-0 hover:before:opacity-100 before:transition
        "
      >
        <Moon size={18} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-44 rounded-xl
                     border border-slate-200 dark:border-[#0e1726]
                     bg-white/95 dark:bg-[#0a1222]/95 p-1
                     shadow-2xl backdrop-blur-md"
          role="menu"
          aria-label="Theme menu"
        >
          <Item
            icon={<Sun size={16} />}
            label="Light"
            active={theme === "light"}
            onClick={() => select("light")}
          />
          <Item
            icon={<Moon size={16} />}
            label="Dark"
            active={theme === "dark"}
            onClick={() => select("dark")}
          />
          <Item
            icon={<Laptop size={16} />}
            label="System"
            active={theme === "system"}
            onClick={() => select("system")}
          />
        </div>
      )}
    </div>
  );
}

function Item({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      role="menuitem"
      className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm
        hover:bg-slate-100 dark:hover:bg-white/10
        ${
          active
            ? "bg-blue-50 text-[#1280ff] dark:bg-white/10 dark:text-[#1280ff]"
            : "text-slate-700 dark:text-slate-300"
        }`}
    >
      {icon}
      {label}
    </button>
  );
}
