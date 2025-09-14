import type { IRDiagram, IRTable, IRColumn } from './ir';

// Migration plan types
export interface MigrationOperation {
  type: 'addTable' | 'dropTable' | 'addColumn' | 'dropColumn' | 'alterColumn' | 'renameColumn' | 'renameTable' | 'addIndex' | 'dropIndex' | 'addForeignKey' | 'dropForeignKey';
  table: string;
  column?: string;
  newName?: string;
  columnDef?: IRColumn;
  tableDef?: IRTable; // For addTable operations
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
  
  // Use case-insensitive matching for table names to handle different naming conventions
  const oldTables = new Map(oldDiagram.tables.map(t => [t.name.toLowerCase(), t]));
  const newTables = new Map(newDiagram.tables.map(t => [t.name.toLowerCase(), t]));

  // Find dropped tables
  for (const [lowerTableName, table] of oldTables) {
    if (!newTables.has(lowerTableName)) {
      operations.push({
        type: 'dropTable',
        table: table.name
      });
    }
  }

  // Find added tables
  for (const [lowerTableName, table] of newTables) {
    if (!oldTables.has(lowerTableName)) {
      operations.push({
        type: 'addTable',
        table: table.name,
        tableDef: table
      });
      continue;
    }

    // Compare existing tables
    const oldTable = oldTables.get(lowerTableName)!;
    
    // Check for table renames (different case)
    if (oldTable.name !== table.name) {
      operations.push({
        type: 'renameTable',
        table: oldTable.name,
        newName: table.name
      });
    }
    
    const tableOps = diffTable(oldTable, table);
    operations.push(...tableOps);
  }

  // Sort operations to ensure dependencies are handled correctly
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
  
  // Use both exact match and normalized match for columns
  const oldColumns = new Map(oldTable.columns.map(c => [c.name, c]));
  const oldColumnsNorm = new Map(oldTable.columns.map(c => [normalizeColumnName(c.name), c]));
  const newColumns = new Map(newTable.columns.map(c => [c.name, c]));
  const newColumnsNorm = new Map(newTable.columns.map(c => [normalizeColumnName(c.name), c]));

  // Track which columns have been processed to avoid duplicates
  const processedOldColumns = new Set<string>();
  const processedNewColumns = new Set<string>();

  // First pass: exact matches and renames
  for (const [newColName, newColumn] of newColumns) {
    const exactMatch = oldColumns.get(newColName);
    const normalizedMatch = oldColumnsNorm.get(normalizeColumnName(newColName));
    
    if (exactMatch) {
      // Exact match - check for changes
      processedOldColumns.add(exactMatch.name);
      processedNewColumns.add(newColName);
      
      if (isColumnChanged(exactMatch, newColumn)) {
        operations.push({
          type: 'alterColumn',
          table: newTable.name,
          column: newColName,
          columnDef: newColumn
        });
      }
    } else if (normalizedMatch && !processedOldColumns.has(normalizedMatch.name)) {
      // Normalized match (likely rename) - check if it's really a rename
      processedOldColumns.add(normalizedMatch.name);
      processedNewColumns.add(newColName);
      
      if (normalizedMatch.name !== newColName) {
        operations.push({
          type: 'renameColumn',
          table: newTable.name,
          column: normalizedMatch.name,
          newName: newColName
        });
      }
      
      // Also check for type/constraint changes after rename
      if (isColumnChanged(normalizedMatch, newColumn)) {
        operations.push({
          type: 'alterColumn',
          table: newTable.name,
          column: newColName,
          columnDef: newColumn
        });
      }
    }
  }

  // Second pass: dropped columns
  for (const [oldColName, oldColumn] of oldColumns) {
    if (!processedOldColumns.has(oldColName)) {
      operations.push({
        type: 'dropColumn',
        table: oldTable.name,
        column: oldColName
      });
    }
  }

  // Third pass: added columns
  for (const [newColName, newColumn] of newColumns) {
    if (!processedNewColumns.has(newColName)) {
      operations.push({
        type: 'addColumn',
        table: newTable.name,
        column: newColName,
        columnDef: newColumn
      });
    }
  }

  // Handle foreign key changes for existing columns
  handleForeignKeyChanges(oldTable, newTable, operations);

  return operations;
}

/**
 * Normalize column names to detect renames (PascalCase <-> snake_case)
 */
function normalizeColumnName(name: string): string {
  return name.toLowerCase()
    .replace(/([a-z])([A-Z])/g, '$1_$2') // PascalCase to snake_case
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2'); // Handle consecutive caps
}

/**
 * Handle foreign key changes separately
 */
function handleForeignKeyChanges(oldTable: IRTable, newTable: IRTable, operations: MigrationOperation[]) {
  const oldFKs = oldTable.columns.filter(c => c.references);
  const newFKs = newTable.columns.filter(c => c.references);
  
  // Use normalized names for FK matching
  const oldFKMap = new Map(oldFKs.map(fk => [normalizeColumnName(fk.name), fk]));
  const newFKMap = new Map(newFKs.map(fk => [normalizeColumnName(fk.name), fk]));
  
  // Find dropped foreign keys
  for (const oldFK of oldFKs) {
    const normalizedName = normalizeColumnName(oldFK.name);
    const newFK = newFKMap.get(normalizedName);
    
    if (!newFK || !newFK.references || !isReferenceEqual(oldFK.references!, newFK.references)) {
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
    const normalizedName = normalizeColumnName(newFK.name);
    const oldFK = oldFKMap.get(normalizedName);
    
    if (!oldFK || !oldFK.references || !isReferenceEqual(oldFK.references, newFK.references!)) {
      operations.push({
        type: 'addForeignKey',
        table: newTable.name,
        foreignKey: {
          column: newFK.name,
          references: newFK.references!
        }
      });
    }
  }
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