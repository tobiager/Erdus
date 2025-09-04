import { useRef, useState, useCallback } from "react";

type Variant = "compact" | "large";

type Props = {
  accept?: string;
  onFile: (file: File) => void;
  className?: string;
  label?: string;
  hint?: string;
  variant?: Variant;
  extensionsHint?: string[];
};

export default function Dropzone({
  accept,
  onFile,
  className,
  label = "Input file",
  hint = "You can also paste a file (Ctrl/Cmd + V).",
  variant = "large",
  extensionsHint = ["ERDPlus", "JSON", "SQL", "Prisma"],
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  const openPicker = () => inputRef.current?.click();

  const handleFiles = useCallback(
    (files?: FileList | null) => {
      const f = files?.[0];
      if (!f) return;
      setFileName(f.name);
      onFile(f);
    },
    [onFile]
  );

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const f = Array.from(e.clipboardData.files)[0];
    if (f) handleFiles({ 0: f, length: 1 } as unknown as FileList);
  };

  const large = variant === "large";

  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openPicker()}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          setIsOver(true);
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={onDrop}
        onPaste={onPaste}
        aria-label="Dropzone: drag & drop your file or click"
        className={[
          "group relative flex w-full items-center justify-center rounded-xl",
          "border border-dashed transition",
          // light theme
          "bg-white text-slate-800 border-slate-300 hover:border-blue-400/70",
          "shadow-sm ring-1 ring-black/5",
          // dark theme
          "dark:bg-[#0f1522] dark:text-slate-200 dark:border-slate-600/60",
          // hover/focus ring
          isOver ? "border-blue-500 ring-2 ring-blue-500/30 dark:ring-blue-500/40" : "",
          // gradient overlay (dual)
          "before:pointer-events-none before:absolute before:inset-0 before:rounded-xl",
          "before:bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,.06),transparent_70%)]",
          "dark:before:bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,.08),transparent_70%)]",
          large ? "h-28" : "h-12",
        ].join(" ")}
      >
        <div className={["flex items-center gap-3", large ? "flex-col" : ""].join(" ")}>
          <svg
            className={[
              "text-blue-500/90 transition group-hover:text-blue-600 dark:group-hover:text-blue-300",
              large ? "h-7 w-7" : "h-5 w-5",
            ].join(" ")}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.5" />
          </svg>

          <div className="text-center">
            {fileName ? (
              <div className="text-sm">
                <span className="text-slate-500 dark:text-slate-400">Selected:</span>{" "}
                <span className="text-slate-900 dark:text-slate-200">{fileName}</span>
              </div>
            ) : (
              <>
                <div className={["font-medium", large ? "text-base" : "text-sm"].join(" ")}>
                  Drag & drop your file{" "}
                  <span className="text-blue-600 dark:text-blue-400 underline-offset-4 group-hover:underline">
                    or click to browse
                  </span>
                </div>
                {large && (
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                    {extensionsHint.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border px-2.5 py-0.5 text-xs
                                   border-slate-300 bg-slate-50 text-slate-700
                                   dark:border-slate-600/60 dark:bg-[#0d1726] dark:text-slate-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
    </div>
  );
}
