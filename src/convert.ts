// convert.ts — ERDPlus old ⇄ new (lossless determinístico)
import type { OldDoc, OldTable, OldAttr, OldConnector, NewDoc, NewNode, NewCol } from './types';

const nodeId = (oldId: number) => `t-${oldId}`;
const colId  = (oldTableId: number, oldAttrId: number) => `c-${oldTableId}-${oldAttrId}`;
const edgeGroupId = (childId: number, parentId: number, attrIds: number[]) =>
  `g-${childId}-${parentId}-${[...attrIds].sort((a,b)=>a-b).join('_')}`;

const typeOldToNew = (dt?: string, size?: string|null) => {
  const t = (dt||'').toLowerCase();
  if (t === 'varchar') return `VARCHAR(${size || 100})`;
  if (t === 'int' || t === 'integer') return 'INT';
  if (t === 'date') return 'DATE';
  return (dt || 'TEXT').toUpperCase();
};
const typeNewToOld = (raw: string): [string, string|null] => {
  const s = (raw||'').trim().toLowerCase();
  const m = s.match(/^varchar\((\d+)\)$/);
  if (m) return ['varchar', m[1]];
  if (s === 'int' || s === 'integer') return ['int', null];
  if (s === 'date') return ['date', ''];
  return ['varchar','255'];
};

const measuredHeight = (nCols: number) => Math.max(76, 38 + 18*nCols);

// ---------- OLD → NEW ----------
export function oldToNew(oldDoc: OldDoc): NewDoc {
  if (!oldDoc || !Array.isArray(oldDoc.shapes)) {
    throw new Error("Documento OLD inválido: falta 'shapes'");
  }
  const tableShapes = oldDoc.shapes.filter(s => s.type === 'Table');
  // índice rápido de atributos por id + tabla (ids pueden repetirse entre tablas)
  const attrById = new Map<string, { attr: OldAttr; tableId: number }>();
  for (const t of tableShapes) {
    for (const a of t.details.attributes) {
      attrById.set(`${t.details.id}-${a.id}`, { attr: a, tableId: t.details.id });
    }
  }

  // 1) tablas → nodos (con ids de columnas determinísticos)
  const nodes: NewNode[] = tableShapes.map(s => {
    const d = s.details;
    const cols: NewCol[] = d.attributes.map(a => ({
      id: colId(d.id, a.id),
      name: a.names[0],
      type: typeOldToNew(a.dataType, a.dataTypeSize),
      position: 0,
      isPrimaryKey: !!a.pkMember,
      isOptional: !!a.optional,
      isUnique: !!a.soloUnique
    }));
    return {
      id: nodeId(d.id),
      type: 'Table',
      position: { x: d.x ?? 200, y: d.y ?? 200 },
      data: { label: d.name, isConnectable: true, columns: cols, numberOfGroups: 0, isSelected: false },
      measured: { width: 240, height: measuredHeight(cols.length) },
      selected: false,
      dragging: false
    };
  });

  // 2) FKs → edges (preferir CONNECTORS; fallback a attributes.references)
  type Part = { attr: OldAttr; idx: number };
  type Group = { child:number; parent:number; parts: Part[] };
  const groups = new Map<string, Group>();

  const useConnectors = Array.isArray(oldDoc.connectors) && oldDoc.connectors.length > 0;

  if (useConnectors) {
    for (const c of oldDoc.connectors as OldConnector[]) {
      if (c.type !== 'TableConnector') continue;
      const fkAttrId = (c.details as any)?.fkAttributeId;
      const child = c.source;
      const rec = attrById.get(`${child}-${fkAttrId}`);
      if (!rec) continue;
      const parent = c.destination;          // destino = padre
      let idx = 0;
      const ref = rec.attr.references?.[0];
      if (ref && typeof ref.fkSubIndex === 'number') idx = ref.fkSubIndex;

      const key = `p-${child}-${parent}`;
      const g = groups.get(key) ?? { child, parent, parts: [] };
      g.parts.push({ attr: rec.attr, idx });
      groups.set(key, g);
    }
  } else {
    // Fallback: recorrer attributes con .fk/.references
    for (const t of tableShapes) {
      for (const a of t.details.attributes) {
        if (!a.fk || !a.references || a.references.length === 0) continue;
        const ref = a.references[0];
        const child = t.details.id;
        const parent = ref.tableId;
        const idx = (ref.fkSubIndex ?? 0);
        const key = `p-${child}-${parent}`;
        const g = groups.get(key) ?? { child, parent, parts: [] };
        g.parts.push({ attr: a, idx });
        groups.set(key, g);
      }
    }
  }

  // connectors antiguos (cuando attributes no incluyen references)
  for (const c of oldDoc.connectors || []) {
    if (c.type !== 'TableConnector') continue;
    const child = c.source;
    const parent = c.destination;
    const attrId = c.details?.fkAttributeId;
    if (attrId == null) continue;
    const entry = attrById.get(`${child}-${attrId}`);
    if (!entry) continue;
    const { attr } = entry;
    if (attr.references && attr.references.length) continue; // ya procesado
    const key = `p-${child}-${parent}`;
    const g = groups.get(key) ?? { child, parent, parts: [] };
    g.parts.push({ attr, idx: attr.id });
    groups.set(key, g);
  }

  
  const edges: NewEdge[] = [];
  for (const { child, parent, parts } of groups.values()) {
    // ordenar por fkSubIndex y por id para estabilidad
    parts.sort((x,y) => (x.idx - y.idx) || (x.attr.id - y.attr.id));

    const attrIds = parts.map(p => p.attr.id);
    const gid = edgeGroupId(child, parent, attrIds);

    const cols = parts.map(p => ({
      id: colId(child, p.attr.id),                 // ID EXACTO de la columna hija
      name: p.attr.names[0],
      type: typeOldToNew(p.attr.dataType, p.attr.dataTypeSize)
    }));

    edges.push({
      id: `${nodeId(child)}->${nodeId(parent)}_${gid}`,
      type: 'Relational',
      source: nodeId(child),                       // hijo
      target: nodeId(parent),                      // padre
      targetHandle: `foreign-key-handle-${gid}`,
      markerStart: { type: 'arrow' },
      data: {
        foreignKeyProps: {
          foreignKeyGroupId: gid,
          sourceTableId: nodeId(child),
          columns: cols
        }
      }
    });
  }

  return {
    diagramType: 2,
    data: { nodes, edges, viewport: { x: -40, y: 0, zoom: 1 } },
    name: 'imported-old',
    folder: { name: 'Diagrams', folderType: 1, depth: 0, id: 1 },
    id: 1,
    updatedAtTimestamp: Date.now()
  };
}

