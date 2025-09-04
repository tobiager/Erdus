import { useState, useMemo, useCallback } from 'react';
import { oldToNew, newToOld } from '../convert';
import { newToIR, IRDiagram } from '../ir';
import { irToPostgres } from '../ir-to-sql';
import { irToPrisma } from '../ir-to-prisma';
import { sqlToIR } from '../sql-to-ir';
import { prismaToIR } from '../prisma-to-ir';
import { irToNew } from '../ir-to-new';
import Dropzone from "../components/Dropzone";
import CtaButton from "../components/CtaButton";

type InFmt = 'old' | 'new' | 'sql' | 'prisma';
type TgtFmt = 'sql' | 'prisma' | 'new' | 'old';

const detectInput = (text: string): InFmt => {
  try {
    const obj = JSON.parse(text);
    if (obj && obj.version === 2 && obj.www === 'erdplus.com' && Array.isArray(obj.shapes)) return 'old';
    if (obj && obj.diagramType === 2 && obj.data && Array.isArray(obj.data.nodes)) return 'new';
  } catch { /* not JSON */ }
  if (/model\s+\w+\s*{/.test(text)) return 'prisma';
  if (/CREATE\s+TABLE/i.test(text)) return 'sql';
  throw new Error('Unsupported input format');
};

const computeOutName = (inputName: string, to: 'old' | 'new') => {
  const ext = '.erdplus';
  const base = inputName.endsWith(ext) ? inputName.slice(0, -ext.length) : inputName.replace(/\.(json|sql|prisma)$/i, '');
  const clean = base.replace(/-(old|new)$/i, '');
  return `${clean}-${to}${ext}`;
};

const computeTextOutName = (inputName: string, to: 'sql' | 'prisma') => {
  const base = inputName.replace(/\.(erdplus|json|sql|prisma)$/i, '').replace(/-(old|new)$/i, '');
  return `${base}.${to}`;
};

const downloadJSON = (obj: unknown, name: string) => {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
};

const downloadText = (text: string, name: string) => {
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
};

/** UI helpers (dual theme) */
const Panel: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className, children }) => (
  <div
    className={[
      // fondo + bordes por tema
      "rounded-xl border",
      "bg-white border-slate-200 shadow-lg ring-1 ring-black/5",
      "dark:bg-[#141821] dark:border-slate-700/60 dark:shadow-[0_6px_24px_rgba(0,0,0,.35)] dark:ring-0",
      className || ""
    ].join(" ")}
  >
    {children}
  </div>
);

const Label: React.FC<React.PropsWithChildren<{ htmlFor?: string }>> = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
    {children}
  </label>
);

