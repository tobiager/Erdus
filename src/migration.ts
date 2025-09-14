import type { IRDiagram, IRTable, IRColumn } from './ir';

// Migration plan types
export interface MigrationOperation {
  type: 'addTable' | 'dropTable' | 'addColumn' | 'dropColumn' | 'alterColumn' | 'renameColumn' | 'renameTable' | 'addIndex' | 'dropIndex' | 'addForeignKey' | 'dropForeignKey';
  table: string;
  column?: string;
  newName?: string;
  columnDef?: IRColumn;
  indexDef?: { columns: string[]; unique?: boolean };
  foreignKey?: { column: string; references: { table: string; column: string; onDelete?: string; onUpdate?: string } };
}

export interface MigrationPlan {
  operations: MigrationOperation[];
  version: string;
}

/**
 * Compare two IR diagrams and generate a migration plan
 */
export function diffIR(oldDiagram: IRDiagram, newDiagram: IRDiagram): MigrationPlan {
  const operations: MigrationOperation[] = [];
  
  const oldTables = new Map(oldDiagram.tables.map(t => [t.name, t]));
  const newTables = new Map(newDiagram.tables.map(t => [t.name, t]));

  // Find dropped tables
  for (const [tableName, table] of oldTables) {
    if (!newTables.has(tableName)) {
      operations.push({
        type: 'dropTable',
        table: tableName
      });
    }
  }

  // Find added tables
  for (const [tableName, table] of newTables) {
    if (!oldTables.has(tableName)) {
      operations.push({
        type: 'addTable',
        table: tableName,
        columnDef: undefined // Will be handled by table creation
      });
      continue;
    }

    // Compare existing tables
    const oldTable = oldTables.get(tableName)!;
    const tableOps = diffTable(oldTable, table);
    operations.push(...tableOps);
  }

  // Sort operations to ensure dependencies are handled correctly
  // 1. Drop foreign keys first
  // 2. Drop columns/tables  
  // 3. Add tables
  // 4. Add columns
  // 5. Add foreign keys
  const sortedOps = sortOperations(operations);

  return {
    operations: sortedOps,
    version: '1.0'
  };
}

/**
 * Compare two tables and generate column-level operations
 */
function diffTable(oldTable: IRTable, newTable: IRTable): MigrationOperation[] {
  const operations: MigrationOperation[] = [];
  
  const oldColumns = new Map(oldTable.columns.map(c => [c.name, c]));
  const newColumns = new Map(newTable.columns.map(c => [c.name, c]));

  // Find dropped columns
  for (const [colName, column] of oldColumns) {
    if (!newColumns.has(colName)) {
      // Check if this might be a rename (simple heuristic: same type, similar position)
      const possibleRename = findPossibleRename(column, newColumns, oldColumns);
      if (possibleRename) {
        operations.push({
          type: 'renameColumn',
          table: oldTable.name,
          column: colName,
          newName: possibleRename
        });
        continue;
      }
      
      operations.push({
        type: 'dropColumn',
        table: oldTable.name,
        column: colName
      });
    }
  }

  // Find added columns
  for (const [colName, column] of newColumns) {
    if (!oldColumns.has(colName)) {
      operations.push({
        type: 'addColumn',
        table: oldTable.name,
        column: colName,
        columnDef: column
      });
    }
  }

  // Find altered columns
  for (const [colName, newColumn] of newColumns) {
    const oldColumn = oldColumns.get(colName);
    if (oldColumn && isColumnChanged(oldColumn, newColumn)) {
      operations.push({
        type: 'alterColumn',
        table: oldTable.name,
        column: colName,
        columnDef: newColumn
      });
    }
  }

  // Handle foreign key changes
  const oldFKs = oldTable.columns.filter(c => c.references);
  const newFKs = newTable.columns.filter(c => c.references);
  
  // Find dropped foreign keys
  for (const oldFK of oldFKs) {
    const newFK = newColumns.get(oldFK.name);
    if (!newFK || !newFK.references || !isReferenceEqual(oldFK.references, newFK.references)) {
      operations.push({
        type: 'dropForeignKey',
        table: oldTable.name,
        foreignKey: {
          column: oldFK.name,
          references: oldFK.references!
        }
      });
    }
  }

  // Find added foreign keys
  for (const newFK of newFKs) {
    const oldFK = oldColumns.get(newFK.name);
    if (!oldFK || !oldFK.references || !isReferenceEqual(oldFK.references, newFK.references)) {
      operations.push({
        type: 'addForeignKey',
        table: oldTable.name,
        foreignKey: {
          column: newFK.name,
          references: newFK.references!
        }
      });
    }
  }

  return operations;
}

/**
 * Simple heuristic to detect column renames
 */
function findPossibleRename(
  droppedColumn: IRColumn, 
  newColumns: Map<string, IRColumn>, 
  oldColumns: Map<string, IRColumn>
): string | null {
  // Look for a new column with same type and similar constraints
  for (const [newName, newCol] of newColumns) {
    if (oldColumns.has(newName)) continue; // This column already exists
    
    if (newCol.type === droppedColumn.type &&
        newCol.isPrimaryKey === droppedColumn.isPrimaryKey &&
        newCol.isOptional === droppedColumn.isOptional &&
        newCol.isUnique === droppedColumn.isUnique) {
      return newName;
    }
  }
  return null;
}

/**
 * Check if a column definition has changed
 */
function isColumnChanged(oldCol: IRColumn, newCol: IRColumn): boolean {
  return oldCol.type !== newCol.type ||
         oldCol.isPrimaryKey !== newCol.isPrimaryKey ||
         oldCol.isOptional !== newCol.isOptional ||
         oldCol.isUnique !== newCol.isUnique ||
         oldCol.default !== newCol.default;
}

/**
 * Check if two foreign key references are equal
 */
function isReferenceEqual(
  ref1: { table: string; column: string; onDelete?: string; onUpdate?: string },
  ref2: { table: string; column: string; onDelete?: string; onUpdate?: string }
): boolean {
  return ref1.table === ref2.table &&
         ref1.column === ref2.column &&
         ref1.onDelete === ref2.onDelete &&
         ref1.onUpdate === ref2.onUpdate;
}

/**
 * Sort operations to handle dependencies correctly
 */
function sortOperations(operations: MigrationOperation[]): MigrationOperation[] {
  const priority = {
    'dropForeignKey': 1,
    'dropIndex': 2,
    'dropColumn': 3,
    'dropTable': 4,
    'addTable': 5,
    'addColumn': 6,
    'alterColumn': 7,
    'renameColumn': 8,
    'renameTable': 9,
    'addIndex': 10,
    'addForeignKey': 11
  };

  return operations.sort((a, b) => priority[a.type] - priority[b.type]);
}