import type { NewDoc } from './types';

export interface IRColumn {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isOptional?: boolean;
  isUnique?: boolean;
  /** Raw default expression if present, e.g. `now()` or `'foo'`. */
  default?: string;
  references?: { table: string; column: string; onDelete?: string; onUpdate?: string };
}

export interface IRTable {
  name: string;
  columns: IRColumn[];
  /** Order of primary key columns for composite keys. */
  primaryKey?: string[];
  indexes?: { columns: string[]; unique?: boolean }[];
}

export interface IRDiagram {
  tables: IRTable[];
}

/**
 * Convert an ERDPlus NEW document to the canonical IR.
 * Only table/column structure and simple FK references are preserved.
 */
export function newToIR(doc: NewDoc): IRDiagram {
  const tables: IRTable[] = [];
  const tableById = new Map<string, IRTable>();
  const pkById = new Map<string, string>();

  for (const node of doc.data.nodes) {
    const table: IRTable = {
      name: node.data.label,
      columns: node.data.columns.map(col => ({
        name: col.name,
        type: col.type,
        isPrimaryKey: !!col.isPrimaryKey,
        isOptional: !!col.isOptional,
        isUnique: !!col.isUnique
      }))
    };
    tables.push(table);
    tableById.set(node.id, table);
    const pk = table.columns.find(c => c.isPrimaryKey);
    if (pk) pkById.set(node.id, pk.name);
  }

  for (const edge of doc.data.edges || []) {
    const parentTable = tableById.get(edge.target);
    const childTable = tableById.get(edge.source);
    if (!parentTable || !childTable) continue;
    const parentPk = pkById.get(edge.target) || parentTable.columns[0]?.name;
    if (!parentPk) continue;
    for (const col of edge.data.foreignKeyProps.columns) {
      const childCol = childTable.columns.find(c => c.name === col.name);
      if (childCol) {
        childCol.references = { table: parentTable.name, column: parentPk };
      }
    }
  }

  return { tables };
}

