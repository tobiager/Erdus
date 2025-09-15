import type { IRSchema, IREntity, IRAttribute } from '../ir';
import { validateIRSchema } from '../ir/validators';

export interface MigrationPlan {
  operations: MigrationOperation[];
}

export type MigrationOperation = 
  | CreateTableOperation
  | DropTableOperation
  | AddColumnOperation
  | DropColumnOperation
  | AlterColumnOperation
  | CreateIndexOperation
  | DropIndexOperation
  | AddForeignKeyOperation
  | DropForeignKeyOperation
  | RenameTableOperation
  | RenameColumnOperation;

export interface CreateTableOperation {
  type: 'create_table';
  entity: IREntity;
}

export interface DropTableOperation {
  type: 'drop_table';
  tableName: string;
}

export interface AddColumnOperation {
  type: 'add_column';
  tableName: string;
  column: IRAttribute;
}

export interface DropColumnOperation {
  type: 'drop_column';
  tableName: string;
  columnName: string;
}

export interface AlterColumnOperation {
  type: 'alter_column';
  tableName: string;
  columnName: string;
  changes: {
    type?: { from: string; to: string };
    nullable?: { from: boolean; to: boolean };
    default?: { from?: string; to?: string };
  };
}

export interface CreateIndexOperation {
  type: 'create_index';
  tableName: string;
  index: { columns: string[]; unique?: boolean };
}

export interface DropIndexOperation {
  type: 'drop_index';
  tableName: string;
  indexName: string;
}

export interface AddForeignKeyOperation {
  type: 'add_foreign_key';
  tableName: string;
  columnName: string;
  references: { table: string; column: string; onDelete?: string; onUpdate?: string };
}

export interface DropForeignKeyOperation {
  type: 'drop_foreign_key';
  tableName: string;
  columnName: string;
}

export interface RenameTableOperation {
  type: 'rename_table';
  from: string;
  to: string;
}

export interface RenameColumnOperation {
  type: 'rename_column';
  tableName: string;
  from: string;
  to: string;
}

/**
 * Compare two IR schemas and generate a migration plan
 */
export function diffSchemas(a: IRSchema, b: IRSchema): MigrationPlan {
  const schemaA = validateIRSchema(a);
  const schemaB = validateIRSchema(b);
  
  const operations: MigrationOperation[] = [];
  
  // Create maps for efficient lookups
  const entitiesA = new Map(schemaA.entities.map(e => [e.name, e]));
  const entitiesB = new Map(schemaB.entities.map(e => [e.name, e]));
  
  // Find table operations
  const tableOps = diffTables(entitiesA, entitiesB);
  operations.push(...tableOps);
  
  // Find column operations for existing tables
  for (const [tableName, entityB] of entitiesB) {
    const entityA = entitiesA.get(tableName);
    if (entityA) {
      const columnOps = diffColumns(entityA, entityB);
      operations.push(...columnOps);
    }
  }
  
  // Find index operations
  for (const [tableName, entityB] of entitiesB) {
    const entityA = entitiesA.get(tableName);
    if (entityA) {
      const indexOps = diffIndexes(entityA, entityB);
      operations.push(...indexOps);
    }
  }
  
  // Find foreign key operations
  for (const [tableName, entityB] of entitiesB) {
    const entityA = entitiesA.get(tableName);
    if (entityA) {
      const fkOps = diffForeignKeys(entityA, entityB);
      operations.push(...fkOps);
    }
  }
  
  return { operations };
}

function diffTables(
  entitiesA: Map<string, IREntity>,
  entitiesB: Map<string, IREntity>
): MigrationOperation[] {
  const operations: MigrationOperation[] = [];
  
  // Find new tables (in B but not in A)
  for (const [tableName, entityB] of entitiesB) {
    if (!entitiesA.has(tableName)) {
      operations.push({
        type: 'create_table',
        entity: entityB
      });
    }
  }
  
  // Find dropped tables (in A but not in B)
  for (const tableName of entitiesA.keys()) {
    if (!entitiesB.has(tableName)) {
      operations.push({
        type: 'drop_table',
        tableName
      });
    }
  }
  
  return operations;
}

function diffColumns(entityA: IREntity, entityB: IREntity): MigrationOperation[] {
  const operations: MigrationOperation[] = [];
  
  const columnsA = new Map((entityA.attributes || entityA.columns).map(c => [c.name, c]));
  const columnsB = new Map((entityB.attributes || entityB.columns).map(c => [c.name, c]));
  
  // Find new columns
  for (const [columnName, columnB] of columnsB) {
    if (!columnsA.has(columnName)) {
      operations.push({
        type: 'add_column',
        tableName: entityB.name,
        column: columnB
      });
    }
  }
  
  // Find dropped columns
  for (const columnName of columnsA.keys()) {
    if (!columnsB.has(columnName)) {
      operations.push({
        type: 'drop_column',
        tableName: entityA.name,
        columnName
      });
    }
  }
  
  // Find altered columns
  for (const [columnName, columnB] of columnsB) {
    const columnA = columnsA.get(columnName);
    if (columnA) {
      const changes = getColumnChanges(columnA, columnB);
      if (Object.keys(changes).length > 0) {
        operations.push({
          type: 'alter_column',
          tableName: entityB.name,
          columnName,
          changes
        });
      }
    }
  }
  
  return operations;
}