export default function Converter() {
  const [target, setTarget] = useState<TgtFmt>('sql');
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [logLines, setLogLines] = useState<string[]>(['Ready to convert...']);
  const [output, setOutput] = useState('');
  const [loss, setLoss] = useState('');
  const [fileName, setFileName] = useState('');
  const [lastFile, setLastFile] = useState<File | null>(null);

  const pushLog = useCallback((line: string) => {
    setLogLines((prev) => [...prev, line]);
  }, []);

  const readFile = (file: File) => file.text();

  const handleProcess = useCallback(async (file: File, tgt: TgtFmt) => {
    setStatus('working');
    setOutput('');
    setLoss('');
    setLogLines([`Reading "${file.name}"...`]);

    try {
      const text = await readFile(file);
      const fmt = detectInput(text);
      pushLog(`Detected input: ${fmt.toUpperCase()}`);
      pushLog(`Target: ${tgt.toUpperCase()}`);

      let ir: IRDiagram;
      let newDoc: any;
      const losses: string[] = [];

      if (fmt === 'old') {
        const data = JSON.parse(text);
        if (data.connectors?.length) losses.push(`${data.connectors.length} connectors ignored`);
        newDoc = oldToNew(data);
        ir = newToIR(newDoc);
      } else if (fmt === 'new') {
        newDoc = JSON.parse(text);
        const extra = (newDoc.data?.edges || []).filter((e: any) => e.type !== 'Relational').length;
        if (extra) losses.push(`${extra} non-relational edges ignored`);
        ir = newToIR(newDoc);
      } else if (fmt === 'sql') {
        ir = sqlToIR(text);
        newDoc = irToNew(ir);
        losses.push('Comments and non-table statements are ignored');
      } else {
        ir = prismaToIR(text);
        newDoc = irToNew(ir);
        losses.push('Unsupported Prisma features were ignored');
      }

      if (tgt === 'sql') {
        const sql = irToPostgres(ir);
        setOutput(sql);
        setLoss(losses.join('\n') || 'No losses detected.');
        pushLog('Generated PostgreSQL DDL.');
        setStatus('done');
        return;
      }

      if (tgt === 'prisma') {
        const prisma = irToPrisma(ir);
        setOutput(prisma);
        setLoss(losses.join('\n') || 'No losses detected.');
        pushLog('Generated Prisma schema.');
        setStatus('done');
        return;
      }

      // ERDPlus exports (download JSON)
      const outDoc = tgt === 'new' ? newDoc : newToOld(newDoc);
      const outName = computeOutName(file.name, tgt);
      downloadJSON(outDoc, outName);
      pushLog(`Downloaded ${outName}`);
      setStatus('done');
    } catch (e: any) {
      console.error(e);
      setStatus('error');
      pushLog('Error: ' + (e?.message || e));
    }
  }, [pushLog]);

  const onConvert = async () => {
    if (!lastFile) {
      pushLog('Choose a file first.');
      setStatus('error');
      return;
    }
    setFileName(lastFile.name);
    await handleProcess(lastFile, target);
  };

  const onCopy = () => {
    if (!output) { pushLog('Nothing to copy.'); return; }
    navigator.clipboard.writeText(output);
    pushLog('Copied to clipboard.');
  };

  const onDownload = () => {
    if (!output) { pushLog('Nothing to download.'); return; }
    const name = computeTextOutName(fileName || 'output', (target as 'sql' | 'prisma'));
    downloadText(output, name);
    pushLog(`Downloaded as ${name}.`);
  };

  const statusBadge = useMemo(() => {
    const base = 'inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium';
    if (status === 'working') {
      return (
        <span className={`${base}
          bg-blue-100 text-blue-700
          dark:bg-blue-500/15 dark:text-blue-300`}>● Processing…</span>
      );
    }
    if (status === 'done') {
      return (
        <span className={`${base}
          bg-emerald-100 text-emerald-700
          dark:bg-emerald-500/15 dark:text-emerald-300`}>● Done</span>
      );
    }
    if (status === 'error') {
      return (
        <span className={`${base}
          bg-rose-100 text-rose-700
          dark:bg-rose-500/15 dark:text-rose-300`}>● Error</span>
      );
    }
    return (
      <span className={`${base}
        bg-slate-100 text-slate-700
        dark:bg-slate-500/15 dark:text-slate-300`}>● Idle</span>
    );
  }, [status]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Converter</h1>
        {statusBadge}
      </div>

      {/* Two columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Actions */}
        <Panel>
          <div className="p-5 space-y-5">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Convert a file</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Drag & drop an ERDPlus JSON, SQL, or Prisma file, then choose the output format.
            </p>

            <Dropzone
              accept=".erdplus,.json,.sql,.prisma"
              variant="large"
              extensionsHint={["ERDPlus", "JSON", "SQL", "Prisma"]}
              onFile={(f) => {
                setLastFile(f);
                setFileName(f.name);
                handleProcess(f, target);
              }}
              className="w-full"
            />

            {/* Select + Convert (misma altura) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
              <div className="flex-1">
                {/* label accesible, no visible para no romper la altura */}
                <Label htmlFor="target">
                  <span className="sr-only">Output format</span>
                </Label>

                <select
                  id="target"
                  value={target}
                  onChange={(e) => setTarget(e.target.value as TgtFmt)}
                  className="h-12 w-full rounded-md
                            border border-slate-300 bg-white text-slate-900
                            focus:outline-none focus:ring-2 focus:ring-slate-400
                            dark:border-slate-700 dark:bg-[#0f1522] dark:text-slate-100
                            dark:focus:ring-slate-600 px-3"
                >
                  <option value="sql">SQL (PostgreSQL)</option>
                  <option value="prisma">Prisma schema</option>
                  <option value="new">ERDPlus (new)</option>
                  <option value="old">ERDPlus (old)</option>
                </select>
              </div>

              <CtaButton
                onClick={onConvert}
                variant="solid"
                className="h-12 sm:w-40 w-full
                          !bg-[#1280ff] !border-[#1280ff] !text-white
                          hover:!bg-[#0f1522] hover:!text-[#1280ff]
                          dark:hover:!bg-[#0f1522] dark:hover:!text-[#1280ff]"
              >
                Convert
              </CtaButton>
            </div>

            {/* Copy / Download */}
            {output && (
              <div className="mt-3 flex flex-wrap gap-2">
                <CtaButton onClick={onCopy} variant="ghost">
                  Copy
                </CtaButton>
                <CtaButton onClick={onDownload} variant="ghost">
                  Download
                </CtaButton>
              </div>
            )}
          </div>
        </Panel>

        {/* Help / How it works */}
        <Panel>
          <div className="p-5">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">How it works</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
              <li>Auto-detects ERDPlus (old/new), SQL or Prisma inputs.</li>
              <li>Keeps entity positions/order, PKs and simple FKs.</li>
              <li>Converts to ERDPlus (old/new), PostgreSQL SQL, or Prisma.</li>
              <li>Outputs appear below; ERDPlus JSON downloads automatically.</li>
              <li><span className="text-slate-600 dark:text-slate-400">Privacy:</span> everything runs locally in your browser.</li>
            </ul>
          </div>
        </Panel>
      </div>

      {/* Terminal (log) */}
      <Panel>
        <div className="p-4">
          <div className="mb-2 text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">Terminal</div>
          <pre
            className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg
                       bg-slate-50 text-slate-800
                       dark:bg-[#0f1522] dark:text-slate-200 p-3 font-mono text-sm"
          >
{logLines.join('\n')}
          </pre>
        </div>
      </Panel>

      {/* Output code */}
      {output && (
        <Panel>
          <div className="p-4">
            <div className="mb-2 text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">Output</div>
            <pre
              className="max-h-[70vh] overflow-auto rounded-lg
                         bg-slate-50 text-slate-900
                         dark:bg-[#0f1522] dark:text-slate-100 p-4 font-mono text-sm leading-relaxed"
            >
{output}
            </pre>
          </div>
        </Panel>
      )}

      {/* Loss report */}
      {output && (
        <Panel>
          <div className="p-4">
            <div className="mb-2 text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">Notes</div>
            <pre
              className="max-h-64 overflow-auto rounded-lg
                         bg-slate-50 text-slate-800
                         dark:bg-[#0f1522] dark:text-slate-200 p-3 font-mono text-sm"
            >
{loss || 'No losses detected.'}
            </pre>
          </div>
        </Panel>
      )}
    </div>
  );
}
