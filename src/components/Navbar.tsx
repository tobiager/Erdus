import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Github } from "lucide-react";
import ThemeMenu from "./ThemeMenu";

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
    moveIndicatorTo(linkRefs[activeKey].current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, location.pathname]);

  useEffect(() => {
    const handler = () => moveIndicatorTo(linkRefs[activeKey].current);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

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

        {/* Carril scrolleable con fade */}
        <div
          ref={wrapperRef}
          aria-label="Main"
          className="
            relative flex-1 min-w-0
            h-10 md:h-auto
            flex items-center md:justify-center justify-start
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
          style={{
            ["--edge" as any]: "36px", // ancho del fade en bordes
          }}
        >
          <div className="flex items-center gap-4 sm:gap-6">
            <NavLink
              to="/"
              ref={homeRef}
              className={link}
              onMouseEnter={(e) => moveIndicatorTo(e.currentTarget)}
              onMouseLeave={() => moveIndicatorTo(linkRefs[activeKey].current)}
            >
              Home
            </NavLink>

            <NavLink
              to="/converter"
              ref={converterRef}
              className={link}
              onMouseEnter={(e) => moveIndicatorTo(e.currentTarget)}
              onMouseLeave={() => moveIndicatorTo(linkRefs[activeKey].current)}
            >
              Converter
            </NavLink>

            <NavLink
              to="/documentation"
              ref={docsRef}
              className={link}
              onMouseEnter={(e) => moveIndicatorTo(e.currentTarget)}
              onMouseLeave={() => moveIndicatorTo(linkRefs[activeKey].current)}
            >
              <span className="sm:hidden">Docs</span>
              <span className="hidden sm:inline">Documentation</span>
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

        {/* Acciones derecha (fuera del scroll) */}
        <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-4 shrink-0">
          <div className="text-[#1280ff]">
            <ThemeMenu />
          </div>
          <a
            href="https://github.com/tobiager/erdus"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="
              relative inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full
              text-[#1280ff] transition
              hover:bg-slate-200/40 dark:hover:bg-white/5
              hover:ring-2 hover:ring-[#1280ff]/50
              before:absolute before:inset-0 before:rounded-full
              before:bg-[radial-gradient(60%_60%_at_50%_50%,rgba(18,128,255,0.28),transparent_70%)]
              before:opacity-0 hover:before:opacity-100 before:transition
            "
          >
            <Github size={18} className="sm:hidden" />
            <Github size={20} className="hidden sm:block" />
          </a>
        </div>
      </div>
    </nav>
  );
}