function getColumnChanges(columnA: IRAttribute, columnB: IRAttribute): AlterColumnOperation['changes'] {
  const changes: AlterColumnOperation['changes'] = {};
  
  // Type change
  if (normalizeType(columnA.type) !== normalizeType(columnB.type)) {
    changes.type = { from: columnA.type, to: columnB.type };
  }
  
  // Nullability change
  if (columnA.isOptional !== columnB.isOptional) {
    changes.nullable = { 
      from: !!columnA.isOptional, 
      to: !!columnB.isOptional 
    };
  }
  
  // Default value change
  if (columnA.default !== columnB.default) {
    changes.default = { 
      from: columnA.default, 
      to: columnB.default 
    };
  }
  
  return changes;
}

function normalizeType(type: string): string {
  return type.toLowerCase().trim();
}

function diffIndexes(entityA: IREntity, entityB: IREntity): MigrationOperation[] {
  const operations: MigrationOperation[] = [];
  
  const indexesA = entityA.indexes || [];
  const indexesB = entityB.indexes || [];
  
  // Simple approach: compare by column sets
  const indexSetA = new Set(indexesA.map(idx => JSON.stringify(idx.columns.sort())));
  const indexSetB = new Set(indexesB.map(idx => JSON.stringify(idx.columns.sort())));
  
  // Find new indexes
  for (const idx of indexesB) {
    const key = JSON.stringify(idx.columns.sort());
    if (!indexSetA.has(key)) {
      operations.push({
        type: 'create_index',
        tableName: entityB.name,
        index: idx
      });
    }
  }
  
  // Find dropped indexes
  for (const idx of indexesA) {
    const key = JSON.stringify(idx.columns.sort());
    if (!indexSetB.has(key)) {
      const indexName = `idx_${entityA.name}_${idx.columns.join('_')}`;
      operations.push({
        type: 'drop_index',
        tableName: entityA.name,
        indexName
      });
    }
  }
  
  return operations;
}

function diffForeignKeys(entityA: IREntity, entityB: IREntity): MigrationOperation[] {
  const operations: MigrationOperation[] = [];
  
  const fkA = (entityA.attributes || entityA.columns).filter(c => c.references);
  const fkB = (entityB.attributes || entityB.columns).filter(c => c.references);
  
  const fkMapA = new Map(fkA.map(c => [c.name, c.references!]));
  const fkMapB = new Map(fkB.map(c => [c.name, c.references!]));
  
  // Find new foreign keys
  for (const [columnName, references] of fkMapB) {
    if (!fkMapA.has(columnName)) {
      operations.push({
        type: 'add_foreign_key',
        tableName: entityB.name,
        columnName,
        references
      });
    }
  }
  
  // Find dropped foreign keys
  for (const columnName of fkMapA.keys()) {
    if (!fkMapB.has(columnName)) {
      operations.push({
        type: 'drop_foreign_key',
        tableName: entityA.name,
        columnName
      });
    }
  }
  
  return operations;
}

/**
 * Convert migration plan to SQL ALTER statements
 */
export function emitAlterSQL(
  plan: MigrationPlan,
  options: { schema?: string } = {}
): string {
  const { schema = 'public' } = options;
  const schemaPrefix = schema !== 'public' ? `${schema}.` : '';
  
  const lines: string[] = [];
  lines.push('-- Migration script');
  lines.push('-- Generated on: ' + new Date().toISOString());
  lines.push('');
  
  for (const op of plan.operations) {
    lines.push(operationToSQL(op, schemaPrefix));
    lines.push('');
  }
  
  return lines.join('\n');
}

