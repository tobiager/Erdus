import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { oldToNew, newToOld } from '../convert';
import { newToIR, IRDiagram } from '../ir';
import { irToPostgres } from '../ir-to-sql';
import { irToPrisma } from '../ir-to-prisma';
import { irToTypeorm } from '../ir-to-typeorm';
import { irToDbml } from '../ir-to-dbml';
import { irToMermaid } from '../ir-to-mermaid';
import { sqlToIR } from '../sql-to-ir';
import { prismaToIR } from '../prisma-to-ir';
import { typeormToIR } from '../typeorm-to-ir';
import { irToNew } from '../ir-to-new';
import Dropzone from "../components/Dropzone";
import CtaButton from "../components/CtaButton";

type InFmt = 'old' | 'new' | 'sql' | 'prisma' | 'typeorm';
type TgtFmt = 'sql' | 'prisma' | 'typeorm' | 'dbml' | 'mermaid' | 'new' | 'old';

const detectInput = (text: string): InFmt => {
  try {
    const obj = JSON.parse(text);
    if (obj && obj.version === 2 && obj.www === 'erdplus.com' && Array.isArray(obj.shapes)) return 'old';
    if (obj && obj.diagramType === 2 && obj.data && Array.isArray(obj.data.nodes)) return 'new';
  } catch { /* not JSON */ }
  if (/model\s+\w+\s*{/.test(text)) return 'prisma';
  if (/@Entity/.test(text)) return 'typeorm';
  if (/CREATE\s+TABLE/i.test(text)) return 'sql';
  throw new Error('Unsupported input format');
};

const computeOutName = (inputName: string, to: 'old' | 'new') => {
  const ext = '.erdplus';
  const base = inputName.endsWith(ext) ? inputName.slice(0, -ext.length) : inputName.replace(/\.(json|sql|prisma)$/i, '');
  const clean = base.replace(/-(old|new)$/i, '');
  return `${clean}-${to}${ext}`;
};

const computeTextOutName = (inputName: string, to: 'sql' | 'prisma' | 'ts' | 'dbml' | 'mmd') => {
  const base = inputName.replace(/\.(erdplus|json|sql|prisma|ts|dbml|mmd)$/i, '').replace(/-(old|new)$/i, '');
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
  const { t } = useTranslation();
  const [target, setTarget] = useState<TgtFmt>('sql');
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [logLines, setLogLines] = useState<string[]>([t('converter.log.ready')]);
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
      setLogLines([t('converter.log.reading', { file: file.name })]);

    try {
      const text = await readFile(file);
      const fmt = detectInput(text);
      pushLog(t('converter.log.detected', { fmt: fmt.toUpperCase() }));
      pushLog(t('converter.log.target', { tgt: tgt.toUpperCase() }));

      let ir: IRDiagram;
      let newDoc: any;
      const losses: string[] = [];

      if (fmt === 'old') {
        const data = JSON.parse(text);
        if (data.connectors?.length) losses.push(t('converter.loss.connectorsIgnored', { count: data.connectors.length }));
        newDoc = oldToNew(data);
        ir = newToIR(newDoc);
      } else if (fmt === 'new') {
        newDoc = JSON.parse(text);
        const extra = (newDoc.data?.edges || []).filter((e: any) => e.type !== 'Relational').length;
        if (extra) losses.push(t('converter.loss.nonRelationalEdgesIgnored', { count: extra }));
        ir = newToIR(newDoc);
      } else if (fmt === 'sql') {
        ir = sqlToIR(text);
        newDoc = irToNew(ir);
        losses.push(t('converter.loss.commentsIgnored'));
      } else if(fmt === 'typeorm') {
        ir = typeormToIR(text);
        newDoc = irToNew(ir);
        losses.push(t('converter.loss.typeormIgnored'));
      } else {
        ir = prismaToIR(text);
        newDoc = irToNew(ir);
        losses.push(t('converter.loss.prismaIgnored'));
      }

      if (tgt === 'sql') {
        const sql = irToPostgres(ir);
        setOutput(sql);
        setLoss(losses.join('\n') || t('converter.loss.none'));
        pushLog(t('converter.log.generatedSQL'));
        setStatus('done');
        return;
      }

      if (tgt === 'prisma') {
        const prisma = irToPrisma(ir);
        setOutput(prisma);
        setLoss(losses.join('\n') || t('converter.loss.none'));
        pushLog(t('converter.log.generatedPrisma'));
        setStatus('done');
        return;
      }

      if (tgt === 'typeorm') {
        const typeorm = irToTypeorm(ir);
        setOutput(typeorm);
        setLoss(losses.join('\n') || t('converter.loss.none'));
        pushLog(t('converter.log.generatedTypeorm'));
        setStatus('done');
        return;
      }

      if (tgt === 'dbml') {
        const dbml = irToDbml(ir, { includeComments: true });
        setOutput(dbml);
        setLoss(losses.join('\n') || t('converter.loss.none'));
        pushLog(t('converter.log.generatedDbml'));
        setStatus('done');
        return;
      }

      if (tgt === 'mermaid') {
        const mermaid = irToMermaid(ir, { includeAttributes: true, direction: 'TD' });
        setOutput(mermaid);
        setLoss(losses.join('\n') || t('converter.loss.none'));
        pushLog(t('converter.log.generatedMermaid'));
        setStatus('done');
        return;
      }

      // ERDPlus exports (download JSON)
      const outDoc = tgt === 'new' ? newDoc : newToOld(newDoc);
      const outName = computeOutName(file.name, tgt);
      downloadJSON(outDoc, outName);
      pushLog(t('converter.log.downloaded', { name: outName }));
      setStatus('done');
    } catch (e: any) {
      console.error(e);
      setStatus('error');
      pushLog(t('converter.log.error', { error: e?.message === 'Unsupported input format' ? t('converter.errors.unsupported') : (e?.message || e) }));
    }
  }, [pushLog, t]);

  const onConvert = async () => {
    if (!lastFile) {
      pushLog(t('converter.log.chooseFile'));
      setStatus('error');
      return;
    }
    setFileName(lastFile.name);
    await handleProcess(lastFile, target);
  };

  const onCopy = () => {
    if (!output) { pushLog(t('converter.log.nothingToCopy')); return; }
    navigator.clipboard.writeText(output);
    pushLog(t('converter.log.copied'));
  };

  const onDownload = () => {
    if (!output) { pushLog(t('converter.log.nothingToDownload')); return; }
    let targetFormat: string;
    switch (target) {
      case 'typeorm':
        targetFormat = 'ts';
        break;
      case 'dbml':
        targetFormat = 'dbml';
        break;
      case 'mermaid':
        targetFormat = 'mmd';
        break;
      default:
        targetFormat = target as 'sql' | 'prisma';
    }
    const name = computeTextOutName(fileName || 'output', targetFormat as any);
    downloadText(output, name);
    pushLog(t('converter.log.downloadedAs', { name }));
  };

  const statusBadge = useMemo(() => {
    const base = 'inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium';
    if (status === 'working') {
      return (
        <span className={`${base}
          bg-blue-100 text-blue-700
          dark:bg-blue-500/15 dark:text-blue-300`}>{t('converter.status.processing')}</span>
      );
    }
    if (status === 'done') {
      return (
        <span className={`${base}
          bg-emerald-100 text-emerald-700
          dark:bg-emerald-500/15 dark:text-emerald-300`}>{t('converter.status.done')}</span>
      );
    }
    if (status === 'error') {
      return (
        <span className={`${base}
          bg-rose-100 text-rose-700
          dark:bg-rose-500/15 dark:text-rose-300`}>{t('converter.status.error')}</span>
      );
    }
    return (
      <span className={`${base}
        bg-slate-100 text-slate-700
        dark:bg-slate-500/15 dark:text-slate-300`}>{t('converter.status.idle')}</span>
    );
  }, [status, t]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t('converter.title')}</h1>
        {statusBadge}
      </div>

      {/* Two columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Actions */}
        <Panel>
          <div className="p-5 space-y-5">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('converter.actions.convertFile')}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('converter.actions.instruction')}
            </p>

            <Dropzone
              accept=".erdplus,.json,.sql,.prisma,.ts"
              variant="large"
              extensionsHint={["ERDPlus", "JSON", "SQL", "Prisma", "TypeORM"]}
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
                  <span className="sr-only">{t('converter.actions.outputFormat')}</span>
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
                  <option value="sql">{t('converter.targets.sql')}</option>
                  <option value="prisma">{t('converter.targets.prisma')}</option>
                  <option value="typeorm">{t('converter.targets.typeorm')}</option>
                  <option value="dbml">{t('converter.targets.dbml')}</option>
                  <option value="mermaid">{t('converter.targets.mermaid')}</option>
                  <option value="new">{t('converter.targets.new')}</option>
                  <option value="old">{t('converter.targets.old')}</option>
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
                {t('converter.actions.convert')}
              </CtaButton>
            </div>

            {/* Copy / Download */}
            {output && (
              <div className="mt-3 flex flex-wrap gap-2">
                <CtaButton onClick={onCopy} variant="ghost">
                  {t('converter.actions.copy')}
                </CtaButton>
                <CtaButton onClick={onDownload} variant="ghost">
                  {t('converter.actions.download')}
                </CtaButton>
              </div>
            )}
          </div>
        </Panel>

        {/* Help / How it works */}
        <Panel>
          <div className="p-5">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('converter.help.title')}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
              <li>{t('converter.help.list.item1')}</li>
              <li>{t('converter.help.list.item2')}</li>
              <li>{t('converter.help.list.item3')}</li>
              <li>{t('converter.help.list.item4')}</li>
              <li><span className="text-slate-600 dark:text-slate-400">{t('converter.help.list.privacyLabel')}</span> {t('converter.help.list.privacyText')}</li>
            </ul>
          </div>
        </Panel>
      </div>

      {/* Terminal (log) */}
      <Panel>
        <div className="p-4">
          <div className="mb-2 text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">{t('converter.terminal')}</div>
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
            <div className="mb-2 text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">{t('converter.output')}</div>
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
              <div className="mb-2 text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">{t('converter.notes')}</div>
              <pre
                className="max-h-64 overflow-auto rounded-lg
                           bg-slate-50 text-slate-800
                           dark:bg-[#0f1522] dark:text-slate-200 p-3 font-mono text-sm"
              >
  {loss || t('converter.loss.none')}
              </pre>
          </div>
        </Panel>
      )}
    </div>
  );
}
