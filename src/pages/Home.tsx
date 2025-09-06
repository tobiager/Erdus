import { motion, type Variants } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: 0.08 * i,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export default function Home() {
  const { t } = useTranslation();
  return (
    <section className="relative min-h-[60vh] grid place-items-center overflow-hidden">
      {/* Fondo: gradient animado muy suave */}
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-0 -z-10 opacity-[0.25]
          bg-[radial-gradient(1200px_600px_at_50%_-20%,#1280ff15,transparent_60%)]
        "
      />
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-0 -z-10 opacity-[0.12]
          bg-[linear-gradient(120deg,#0f172a,#0b1220,#0f172a)]
          bg-[length:200%_200%] animate-bg-pan-slow
        "
      />

      {/* Grid sutil de puntos */}
      <div
        aria-hidden
        className="
          absolute inset-0 -z-10 opacity-[0.06]
          [background-image:radial-gradient(#ffffff20_1px,transparent_1px)]
          [background-size:18px_18px]
        "
      />

      {/* Contenido */}
      <div className="text-center w-full px-4"> {/* padding lateral en móvil */}
      <motion.h1
        className="
          font-inter font-extrabold tracking-tight
          text-slate-900 dark:text-white leading-[1.1]
          flex flex-wrap items-baseline justify-center gap-2
        "
        variants={fadeUp}
        initial="hidden"
        animate="show"
        custom={0}
      >
        <span className="text-3xl sm:text-5xl">{t("home.welcome")}</span>

        <span
          className="
            text-6xl sm:text-8xl
            bg-gradient-to-r from-sky-400 via-cyan-500 to-blue-600
            bg-[length:400%_400%] bg-clip-text text-transparent
            animate-[bg-pan_8s_linear_infinite]
            drop-shadow-[0_0_14px_rgba(56,189,248,0.18)]
          "
        >
          Erdus
        </span>
      </motion.h1>

      <motion.p
        className="
          max-w-2xl mx-auto mt-4 px-2
          text-sm sm:text-base
          text-slate-600 dark:text-slate-300
          whitespace-normal sm:whitespace-nowrap
        "
        variants={fadeUp}
        initial="hidden"
        animate="show"
        custom={1}
      >
        {t("home.tagline")}
      </motion.p>

      <motion.div
        className="
          mt-8 flex flex-row flex-wrap items-center justify-center gap-3
        "
        variants={fadeUp}
        initial="hidden"
        animate="show"
        custom={2}
      >
        {/* Convert now */}
        <Link
          to="/converter"
          className="
            relative inline-flex items-center gap-2 h-11 px-5 rounded-xl
            text-white bg-[#1280ff] border border-[#1280ff]
            transition hover:shadow-[0_0_0_4px_rgba(18,128,255,0.15)]
            active:scale-[0.98] overflow-hidden
          "
        >
          <span
            aria-hidden
            className="
              pointer-events-none absolute inset-0
              bg-gradient-to-r from-transparent via-white/25 to-transparent
              -skew-x-12 animate-shine
            "
          />
          {t("home.convertNow")}
        </Link>

        {/* Star on GitHub */}
        <a
          href="https://github.com/tobiager/erdus"
          target="_blank"
          rel="noopener noreferrer"
          className="
            group inline-flex items-center gap-2 h-11 px-5 rounded-xl
            border border-[#1280ff] text-[#1280ff]
            transition hover:bg-[#1280ff]/10
          "
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 
              0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
              -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 
              2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 
              0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 
              0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 
              2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 
              2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 
              1.48 0 1.07-.01 1.93-.01 2.19 0 .21.15.46.55.38A8.013 
              8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          {t("home.starOnGitHub")}
        </a>
      </motion.div>
      </div>
    </section>
  );
}
