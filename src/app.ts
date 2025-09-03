import { oldToNew, newToOld } from './convert';
import { newToIR, IRDiagram } from './ir';
import { irToPostgres } from './ir-to-sql';
import { irToPrisma } from './ir-to-prisma';
import { sqlToIR } from './sql-to-ir';
import { prismaToIR } from './prisma-to-ir';
import { irToNew } from './ir-to-new';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;
const log = (msg: string) => { ($('#log') as HTMLDivElement).textContent = msg; };

function computeOutName(inputName: string, to: 'old'|'new'): string {
  const ext = '.erdplus';
  const base = inputName.endsWith(ext) ? inputName.slice(0, -ext.length) : inputName.replace(/\.(json|sql|prisma)$/i, '');
  const clean = base.replace(/-(old|new)$/i, '');
  return `${clean}-${to}${ext}`;
}

function computeTextOutName(inputName: string, to: 'sql'|'prisma'): string {
  const base = inputName.replace(/\.(erdplus|json|sql|prisma)$/i, '');
  const clean = base.replace(/-(old|new)$/i, '');
  return `${clean}.${to}`;
}

function download(obj: any, name: string) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function downloadText(text: string, name: string) {
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

type InFmt = 'old'|'new'|'sql'|'prisma';

function detectInput(text: string): InFmt {
  try {
    const obj = JSON.parse(text);
    if (obj && obj.version === 2 && obj.www === 'erdplus.com' && Array.isArray(obj.shapes)) return 'old';
    if (obj && obj.diagramType === 2 && obj.data && Array.isArray(obj.data.nodes)) return 'new';
  } catch { /* ignore */ }
  if (/model\s+\w+\s+{/.test(text)) return 'prisma';
  if (/CREATE TABLE/i.test(text)) return 'sql';
  throw new Error('Formato de entrada no soportado');
}

async function handleProcess(file: File, target: 'sql'|'prisma'|'old'|'new') {
  try {
    const text = await file.text();
    const fmt = detectInput(text);
    log(`Entrada ${fmt.toUpperCase()} → ${target.toUpperCase()}`);
    let ir: IRDiagram;
    let newDoc;
    const losses: string[] = [];
    if (fmt === 'old') {
      const data = JSON.parse(text);
      if (data.connectors && data.connectors.length) {
        losses.push(`${data.connectors.length} connectors ignored`);
      }
      newDoc = oldToNew(data);
      ir = newToIR(newDoc);
    } else if (fmt === 'new') {
      newDoc = JSON.parse(text);
      const extra = (newDoc.data.edges || []).filter((e: any) => e.type !== 'Relational').length;
      if (extra) losses.push(`${extra} edges not convertible`);
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

    const preview = $('#preview');
    const pre = $('#out') as HTMLPreElement;
    const lossPre = $('#loss') as HTMLPreElement;
    const copyBtn = $('#copy-out') as HTMLButtonElement;
    const dlBtn = $('#download-out') as HTMLButtonElement;
    const tabOut = $('#tab-out') as HTMLButtonElement;
    const tabLoss = $('#tab-loss') as HTMLButtonElement;
    lossPre.textContent = losses.length ? losses.join('\n') : 'No losses detected.';
    tabOut.classList.add('tab-active');
    tabLoss.classList.remove('tab-active');
    pre.style.display = 'block';
    lossPre.style.display = 'none';
    let output = '';
    if (target === 'sql') {
      output = irToPostgres(ir);
      pre.textContent = output;
      preview.style.display = 'block';
      copyBtn.style.display = '';
      dlBtn.style.display = '';
      dlBtn.dataset.filename = computeTextOutName(file.name, target);
    } else if (target === 'prisma') {
      output = irToPrisma(ir);
      pre.textContent = output;
      preview.style.display = 'block';
      copyBtn.style.display = '';
      dlBtn.style.display = '';
      dlBtn.dataset.filename = computeTextOutName(file.name, target);
    } else {
      pre.textContent = '';
      preview.style.display = 'block';
      copyBtn.style.display = 'none';
      dlBtn.style.display = 'none';
      const outDoc = target === 'new' ? newDoc : newToOld(newDoc);
      const name = computeOutName(file.name, target);
      download(outDoc, name);
      log(`OK → descargado como ${name}`);
      return;
    }
    if (ir.tables.length > 0 && !output.trim()) {
      log('Error: conversion produced empty output.');
    } else {
      log('Listo.');
    }
  } catch (e:any) {
    console.error(e);
    log('Error: ' + (e?.message || e));
  }
}

function setupUI() {
  const input = $('#file') as HTMLInputElement;
  const format = $('#format') as HTMLSelectElement;
  const run = $('#run') as HTMLButtonElement;
  const drop = $('#drop') as HTMLDivElement;
  const sample = $('#sample') as HTMLButtonElement;
  const copyBtn = $('#copy-out') as HTMLButtonElement;
  const dlBtn = $('#download-out') as HTMLButtonElement;
  const tabOut = $('#tab-out') as HTMLButtonElement;
  const tabLoss = $('#tab-loss') as HTMLButtonElement;
  const outPre = $('#out') as HTMLPreElement;
  const lossPre = $('#loss') as HTMLPreElement;

  run.addEventListener('click', () => {
    if (!input.files || input.files.length === 0) { log('Elegí un archivo primero.'); return; }
    handleProcess(input.files[0], format.value as any);
  });

  drop.addEventListener('dragover', e => { e.preventDefault(); drop.style.borderColor = '#22d3ee'; });
  drop.addEventListener('dragleave', () => { drop.style.borderColor = 'rgba(255,255,255,.2)'; });
  drop.addEventListener('drop', e => {
    e.preventDefault();
    drop.style.borderColor = 'rgba(255,255,255,.2)';
    const f = e.dataTransfer?.files?.[0];
    if (f) handleProcess(f, format.value as any);
  });
  drop.addEventListener('click', () => input.click());

  copyBtn.addEventListener('click', () => {
    const txt = ($('#out') as HTMLPreElement).textContent || '';
    if (!txt) { log('Nada para copiar.'); return; }
    navigator.clipboard.writeText(txt);
    log('Copiado al portapapeles.');
  });

  dlBtn.addEventListener('click', () => {
    const fmt = format.value as 'sql'|'prisma';
    const txt = ($('#out') as HTMLPreElement).textContent || '';
    if (!txt) { log('Nada para descargar.'); return; }
    const name = dlBtn.dataset.filename || `schema.${fmt}`;
    downloadText(txt, name);
    log(`Descargado como ${name}.`);
  });

  tabOut.addEventListener('click', () => {
    tabOut.classList.add('tab-active');
    tabLoss.classList.remove('tab-active');
    outPre.style.display = 'block';
    lossPre.style.display = 'none';
  });
  tabLoss.addEventListener('click', () => {
    tabLoss.classList.add('tab-active');
    tabOut.classList.remove('tab-active');
    outPre.style.display = 'none';
    lossPre.style.display = 'block';
  });

  sample.addEventListener('click', () => {
    const sampleOld = {
      version: 2, www: 'erdplus.com',
      shapes: [
        { type:'Table', details: { name:'A', x:200, y:120, sort:'automatic',
          attributes: [
            { names:['idA'], order:0, pkMember:true, optional:false, soloUnique:false, fk:false, dataType:'int', dataTypeSize:null, id:101 },
            { names:['nombre'], order:0, pkMember:false, optional:false, soloUnique:false, fk:false, dataType:'varchar', dataTypeSize:'60', id:102 }
          ], uniqueGroups:[], id:1 } },
        { type:'Table', details: { name:'B', x:520, y:120, sort:'automatic',
          attributes: [
            { names:['idB'], order:0, pkMember:true, optional:false, soloUnique:false, fk:false, dataType:'int', dataTypeSize:null, id:201 },
            { names:['idA'], order:1, pkMember:false, optional:false, soloUnique:false, fk:true, dataType:'int', dataTypeSize:null,
              references: [{ tableId:1, attributeId:101, fkSubIndex:0 }], id:202 }
          ], uniqueGroups:[], id:2 } }
      ],
      connectors: [
        { type:'TableConnector', source:2, destination:1, details:{ fkAttributeId:202, id:9001 } }
      ],
      width: 1600, height: 900
    };
    const f = new File([JSON.stringify(sampleOld)], 'sample-old.erdplus', { type:'application/json' });
    handleProcess(f, format.value as any);
  });
}

setupUI();
