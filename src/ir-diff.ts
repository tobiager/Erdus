import type { IRDiagram, IRTable, IRColumn } from './ir';

interface SchemaDiff {
  tablesToAdd: IRTable[];
  tablesToDrop: string[];
  tablesToModify: TableModification[];
}

interface TableModification {
  tableName: string;
  columnsToAdd: IRColumn[];
  columnsToDrop: string[];
  columnsToModify: ColumnModification[];
  indexesToAdd: { columns: string[]; unique?: boolean }[];
  indexesToDrop: string[];
  constraintsToAdd: ConstraintToAdd[];
  constraintsToRemove: string[];
}

interface ColumnModification {
  columnName: string;
  oldColumn: IRColumn;
  newColumn: IRColumn;
  changes: ColumnChange[];
}

interface ColumnChange {
  type: 'TYPE_CHANGE' | 'NULL_CHANGE' | 'DEFAULT_CHANGE' | 'UNIQUE_CHANGE' | 'FK_CHANGE';
  oldValue?: any;
  newValue?: any;
}

interface ConstraintToAdd {
  type: 'PRIMARY_KEY' | 'FOREIGN_KEY' | 'UNIQUE' | 'INDEX';
  columnNames: string[];
  referencedTable?: string;
  referencedColumns?: string[];
  onUpdate?: string;
  onDelete?: string;
  unique?: boolean;
}

/**
 * Compare two IR diagrams and generate a schema diff.
 */
function compareSchemas(oldDiagram: IRDiagram, newDiagram: IRDiagram): SchemaDiff {
  const diff: SchemaDiff = {
    tablesToAdd: [],
    tablesToDrop: [],
    tablesToModify: []
  };

  const oldTableMap = new Map<string, IRTable>(oldDiagram.tables.map(t => [t.name, t]));
  const newTableMap = new Map<string, IRTable>(newDiagram.tables.map(t => [t.name, t]));

  // Find tables to add
  for (const newTable of newDiagram.tables) {
    if (!oldTableMap.has(newTable.name)) {
      diff.tablesToAdd.push(newTable);
    }
  }

  // Find tables to drop
  for (const oldTable of oldDiagram.tables) {
    if (!newTableMap.has(oldTable.name)) {
      diff.tablesToDrop.push(oldTable.name);
    }
  }

  // Find tables to modify
  for (const newTable of newDiagram.tables) {
    const oldTable = oldTableMap.get(newTable.name);
    if (oldTable) {
      const tableModification = compareTable(oldTable, newTable);
      if (hasChanges(tableModification)) {
        diff.tablesToModify.push(tableModification);
      }
    }
  }

  return diff;
}

function compareTable(oldTable: IRTable, newTable: IRTable): TableModification {
  const modification: TableModification = {
    tableName: newTable.name,
    columnsToAdd: [],
    columnsToDrop: [],
    columnsToModify: [],
    indexesToAdd: [],
    indexesToDrop: [],
    constraintsToAdd: [],
    constraintsToRemove: []
  };

  const oldColumnMap = new Map<string, IRColumn>(oldTable.columns.map(c => [c.name, c]));
  const newColumnMap = new Map<string, IRColumn>(newTable.columns.map(c => [c.name, c]));

  // Find columns to add
  for (const newColumn of newTable.columns) {
    if (!oldColumnMap.has(newColumn.name)) {
      modification.columnsToAdd.push(newColumn);
    }
  }

  // Find columns to drop
  for (const oldColumn of oldTable.columns) {
    if (!newColumnMap.has(oldColumn.name)) {
      modification.columnsToDrop.push(oldColumn.name);
    }
  }

  // Find columns to modify
  for (const newColumn of newTable.columns) {
    const oldColumn = oldColumnMap.get(newColumn.name);
    if (oldColumn) {
      const columnChanges = compareColumn(oldColumn, newColumn);
      if (columnChanges.length > 0) {
        modification.columnsToModify.push({
          columnName: newColumn.name,
          oldColumn,
          newColumn,
          changes: columnChanges
        });
      }
    }
  }

  // Compare indexes
  const oldIndexes = oldTable.indexes || [];
  const newIndexes = newTable.indexes || [];
  
  const oldIndexSet = new Set(oldIndexes.map(idx => JSON.stringify({ columns: idx.columns.sort(), unique: idx.unique })));
  const newIndexSet = new Set(newIndexes.map(idx => JSON.stringify({ columns: idx.columns.sort(), unique: idx.unique })));

  for (const newIndex of newIndexes) {
    const indexKey = JSON.stringify({ columns: newIndex.columns.sort(), unique: newIndex.unique });
    if (!oldIndexSet.has(indexKey)) {
      modification.indexesToAdd.push(newIndex);
    }
  }

  for (const oldIndex of oldIndexes) {
    const indexKey = JSON.stringify({ columns: oldIndex.columns.sort(), unique: oldIndex.unique });
    if (!newIndexSet.has(indexKey)) {
      const indexName = `idx_${oldTable.name}_${oldIndex.columns.join('_')}`;
      modification.indexesToDrop.push(indexName);
    }
  }

  return modification;
}

