import { oldToNew, newToOld } from './convert';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;

const log = (msg: string) => { ($('#log') as HTMLDivElement).textContent = msg; };

function detectFormat(obj: any): 'old'|'new' {
  if (obj && obj.version === 2 && obj.www === 'erdplus.com' && Array.isArray(obj.shapes)) return 'old';
  if (obj && obj.diagramType === 2 && obj.data && Array.isArray(obj.data.nodes)) return 'new';
  throw new Error('No parece ERDPlus old ni new.');
}

function computeOutName(inputName: string, to: 'old'|'new'): string {
  const ext = '.erdplus';
  const base = inputName.endsWith(ext) ? inputName.slice(0, -ext.length) : inputName.replace(/\.(json)$/i, '');
  const clean = base.replace(/-(old|new)$/i, '');
  return `${clean}-${to}${ext}`;
}

async function readFile(file: File): Promise<any> {
  const text = await file.text();
  return JSON.parse(text);
}

function download(obj: any, name: string) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function handleConvert(file: File) {
  try {
    log(`Leyendo ${file.name}…`);
    const data = await readFile(file);
    const fmt = detectFormat(data);
    log(`Formato detectado: ${fmt.toUpperCase()}. Convirtiendo…`);

    if (fmt === 'old') {
      const out = oldToNew(data);
      const name = computeOutName(file.name, 'new');
      download(out, name);
      log(`OK → descargado como ${name}`);
    } else {
      const out = newToOld(data);
      const name = computeOutName(file.name, 'old');
      download(out, name);
      log(`OK → descargado como ${name}`);
    }
  } catch (e: any) {
    console.error(e);
    log('Error: ' + (e?.message || e));
  }
}

function setupUI() {
  const input = document.getElementById('file') as HTMLInputElement;
  const btn = document.getElementById('convert') as HTMLButtonElement;
  const drop = document.getElementById('drop') as HTMLDivElement;
  const sample = document.getElementById('sample') as HTMLButtonElement;

  btn.addEventListener('click', () => {
    if (!input.files || input.files.length === 0) { log('Elegí un archivo primero.'); return; }
    handleConvert(input.files[0]);
  });

  drop.addEventListener('dragover', e => { e.preventDefault(); drop.style.borderColor = '#22d3ee'; });
  drop.addEventListener('dragleave', () => { drop.style.borderColor = 'rgba(255,255,255,.2)'; });
  drop.addEventListener('drop', e => {
    e.preventDefault();
    drop.style.borderColor = 'rgba(255,255,255,.2)';
    const f = e.dataTransfer?.files?.[0];
    if (f) handleConvert(f);
  });
  drop.addEventListener('click', () => input.click());

  sample.addEventListener('click', async () => {
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
    handleConvert(f);
  });
}

setupUI();
