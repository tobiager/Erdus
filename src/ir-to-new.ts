import { IRDiagram } from './ir';
import type { NewDoc, NewNode, NewEdge, NewCol } from './types';

/** Build a minimal ERDPlus NEW document from the canonical IR */
export function irToNew(ir: IRDiagram): NewDoc {
  const nodes: NewNode[] = [];
  const edges: NewEdge[] = [];
  const tableIds = new Map<string, string>();
  let t = 1;
  for (const table of ir.tables) {
    const id = `t-${t++}`;
    tableIds.set(table.name, id);
    let c = 1;
    const cols: NewCol[] = table.columns.map(col => ({
      id: `${id}-${c++}`,
      name: col.name,
      type: col.type,
      position: 0,
      isPrimaryKey: col.isPrimaryKey,
      isOptional: col.isOptional,
      isUnique: col.isUnique
    }));
    nodes.push({
      id,
      type: 'Table',
      position: { x: t * 300, y: 100 },
      data: { label: table.name, isConnectable: true, columns: cols, numberOfGroups: 0, isSelected: false },
      measured: { width: 240, height: Math.max(76, 38 + 18 * cols.length) },
      selected: false,
      dragging: false
    });
  }
  for (const table of ir.tables) {
    const sourceId = tableIds.get(table.name)!;
    const node = nodes.find(n => n.id === sourceId)!;
    for (const col of node.data.columns) {
      const original = table.columns.find(c => c.name === col.name);
      if (original?.references) {
        const targetId = tableIds.get(original.references.table)!;
        const gid = `g-${sourceId}-${targetId}-${col.id}`;
        edges.push({
          id: `${sourceId}->${targetId}_${gid}`,
          type: 'Relational',
          source: sourceId,
          target: targetId,
          targetHandle: `foreign-key-handle-${gid}`,
          markerStart: { type: 'arrow' },
          data: {
            foreignKeyProps: {
              foreignKeyGroupId: gid,
              sourceTableId: sourceId,
              columns: [{ id: col.id, name: col.name, type: col.type }]
            }
          }
        });
      }
    }
  }
  return {
    diagramType: 2,
    data: { nodes, edges, viewport: { x: 0, y: 0, zoom: 1 } },
    name: 'from-ir',
    folder: { name: 'Diagrams', folderType: 1, depth: 0, id: 1 },
    id: 1,
    updatedAtTimestamp: 0
  };
}