function compareColumn(oldColumn: IRColumn, newColumn: IRColumn): ColumnChange[] {
  const changes: ColumnChange[] = [];

  // Type change
  if (oldColumn.type !== newColumn.type) {
    changes.push({
      type: 'TYPE_CHANGE',
      oldValue: oldColumn.type,
      newValue: newColumn.type
    });
  }

  // Nullable change
  if (!!oldColumn.isOptional !== !!newColumn.isOptional) {
    changes.push({
      type: 'NULL_CHANGE',
      oldValue: !!oldColumn.isOptional,
      newValue: !!newColumn.isOptional
    });
  }

  // Default value change
  if (oldColumn.default !== newColumn.default) {
    changes.push({
      type: 'DEFAULT_CHANGE',
      oldValue: oldColumn.default,
      newValue: newColumn.default
    });
  }

  // Unique constraint change
  if (!!oldColumn.isUnique !== !!newColumn.isUnique) {
    changes.push({
      type: 'UNIQUE_CHANGE',
      oldValue: !!oldColumn.isUnique,
      newValue: !!newColumn.isUnique
    });
  }

  // Foreign key change
  const oldFK = oldColumn.references;
  const newFK = newColumn.references;
  if (JSON.stringify(oldFK) !== JSON.stringify(newFK)) {
    changes.push({
      type: 'FK_CHANGE',
      oldValue: oldFK,
      newValue: newFK
    });
  }

  return changes;
}

function hasChanges(tableModification: TableModification): boolean {
  return tableModification.columnsToAdd.length > 0 ||
         tableModification.columnsToDrop.length > 0 ||
         tableModification.columnsToModify.length > 0 ||
         tableModification.indexesToAdd.length > 0 ||
         tableModification.indexesToDrop.length > 0 ||
         tableModification.constraintsToAdd.length > 0 ||
         tableModification.constraintsToRemove.length > 0;
}

function mapSqlType(type: string): string {
  const upperType = type.toUpperCase();
  
  // Integer types
  if (upperType.startsWith('BIGINT') || upperType === 'BIGSERIAL') {
    return 'BIGINT';
  }
  if (upperType.startsWith('SMALLINT')) {
    return 'SMALLINT';
  }
  if (upperType.startsWith('INT') || upperType === 'INTEGER' || upperType === 'SERIAL') {
    return 'INTEGER';
  }
  
  // Return as-is for other types (may need expansion)
  return type;
}

/**
 * Generate SQL ALTER script from schema diff.
 */
