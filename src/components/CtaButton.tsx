import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "ghost" | "primary";
};

const base = [
  "group relative inline-flex items-center justify-center",
  "h-12 px-6 rounded-xl font-semibold transition duration-200",
  "active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60",
];

const ghost = [
  "text-[#1280ff]",
  "border border-[#1f2532]",
  "hover:border-[#1280ff]",
  // efecto halo más suave
  "transition duration-200",
  "hover:ring-1 hover:ring-[#1280ff]/40 hover:ring-offset-1 hover:ring-offset-transparent",
  "hover:shadow-[0_0_8px_rgba(18,128,255,0.35)]",
  "after:absolute after:-inset-px after:rounded-[inherit] after:blur after:bg-[#1280ff]/20 after:opacity-0 group-hover:after:opacity-100",
];

const solid = [
  "text-white bg-[#0f1522]",
  "border border-[#1f2532]",
  "hover:bg-[#0f1522] hover:text-[#1280ff]",
  "after:absolute after:-inset-px after:rounded-[inherit] after:blur after:bg-[#1280ff]/25 after:opacity-0 group-hover:after:opacity-100",
];

const primary = [
  "text-white bg-[#1280ff]",
  "border border-[#1280ff]",
  "hover:bg-[#1a8dff]",
  "after:absolute after:-inset-px after:rounded-[inherit] after:blur after:bg-[#1280ff]/25 after:opacity-0 group-hover:after:opacity-100",
];

export default function CtaButton({
  className = "",
  variant = "ghost",
  children,
  ...props
}: Props) {
  const variants = { ghost, solid, primary };
  const classes = [...base, ...(variants[variant] ?? []), className].join(" ");

  return (
    <button className={classes} {...props}>
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        {children}
      </span>
    </button>
  );
}
