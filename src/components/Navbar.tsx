import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Github, MoreVertical } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import ThemeMenu from "./ThemeMenu";
import LanguageToggleCompact from "./LanguageToggleCompact";

type LinkKey = "home" | "converter" | "docs";

const link = ({ isActive }: { isActive: boolean }) =>
  [
    "px-2 py-1.5 text-sm sm:px-3 sm:py-2 sm:text-base font-medium transition-colors",
    "text-slate-700 dark:text-slate-300",
    "hover:text-slate-900 dark:hover:text-white",
    isActive ? "text-[#1280ff] dark:text-[#1280ff]" : "",
  ].join(" ");

export default function Navbar() {
  const location = useLocation();
  const { t } = useTranslation();

  const homeRef = useRef<HTMLAnchorElement>(null);
  const converterRef = useRef<HTMLAnchorElement>(null);
  const docsRef = useRef<HTMLAnchorElement>(null);

  const linkRefs: Record<LinkKey, React.RefObject<HTMLAnchorElement>> = {
    home: homeRef,
    converter: converterRef,
    docs: docsRef,
  };

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });

  const moveIndicatorTo = (el?: HTMLElement | null) => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !el) return;
    const wrapRect = wrapper.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const left = elRect.left - wrapRect.left + wrapper.scrollLeft;
    setIndicator({ left, width: elRect.width, ready: true });
  };

  const activeKey: LinkKey =
    location.pathname.startsWith("/converter")
      ? "converter"
      : location.pathname.startsWith("/documentation")
      ? "docs"
      : "home";

  useEffect(() => {
    requestAnimationFrame(() => moveIndicatorTo(linkRefs[activeKey].current));
  }, [activeKey, location.pathname]);

  useEffect(() => {
    const handler = () => moveIndicatorTo(linkRefs[activeKey].current);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [activeKey]);

  // ——— Menú móvil (3 puntos)
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMenuOpen(false), [location.pathname]);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuOpen) return;
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  return (
    <nav className="w-full">
      <div className="mx-auto max-w-7xl h-16 md:h-20 px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white"
        >
          Erdus
          <span className="text-[10px] leading-none bg-blue-600 text-white px-1.5 py-0.5 rounded-md">
            beta
          </span>
        </Link>

        {/* Secciones centradas */}
        <div
          ref={wrapperRef}
          aria-label="Main"
          className="
            relative flex-1 min-w-0
            h-10 md:h-auto
            flex items-center justify-center
            overflow-x-auto overflow-y-hidden
            whitespace-nowrap
            no-scrollbar nav-scroll-mask
            [touch-action:pan-x]
            [overscroll-behavior-x:contain]
            [overscroll-behavior-y:none]
            -mx-4 pl-4
            gap-0
            snap-x snap-mandatory
          "
          style={{ ["--edge" as any]: "36px" }}
        >
          <div className="flex items-center gap-4 sm:gap-6">
            <NavLink
              to="/"
              ref={homeRef}
              className={link}
              onMouseEnter={(e) => moveIndicatorTo(e.currentTarget)}
              onMouseLeave={() => moveIndicatorTo(linkRefs[activeKey].current)}
            >
              {t("nav.home")}
            </NavLink>

            <NavLink
              to="/converter"
              ref={converterRef}
              className={link}
              onMouseEnter={(e) => moveIndicatorTo(e.currentTarget)}
              onMouseLeave={() => moveIndicatorTo(linkRefs[activeKey].current)}
            >
              {t("nav.converter")}
            </NavLink>

            <NavLink
              to="/documentation"
              ref={docsRef}
              className={link}
              onMouseEnter={(e) => moveIndicatorTo(e.currentTarget)}
              onMouseLeave={() => moveIndicatorTo(linkRefs[activeKey].current)}
            >
              <span className="sm:hidden">{t("nav.docs")}</span>
              <span className="hidden sm:inline">{t("nav.documentation")}</span>
            </NavLink>
          </div>

          {/* Indicador */}
          <span
            aria-hidden
            className={`absolute -bottom-[2px] h-[4px] bg-[#1280ff] rounded transition-all duration-300 ease-out ${
              indicator.ready ? "opacity-100" : "opacity-0"
            }`}
            style={{ left: indicator.left, width: indicator.width }}
          />
        </div>

        {/* Acciones derecha */}
        <div className="ml-2 sm:ml-4 shrink-0 flex items-center">
          {/* Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageToggleCompact />
            <div className="text-[#1280ff]">
              <ThemeMenu />
            </div>
            <a
              href="https://github.com/tobiager/erdus"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="
                relative inline-flex items-center justify-center h-9 w-9 rounded-full
                text-[#1280ff] transition
                hover:bg-slate-200/40 dark:hover:bg-white/5
                hover:ring-2 hover:ring-[#1280ff]/50
                before:absolute before:inset-0 before:rounded-full
                before:bg-[radial-gradient(60%_60%_at_50%_50%,rgba(18,128,255,0.28),transparent_70%)]
                before:opacity-0 hover:before:opacity-100 before:transition
              "
            >
              <Github size={20} />
            </a>
          </div>

          {/* Móvil: 3 puntos → stack centrado */}
          <div className="relative md:hidden" ref={dropdownRef}>
            <button
              aria-label="More actions"
              onClick={() => setMenuOpen((v) => !v)}
              className="
                h-9 w-9 inline-flex items-center justify-center rounded-full
                text-[#1280ff]
                hover:bg-slate-200/40 dark:hover:bg-white/5
                transition
              "
            >
              <MoreVertical size={20} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  // ⬇️ Posicionado EXACTO bajo el botón (borde derecho)
                  className="absolute top-full right-0 mt-1 z-50 w-9 origin-top-right flex flex-col items-center"
                  variants={{
                    hidden: { opacity: 0, y: -6, scale: 0.98 },
                    show:   { opacity: 1, y: 0,  scale: 1 },
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 26 }}
                >
                  {/* GitHub */}
                  <motion.a
                    href="https://github.com/tobiager/erdus"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    className="h-9 w-9 flex items-center justify-center rounded-full text-[#1280ff]
                              hover:bg-slate-200/40 dark:hover:bg-white/5"
                    onClick={() => setMenuOpen(false)}
                    variants={{ hidden: { opacity: 0, y: -10 }, show: { opacity: 1, y: 0 } }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Github size={20} />
                  </motion.a>

                  {/* Tema */}
                  <motion.div
                    className="mt-1 h-9 w-9 flex items-center justify-center text-[#1280ff]
                              hover:bg-slate-200/40 dark:hover:bg-white/5 rounded-full"
                    variants={{ hidden: { opacity: 0, y: -10 }, show: { opacity: 1, y: 0 } }}
                  >
                    <ThemeMenu />
                  </motion.div>

                  {/* Idioma */}
                  <motion.div
                    className="mt-1 h-9 w-9 flex items-center justify-center rounded-full
                              hover:bg-slate-200/40 dark:hover:bg-white/5"
                    variants={{ hidden: { opacity: 0, y: -10 }, show: { opacity: 1, y: 0 } }}
                  >
                    <LanguageToggleCompact />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </nav>
  );
}