function generateMigrationScript(diff: SchemaDiff): string {
  const statements: string[] = [];
  
  statements.push('-- Migration Script');
  statements.push('-- Generated from schema diff');
  statements.push('');
  statements.push('BEGIN;');
  statements.push('');

  // Drop tables first (to handle dependencies)
  for (const tableName of diff.tablesToDrop) {
    statements.push(`DROP TABLE IF EXISTS ${tableName} CASCADE;`);
  }
  
  if (diff.tablesToDrop.length > 0) {
    statements.push('');
  }

  // Create new tables
  for (const table of diff.tablesToAdd) {
    const columnDefs: string[] = [];
    const constraints: string[] = [];

    for (const column of table.columns) {
      const columnDef: string[] = [];
      columnDef.push(column.name);
      columnDef.push(mapSqlType(column.type));

      if (column.isPrimaryKey) {
        columnDef.push('PRIMARY KEY');
      }

      if (!column.isOptional && !column.isPrimaryKey) {
        columnDef.push('NOT NULL');
      }

      if (column.isUnique && !column.isPrimaryKey) {
        columnDef.push('UNIQUE');
      }

      if (column.default && !column.type.toUpperCase().includes('SERIAL')) {
        columnDef.push(`DEFAULT ${column.default}`);
      }

      columnDefs.push('  ' + columnDef.join(' '));
    }

    // Add foreign key constraints
    for (const column of table.columns) {
      if (column.references) {
        let fkConstraint = `  FOREIGN KEY (${column.name}) REFERENCES ${column.references.table}(${column.references.column})`;
        
        if (column.references.onUpdate) {
          fkConstraint += ` ON UPDATE ${column.references.onUpdate}`;
        }
        
        if (column.references.onDelete) {
          fkConstraint += ` ON DELETE ${column.references.onDelete}`;
        }
        
        constraints.push(fkConstraint);
      }
    }

    const allElements = [...columnDefs, ...constraints];

    statements.push(`CREATE TABLE ${table.name} (`);
    statements.push(allElements.join(',\n'));
    statements.push(');');
    statements.push('');

    // Add indexes
    if (table.indexes) {
      for (const index of table.indexes) {
        if (!index.unique) {
          const indexName = `idx_${table.name}_${index.columns.join('_')}`;
          statements.push(`CREATE INDEX ${indexName} ON ${table.name} (${index.columns.join(', ')});`);
        } else if (index.columns.length > 1) {
          const indexName = `idx_${table.name}_${index.columns.join('_')}_unique`;
          statements.push(`CREATE UNIQUE INDEX ${indexName} ON ${table.name} (${index.columns.join(', ')});`);
        }
      }
    }
  }

  // Modify existing tables
  for (const modification of diff.tablesToModify) {
    const tableName = modification.tableName;

    // Drop indexes first
    for (const indexName of modification.indexesToDrop) {
      statements.push(`DROP INDEX IF EXISTS ${indexName};`);
    }

    // Drop columns
    for (const columnName of modification.columnsToDrop) {
      statements.push(`ALTER TABLE ${tableName} DROP COLUMN IF EXISTS ${columnName};`);
    }

    // Modify columns
    for (const columnMod of modification.columnsToModify) {
      for (const change of columnMod.changes) {
        switch (change.type) {
          case 'TYPE_CHANGE':
            statements.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnMod.columnName} TYPE ${mapSqlType(change.newValue)};`);
            break;
          case 'NULL_CHANGE':
            if (change.newValue) {
              statements.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnMod.columnName} DROP NOT NULL;`);
            } else {
              statements.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnMod.columnName} SET NOT NULL;`);
            }
            break;
          case 'DEFAULT_CHANGE':
            if (change.newValue) {
              statements.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnMod.columnName} SET DEFAULT ${change.newValue};`);
            } else {
              statements.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnMod.columnName} DROP DEFAULT;`);
            }
            break;
          case 'FK_CHANGE':
            // Handle foreign key changes
            if (change.oldValue) {
              statements.push(`ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS ${tableName}_${columnMod.columnName}_fkey;`);
            }
            if (change.newValue) {
              const fk = change.newValue;
              let fkStatement = `ALTER TABLE ${tableName} ADD CONSTRAINT ${tableName}_${columnMod.columnName}_fkey FOREIGN KEY (${columnMod.columnName}) REFERENCES ${fk.table}(${fk.column})`;
              if (fk.onUpdate) fkStatement += ` ON UPDATE ${fk.onUpdate}`;
              if (fk.onDelete) fkStatement += ` ON DELETE ${fk.onDelete}`;
              statements.push(fkStatement + ';');
            }
            break;
        }
      }
    }

    // Add columns
    for (const column of modification.columnsToAdd) {
      const columnDef: string[] = [];
      columnDef.push(mapSqlType(column.type));

      if (!column.isOptional && !column.isPrimaryKey) {
        columnDef.push('NOT NULL');
      }

      if (column.isUnique && !column.isPrimaryKey) {
        columnDef.push('UNIQUE');
      }

      if (column.default && !column.type.toUpperCase().includes('SERIAL')) {
        columnDef.push(`DEFAULT ${column.default}`);
      }

      statements.push(`ALTER TABLE ${tableName} ADD COLUMN ${column.name} ${columnDef.join(' ')};`);

      // Add foreign key constraint if needed
      if (column.references) {
        let fkStatement = `ALTER TABLE ${tableName} ADD CONSTRAINT ${tableName}_${column.name}_fkey FOREIGN KEY (${column.name}) REFERENCES ${column.references.table}(${column.references.column})`;
        if (column.references.onUpdate) fkStatement += ` ON UPDATE ${column.references.onUpdate}`;
        if (column.references.onDelete) fkStatement += ` ON DELETE ${column.references.onDelete}`;
        statements.push(fkStatement + ';');
      }
    }

    // Add indexes
    for (const index of modification.indexesToAdd) {
      if (!index.unique) {
        const indexName = `idx_${tableName}_${index.columns.join('_')}`;
        statements.push(`CREATE INDEX ${indexName} ON ${tableName} (${index.columns.join(', ')});`);
      } else {
        const indexName = `idx_${tableName}_${index.columns.join('_')}_unique`;
        statements.push(`CREATE UNIQUE INDEX ${indexName} ON ${tableName} (${index.columns.join(', ')});`);
      }
    }

    statements.push('');
  }

  statements.push('COMMIT;');
  
  return statements.join('\n');
}

/**
 * Compare two IR diagrams and generate SQL ALTER migration script.
 */
export function generateSchemaMigration(oldDiagram: IRDiagram, newDiagram: IRDiagram): string {
  const diff = compareSchemas(oldDiagram, newDiagram);
  return generateMigrationScript(diff);
}

/**
 * Get a human-readable summary of changes between two schemas.
 */
export function getSchemaDiffSummary(oldDiagram: IRDiagram, newDiagram: IRDiagram): string {
  const diff = compareSchemas(oldDiagram, newDiagram);
  const summary: string[] = [];

  if (diff.tablesToAdd.length > 0) {
    summary.push(`Tables to add: ${diff.tablesToAdd.map(t => t.name).join(', ')}`);
  }

  if (diff.tablesToDrop.length > 0) {
    summary.push(`Tables to drop: ${diff.tablesToDrop.join(', ')}`);
  }

  if (diff.tablesToModify.length > 0) {
    summary.push(`Tables to modify: ${diff.tablesToModify.map(t => t.tableName).join(', ')}`);
    
    for (const mod of diff.tablesToModify) {
      if (mod.columnsToAdd.length > 0) {
        summary.push(`  ${mod.tableName}: Add columns ${mod.columnsToAdd.map(c => c.name).join(', ')}`);
      }
      if (mod.columnsToDrop.length > 0) {
        summary.push(`  ${mod.tableName}: Drop columns ${mod.columnsToDrop.join(', ')}`);
      }
      if (mod.columnsToModify.length > 0) {
        summary.push(`  ${mod.tableName}: Modify columns ${mod.columnsToModify.map(c => c.columnName).join(', ')}`);
      }
    }
  }

  if (summary.length === 0) {
    return 'No changes detected';
  }

  return summary.join('\n');
}