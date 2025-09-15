import type { NewDoc } from './types';

// Enhanced IR types for Phase 3
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

// For backward compatibility, alias to new name
export interface IRAttribute extends IRColumn {}

export interface IRTable {
  name: string;
  columns: IRColumn[];
  /** Order of primary key columns for composite keys. */
  primaryKey?: string[];
  indexes?: { columns: string[]; unique?: boolean }[];
}

// For backward compatibility, alias to new name  
export interface IREntity extends IRTable {
  attributes: IRAttribute[];
  uniques?: string[][];
}

export interface IRRelation {
  name?: string;
  type: '1-1' | '1-N' | 'N-N';
  sourceEntity: string;
  targetEntity: string;
  sourceColumns: string[];
  targetColumns: string[];
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION' | 'SET DEFAULT';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION' | 'SET DEFAULT';
}

export interface IREnum {
  name: string;
  values: string[];
}

export interface IRCheck {
  name?: string;
  expression: string;
  table: string;
}

export interface IRComment {
  table?: string;
  column?: string;
  text: string;
}

export interface IRIndex {
  name?: string;
  table: string;
  columns: string[];
  unique?: boolean;
  type?: 'btree' | 'hash' | 'gin' | 'gist';
}

export interface IRSchema {
  entities: IREntity[];
  relations: IRRelation[];
  enums?: IREnum[];
  checks?: IRCheck[];
  comments?: IRComment[];
  indexes?: IRIndex[];
}

// Backward compatibility interface
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

