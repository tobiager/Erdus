import { ComponentProps, ReactNode } from "react";

type Props = {
  as?: "button" | "a" | "div";
  children: ReactNode;
} & ComponentProps<"button"> & ComponentProps<"a">;

const base =
  "inline-flex h-9 w-9 items-center justify-center rounded-md " +
  "bg-slate-100/80 dark:bg-slate-800/70 " +
  "text-slate-800 dark:text-slate-100 " +
  "ring-1 ring-slate-900/10 dark:ring-white/10 shadow-sm " +
  "hover:bg-slate-200/80 dark:hover:bg-slate-700/70 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1280ff]/60";

export default function IconButton({ as = "button", children, className, ...rest }: Props) {
  const Comp: any = as;
  return (
    <Comp className={[base, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </Comp>
  );
}