// ---------- NEW → OLD ----------
export function newToOld(newDoc: any): OldDoc {
  const nodes = newDoc.data.nodes || [];

  // 1) reconstruir tablas con IDs determinísticos de nodeId
  const shapes: OldTable[] = nodes.map((n: any) => {
    const oldTableId = parseInt(String(n.id).replace(/^t-/, ''), 10);
    const attrs: OldAttr[] = (n.data.columns || []).map((c: any) => {
      const m = String(c.id || '').match(/^c-(\d+)-(\d+)$/);
      const oldAttrId = m ? parseInt(m[2], 10) : Math.floor(Math.random()*1e9);
      const [dt, size] = typeNewToOld(c.type || 'varchar(255)');
      return {
        id: oldAttrId,
        names: [c.name],
        order: 0,
        pkMember: !!c.isPrimaryKey,
        optional: !!c.isOptional,
        soloUnique: !!c.isUnique,
        fk: false,
        dataType: dt,
        dataTypeSize: size
      };
    });
    return {
      type: 'Table',
      details: {
        id: oldTableId,
        name: n.data.label,
        x: n.position?.x ?? 200,
        y: n.position?.y ?? 200,
        sort: 'automatic',
        attributes: attrs,
        uniqueGroups: []
      }
    };
  });

  // índices
  const shapeById = new Map<number, OldTable>(shapes.map(s => [s.details.id, s]));
  const attrByTable = new Map<number, Map<string, OldAttr>>(
    shapes.map(s => [s.details.id, new Map(s.details.attributes.map(a => [a.names[0], a]))])
  );

  const connectors: OldConnector[] = [];

  function firstPk(parent: OldTable) {
    return parent.details.attributes.find(a => a.pkMember) ?? parent.details.attributes[0];
  }

  // 2) edges → FKs + connectors (mantener orden como fkSubIndex)
  for (const e of newDoc.data.edges || []) {
    const childOld = parseInt(String(e.source).replace(/^t-/, ''), 10);
    const parentOld = parseInt(String(e.target).replace(/^t-/, ''), 10);
    const parentShape = shapeById.get(parentOld)!;
    const pkParent = firstPk(parentShape);

    const cols = e.data?.foreignKeyProps?.columns || [];
    cols.forEach((col: any, idx: number) => {
      const a = attrByTable.get(childOld)?.get(col.name);
      if (!a) throw new Error(`No se encontró columna hija '${col.name}' en tabla ${childOld}`);
      a.fk = true;
      a.references = [{ tableId: parentOld, attributeId: pkParent.id, fkSubIndex: idx }];

      connectors.push({
        type: 'TableConnector',
        details: { fkAttributeId: a.id, id: Math.floor(Math.random()*1e9) },
        source: childOld,         // hijo
        destination: parentOld    // padre
      });
    });
  }

  return {
    version: 2, www: 'erdplus.com',
    shapes, connectors, width: 2000, height: 1600
  };
}
