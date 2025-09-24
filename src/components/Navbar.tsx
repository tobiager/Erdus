import { Link, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Github, MoreVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import LanguageToggleCompact from './LanguageToggleCompact';

type LinkKey = 'home' | 'converter' | 'diagrams' | 'docs';

type Props = { variant?: 'default' | 'transparent' };

const link = ({ isActive }: { isActive: boolean }, variant: 'default' | 'transparent' = 'default') =>
  [
    'px-2 py-1.5 text-sm sm:px-3 sm:py-2 sm:text-base font-medium transition-colors',
    variant === 'transparent' 
      ? 'text-white/90 hover:text-white'
      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white',
    isActive ? (variant === 'transparent' ? 'text-white' : 'text-[#1280ff] dark:text-[#1280ff]') : '',
  ].join(' ');


const iconWrapDesktop = (variant: 'default' | 'transparent' = 'default') => [
  "group relative inline-flex items-center justify-center rounded-full select-none",
  "size-9 md:size-6",
  variant === 'transparent' ? "text-white/90 hover:text-white" : "text-[#1280ff]",
  "transition",
  "md:bg-transparent md:border-0 md:shadow-none",
  "md:transition-transform md:transform-gpu md:hover:scale-[1.03]",
  variant === 'default' ? "md:hover:drop-shadow-[0_0_14px_rgba(18,128,255,0.45)]" : "",
  "focus:outline-none focus-visible:outline-none",

  "before:pointer-events-none before:absolute before:inset-0 before:rounded-full before:content-['']",
  variant === 'default' ? "before:bg-[radial-gradient(60%_60%_at_50%_50%,rgba(18,128,255,0.35),transparent_72%)]" : "before:bg-[radial-gradient(60%_60%_at_50%_50%,rgba(255,255,255,0.2),transparent_72%)]",
  "before:blur-[2px] before:opacity-0 before:transition",
  "md:hover:before:opacity-100",

  "after:pointer-events-none after:absolute after:rounded-full after:content-['']",
  variant === 'default' ? "md:after:inset-[-4px] md:after:ring-2 md:after:ring-[#1280ff]/40" : "md:after:inset-[-4px] md:after:ring-2 md:after:ring-white/40",
  "after:opacity-0 after:transition",
  "md:hover:after:opacity-100",
].filter(Boolean).join(" ");

const iconInnerDesktop = (variant: 'default' | 'transparent' = 'default') => [
  'relative z-[1] grid place-items-center',
  'h-6 w-6 md:h-5 md:w-5',
  'leading-none select-none transition-colors',
  variant === 'transparent' ? 'group-hover:text-white' : 'group-hover:text-slate-900 dark:group-hover:text-white',
  // ✅ Sólo aplica al SVG hijo directo
  '[&>svg]:h-full [&>svg]:w-full [&>svg]:stroke-current [&>svg]:[stroke-width:2.25]',
].join(' ');


const iconWrapMobile = [
  'group relative inline-flex items-center justify-center rounded-full select-none',
  'size-9 transition',
  '!bg-white/90 !border !border-slate-200',
  'dark:!bg-slate-800/90 dark:!border dark:!border-slate-700/70',
  'shadow-sm shadow-black/5 dark:shadow-black/10',
  'focus:outline-none focus-visible:outline-none',
].join(' ');

const iconInnerMobile = [
  'relative z-[1] grid place-items-center',
  'h-5 w-5',
  'leading-none select-none transition-colors',
  '!text-[#1280ff]',
  '[&>svg]:h-full [&>svg]:w-full [&>svg]:stroke-current [&>svg]:[stroke-width:2.50]',
  'font-semibold text-[13px]',
].join(' ');

export default function Navbar({ variant = 'default' }: Props) {
  const location = useLocation();
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);

  // Scroll detection for transparent navbar
  useEffect(() => {
    if (variant !== 'transparent') return;
    
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [variant]);

  const homeRef = useRef<HTMLAnchorElement>(null);
  const converterRef = useRef<HTMLAnchorElement>(null);
  const diagramsRef = useRef<HTMLAnchorElement>(null);
  const docsRef = useRef<HTMLAnchorElement>(null);

  const linkRefs: Record<LinkKey, React.RefObject<HTMLAnchorElement>> = {
    home: homeRef,
    converter: converterRef,
    diagrams: diagramsRef,
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
    location.pathname.startsWith('/converter')
      ? 'converter'
      : location.pathname.startsWith('/diagramas')
      ? 'diagrams'
      : location.pathname.startsWith('/documentation')
      ? 'docs'
      : 'home';

  useEffect(() => {
    requestAnimationFrame(() => moveIndicatorTo(linkRefs[activeKey].current));
  }, [activeKey, location.pathname]);

  useEffect(() => {
    const handler = () => moveIndicatorTo(linkRefs[activeKey].current);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
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
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  const base = 'w-full';
  const transparent = `fixed inset-x-0 top-0 z-50 border-b border-transparent ${
    scrolled ? 'bg-neutral-900/70 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/40' : 'bg-transparent'
  } text-white`;
  const normal = 'sticky top-0 z-40 bg-white dark:bg-neutral-900';

  return (
    <nav className={`${base} ${variant === 'transparent' ? transparent : normal}`}>
      <div className="mx-auto max-w-7xl h-16 md:h-20 px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className={`text-lg sm:text-xl font-bold flex items-center gap-2 ${
            variant === 'transparent' ? 'text-white' : 'text-slate-900 dark:text-white'
          }`}
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
          style={{ ['--edge' as any]: '36px' }}
        >
          <div className="flex items-center gap-4 sm:gap-6">
            <NavLink
              to="/"
              ref={homeRef}
              className={({ isActive }) => link({ isActive }, variant)}
              onMouseEnter={(e) => moveIndicatorTo(e.currentTarget)}
              onMouseLeave={() => moveIndicatorTo(linkRefs[activeKey].current)}
            >
              {t('nav.home')}
            </NavLink>

            <NavLink
              to="/converter"
              ref={converterRef}
              className={({ isActive }) => link({ isActive }, variant)}
              onMouseEnter={(e) => moveIndicatorTo(e.currentTarget)}
              onMouseLeave={() => moveIndicatorTo(linkRefs[activeKey].current)}
            >
              {t('nav.converter')}
            </NavLink>

            <NavLink
              to="/diagramas"
              ref={diagramsRef}
              className={({ isActive }) => link({ isActive }, variant)}
              onMouseEnter={(e) => moveIndicatorTo(e.currentTarget)}
              onMouseLeave={() => moveIndicatorTo(linkRefs[activeKey].current)}
            >
              {t('nav.diagrams')}
            </NavLink>

            <NavLink
              to="/documentation"
              ref={docsRef}
              className={({ isActive }) => link({ isActive }, variant)}
              onMouseEnter={(e) => moveIndicatorTo(e.currentTarget)}
              onMouseLeave={() => moveIndicatorTo(linkRefs[activeKey].current)}
            >
              <span className="sm:hidden">{t('nav.docs')}</span>
              <span className="hidden sm:inline">{t('nav.documentation')}</span>
            </NavLink>
          </div>

          {/* Indicador */}
          <span
            aria-hidden
            className={`absolute -bottom-[2px] h-[4px] rounded transition-all duration-300 ease-out ${
              variant === 'transparent' ? 'bg-white' : 'bg-[#1280ff]'
            } ${indicator.ready ? 'opacity-100' : 'opacity-0'}`}
            style={{ left: indicator.left, width: indicator.width }}
          />
        </div>

        {/* Acciones derecha */}
        <div className="ml-2 sm:ml-4 shrink-0 flex items-center">
          {/* Desktop */}
          <div className="hidden md:flex items-center gap-7">
            {/* Idioma */}
            <div className={iconWrapDesktop(variant)} aria-label="Language">
              <span className={iconInnerDesktop(variant)}>
                <LanguageToggleCompact className="grid place-items-center h-full w-full text-[12px] font-semibold leading-none translate-y-[0.5px]" />
              </span>
            </div>

            {/* Tema */}
            <div className={iconWrapDesktop(variant)} aria-label="Theme">
              <span className={iconInnerDesktop(variant)}>
                <ThemeToggle buttonClassName="h-full w-full [&>svg]:h-full [&>svg]:w-full [&>svg]:[stroke-width:2.25]" />
              </span>
            </div>

            {/* GitHub */}
            <a
              href="https://github.com/tobiager/erdus"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className={iconWrapDesktop(variant)}
            >
              <span className={iconInnerDesktop(variant)}>
                <Github size={22} strokeWidth={2.25} />
              </span>
            </a>
          </div>

          {/* Móvil: 3 puntos → stack */}
          <div className="relative md:hidden" ref={dropdownRef}>
            <button
              aria-label="More actions"
              onClick={() => setMenuOpen((v) => !v)}
              className={iconWrapMobile}
            >
              <span className={iconInnerMobile}>
                <MoreVertical size={20} strokeWidth={2.5} />
              </span>
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  className="absolute top-full right-0 mt-2 z-50 w-9 origin-top-right flex flex-col items-center"
                  variants={{ hidden: { opacity: 0, y: -6, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1 } }}
                  transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                >
                  <motion.a
                    href="https://github.com/tobiager/erdus"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    className={`${iconWrapMobile} mt-2`}
                    onClick={() => setMenuOpen(false)}
                    variants={{ hidden: { opacity: 0, y: -10 }, show: { opacity: 1, y: 0 } }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className={iconInnerMobile}>
                      <Github size={22} strokeWidth={2.25} />
                    </span>
                  </motion.a>

                  <motion.div
                    className={`${iconWrapMobile} mt-2`}
                    variants={{ hidden: { opacity: 0, y: -10 }, show: { opacity: 1, y: 0 } }}
                  >
                    <span className={iconInnerMobile}>
                      <ThemeToggle buttonClassName="h-full w-full !text-[#1280ff] [&>svg]:h-full [&>svg]:w-full" />
                    </span>
                  </motion.div>

                  <motion.div
                    className={`${iconWrapMobile} mt-2`}
                    variants={{ hidden: { opacity: 0, y: -10 }, show: { opacity: 1, y: 0 } }}
                  >
                    <span className={iconInnerMobile}>
                      <LanguageToggleCompact className="grid place-items-center h-full w-full !font-semibold !text-[13px] translate-y-[0.5px]" />
                    </span>
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