function operationToSQL(op: MigrationOperation, schemaPrefix: string): string {
  switch (op.type) {
    case 'create_table':
      return generateCreateTableSQL(op.entity, schemaPrefix);
      
    case 'drop_table':
      return `DROP TABLE ${schemaPrefix}"${op.tableName}";`;
      
    case 'add_column':
      return `ALTER TABLE ${schemaPrefix}"${op.tableName}" ADD COLUMN ${generateColumnSQL(op.column)};`;
      
    case 'drop_column':
      return `ALTER TABLE ${schemaPrefix}"${op.tableName}" DROP COLUMN "${op.columnName}";`;
      
    case 'alter_column':
      return generateAlterColumnSQL(op, schemaPrefix);
      
    case 'create_index': {
      const indexName = `idx_${op.tableName}_${op.index.columns.join('_')}`;
      const unique = op.index.unique ? 'UNIQUE ' : '';
      const columns = op.index.columns.map(c => `"${c}"`).join(', ');
      return `CREATE ${unique}INDEX "${indexName}" ON ${schemaPrefix}"${op.tableName}" (${columns});`;
    }
      
    case 'drop_index':
      return `DROP INDEX ${schemaPrefix}"${op.indexName}";`;
      
    case 'add_foreign_key': {
      const constraintName = `fk_${op.tableName}_${op.columnName}`;
      const onDelete = op.references.onDelete ? ` ON DELETE ${op.references.onDelete}` : '';
      const onUpdate = op.references.onUpdate ? ` ON UPDATE ${op.references.onUpdate}` : '';
      return `ALTER TABLE ${schemaPrefix}"${op.tableName}" ADD CONSTRAINT "${constraintName}" FOREIGN KEY ("${op.columnName}") REFERENCES ${schemaPrefix}"${op.references.table}" ("${op.references.column}")${onDelete}${onUpdate};`;
    }
      
    case 'drop_foreign_key': {
      const dropConstraintName = `fk_${op.tableName}_${op.columnName}`;
      return `ALTER TABLE ${schemaPrefix}"${op.tableName}" DROP CONSTRAINT "${dropConstraintName}";`;
    }
      
    case 'rename_table':
      return `ALTER TABLE ${schemaPrefix}"${op.from}" RENAME TO "${op.to}";`;
      
    case 'rename_column':
      return `ALTER TABLE ${schemaPrefix}"${op.tableName}" RENAME COLUMN "${op.from}" TO "${op.to}";`;
      
    default:
      return '-- Unknown operation';
  }
}

function generateCreateTableSQL(entity: IREntity, schemaPrefix: string): string {
  const lines: string[] = [];
  lines.push(`CREATE TABLE ${schemaPrefix}"${entity.name}" (`);
  
  const columnDefs = (entity.attributes || entity.columns).map(col => 
    `  ${generateColumnSQL(col)}`
  );
  
  const pkColumns = (entity.attributes || entity.columns)
    .filter(col => col.isPrimaryKey)
    .map(col => `"${col.name}"`);
  
  if (pkColumns.length > 0) {
    columnDefs.push(`  CONSTRAINT "${entity.name}_pkey" PRIMARY KEY (${pkColumns.join(', ')})`);
  }
  
  lines.push(columnDefs.join(',\n'));
  lines.push(');');
  
  return lines.join('\n');
}

function generateColumnSQL(column: IRAttribute): string {
  const parts: string[] = [];
  
  parts.push(`"${column.name}"`);
  parts.push(mapToPostgresType(column.type));
  
  if (!column.isOptional) {
    parts.push('NOT NULL');
  }
  
  if (column.isUnique) {
    parts.push('UNIQUE');
  }
  
  if (column.default) {
    parts.push(`DEFAULT ${formatDefaultValue(column.default)}`);
  }
  
  return parts.join(' ');
}

function generateAlterColumnSQL(op: AlterColumnOperation, schemaPrefix: string): string {
  const lines: string[] = [];
  
  if (op.changes.type) {
    lines.push(`ALTER TABLE ${schemaPrefix}"${op.tableName}" ALTER COLUMN "${op.columnName}" TYPE ${mapToPostgresType(op.changes.type.to)};`);
  }
  
  if (op.changes.nullable) {
    const nullConstraint = op.changes.nullable.to ? 'DROP NOT NULL' : 'SET NOT NULL';
    lines.push(`ALTER TABLE ${schemaPrefix}"${op.tableName}" ALTER COLUMN "${op.columnName}" ${nullConstraint};`);
  }
  
  if (op.changes.default) {
    if (op.changes.default.to) {
      lines.push(`ALTER TABLE ${schemaPrefix}"${op.tableName}" ALTER COLUMN "${op.columnName}" SET DEFAULT ${formatDefaultValue(op.changes.default.to)};`);
    } else {
      lines.push(`ALTER TABLE ${schemaPrefix}"${op.tableName}" ALTER COLUMN "${op.columnName}" DROP DEFAULT;`);
    }
  }
  
  return lines.join('\n');
}

// Helper functions for SQL generation
function mapToPostgresType(sqlType: string): string {
  // This is a simplified version - in practice you'd want the full mapping from supabase generator
  const type = sqlType.toLowerCase().trim();
  
  if (type.includes('varchar')) return sqlType;
  if (type.includes('int')) return type.includes('big') ? 'bigint' : 'integer';
  if (type.includes('text')) return 'text';
  if (type.includes('bool')) return 'boolean';
  if (type.includes('timestamp')) return 'timestamp with time zone';
  if (type.includes('date')) return 'date';
  if (type.includes('uuid')) return 'uuid';
  if (type.includes('json')) return 'jsonb';
  
  return sqlType; // Return as-is for unrecognized types
}

function formatDefaultValue(defaultExpr: string): string {
  if (!defaultExpr) return 'NULL';
  
  const expr = defaultExpr.trim();
  
  // If already quoted or is a function call, return as-is
  if ((expr.startsWith("'") && expr.endsWith("'")) || 
      expr.includes('()') || 
      ['true', 'false', 'null'].includes(expr.toLowerCase()) ||
      /^\d+(\.\d+)?$/.test(expr)) {
    return expr;
  }
  
  return `'${expr}'`;
}