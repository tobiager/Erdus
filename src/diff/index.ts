import type { IRSchema, IRDiagram, IREntity, IRAttribute } from '../ir';
import { isValidIRSchema } from '../ir/validators';

export interface MigrationOperation {
  type: 'create_table' | 'drop_table' | 'rename_table' | 
        'add_column' | 'drop_column' | 'alter_column' | 'rename_column' |
        'add_index' | 'drop_index' | 'add_constraint' | 'drop_constraint';
  table: string;
  newTable?: string; // for rename operations
  column?: string;
  newColumn?: string; // for rename operations  
  definition?: any; // column definition, index definition, etc.
  oldDefinition?: any; // for alter operations
}

export interface MigrationPlan {
  operations: MigrationOperation[];
  warnings: string[];
}

export interface DiffOptions {
  detectRenames?: boolean;
  renameThreshold?: number; // 0.0 to 1.0, similarity threshold for rename detection
}

export function diffSchemas(
  schemaA: IRSchema | IRDiagram,
  schemaB: IRSchema | IRDiagram,
  options: DiffOptions = {}
): MigrationPlan {
  const opts = {
    detectRenames: false,
    renameThreshold: 0.7,
    ...options,
  };

  const operations: MigrationOperation[] = [];
  const warnings: string[] = [];

  // Normalize inputs to common format
  const entitiesA = normalizeToEntities(schemaA);
  const entitiesB = normalizeToEntities(schemaB);

  // Create entity maps for easier lookup
  const mapA = new Map(entitiesA.map(e => [e.name, e]));
  const mapB = new Map(entitiesB.map(e => [e.name, e]));

  // Find created and dropped tables
  const createdTables = entitiesB.filter(e => !mapA.has(e.name));
  const droppedTables = entitiesA.filter(e => !mapB.has(e.name));

  // Handle rename detection if enabled
  if (opts.detectRenames && droppedTables.length > 0 && createdTables.length > 0) {
    const { renames } = detectTableRenames(droppedTables, createdTables, opts.renameThreshold);
    
    for (const rename of renames) {
      operations.push({
        type: 'rename_table',
        table: rename.from,
        newTable: rename.to,
      });
      warnings.push(`Detected possible rename: ${rename.from} -> ${rename.to} (similarity: ${rename.similarity.toFixed(2)})`);
    }

    // Update maps and lists to reflect renames
    for (const rename of renames) {
      const entity = mapA.get(rename.from)!;
      mapA.delete(rename.from);
      mapA.set(rename.to, { ...entity, name: rename.to });
      mapB.delete(rename.to);
    }
  }

  // Add remaining drops and creates
  for (const table of droppedTables.filter(t => !operations.some(op => op.table === t.name && op.type === 'rename_table'))) {
    operations.push({
      type: 'drop_table',
      table: table.name,
    });
  }

  for (const table of createdTables.filter(t => !operations.some(op => op.newTable === t.name && op.type === 'rename_table'))) {
    operations.push({
      type: 'create_table',
      table: table.name,
      definition: table,
    });
  }

  // Compare existing tables
  for (const entityB of entitiesB) {
    const entityA = mapA.get(entityB.name);
    if (!entityA) continue; // Already handled as create

    const columnOps = diffColumns(entityA, entityB, opts);
    operations.push(...columnOps.operations);
    warnings.push(...columnOps.warnings);

    const indexOps = diffIndexes(entityA, entityB);
    operations.push(...indexOps);
  }

  return { operations, warnings };
}

export function emitAlterSQL(plan: MigrationPlan, options: { schema?: string } = {}): string {
  const statements: string[] = [];
  const schemaPrefix = options.schema && options.schema !== 'public' ? `${options.schema}.` : '';

  // Add warnings as comments
  if (plan.warnings.length > 0) {
    statements.push('-- Migration Warnings:');
    for (const warning of plan.warnings) {
      statements.push(`-- ${warning}`);
    }
    statements.push('');
  }

  for (const op of plan.operations) {
    const stmt = operationToSQL(op, schemaPrefix);
    if (stmt) {
      statements.push(stmt);
    }
  }

  return statements.join('\n');
}

function normalizeToEntities(schema: IRSchema | IRDiagram): IREntity[] {
  if ('entities' in schema) {
    return schema.entities;
  }

  // Convert IRDiagram to IREntity format
  return schema.tables.map(table => ({
    name: table.name,
    attributes: table.columns.map(col => ({
      name: col.name,
      type: inferDataType(col.type),
      nullable: col.isOptional,
      pk: col.isPrimaryKey,
      unique: col.isUnique,
      default: col.default,
      references: col.references ? {
        table: col.references.table,
        column: col.references.column,
        onDelete: col.references.onDelete as any,
        onUpdate: col.references.onUpdate as any,
      } : undefined,
    })),
    indexes: table.indexes?.map(idx => ({
      columns: idx.columns,
      unique: idx.unique,
    })),
  }));
}

function inferDataType(typeString: string): any {
  const upper = typeString.toUpperCase();
  if (upper.includes('INT')) return 'integer';
  if (upper.includes('BIGINT')) return 'bigint';
  if (upper.includes('DECIMAL') || upper.includes('NUMERIC')) return 'decimal';
  if (upper.includes('FLOAT') || upper.includes('DOUBLE')) return 'number';
  if (upper.includes('BOOL')) return 'boolean';
  if (upper.includes('DATE')) return 'date';
  if (upper.includes('TIME')) return 'timestamp';
  if (upper.includes('UUID')) return 'uuid';
  if (upper.includes('JSON')) return 'json';
  if (upper.includes('TEXT')) return 'text';
  return 'string';
}

function detectTableRenames(
  dropped: IREntity[],
  created: IREntity[],
  threshold: number
): { renames: Array<{ from: string; to: string; similarity: number }>; remaining: { dropped: IREntity[]; created: IREntity[] } } {
  const renames: Array<{ from: string; to: string; similarity: number }> = [];
  const usedDropped = new Set<string>();
  const usedCreated = new Set<string>();

  for (const droppedTable of dropped) {
    let bestMatch: { table: IREntity; similarity: number } | null = null;

    for (const createdTable of created) {
      if (usedCreated.has(createdTable.name)) continue;

      const similarity = calculateTableSimilarity(droppedTable, createdTable);
      if (similarity >= threshold && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { table: createdTable, similarity };
      }
    }

    if (bestMatch) {
      renames.push({
        from: droppedTable.name,
        to: bestMatch.table.name,
        similarity: bestMatch.similarity,
      });
      usedDropped.add(droppedTable.name);
      usedCreated.add(bestMatch.table.name);
    }
  }

  return {
    renames,
    remaining: {
      dropped: dropped.filter(t => !usedDropped.has(t.name)),
      created: created.filter(t => !usedCreated.has(t.name)),
    }
  };
}

function calculateTableSimilarity(tableA: IREntity, tableB: IREntity): number {
  // Simple similarity based on column names and types
  const columnsA = new Set(tableA.attributes.map(attr => `${attr.name}:${attr.type}`));
  const columnsB = new Set(tableB.attributes.map(attr => `${attr.name}:${attr.type}`));
  
  const intersection = new Set([...columnsA].filter(x => columnsB.has(x)));
  const union = new Set([...columnsA, ...columnsB]);
  
  return intersection.size / union.size;
}

function diffColumns(
  entityA: IREntity,
  entityB: IREntity,
  options: DiffOptions
): { operations: MigrationOperation[]; warnings: string[] } {
  const operations: MigrationOperation[] = [];
  const warnings: string[] = [];

  const attrsA = new Map(entityA.attributes.map(attr => [attr.name, attr]));
  const attrsB = new Map(entityB.attributes.map(attr => [attr.name, attr]));

  // Find added columns
  for (const attr of entityB.attributes) {
    if (!attrsA.has(attr.name)) {
      operations.push({
        type: 'add_column',
        table: entityB.name,
        column: attr.name,
        definition: attr,
      });
    }
  }

  // Find dropped columns
  for (const attr of entityA.attributes) {
    if (!attrsB.has(attr.name)) {
      operations.push({
        type: 'drop_column',
        table: entityB.name,
        column: attr.name,
      });
    }
  }

  // Find altered columns
  for (const attr of entityB.attributes) {
    const oldAttr = attrsA.get(attr.name);
    if (oldAttr && !attributesEqual(oldAttr, attr)) {
      operations.push({
        type: 'alter_column',
        table: entityB.name,
        column: attr.name,
        definition: attr,
        oldDefinition: oldAttr,
      });
    }
  }

  return { operations, warnings };
}

function diffIndexes(entityA: IREntity, entityB: IREntity): MigrationOperation[] {
  const operations: MigrationOperation[] = [];

  const indexesA = entityA.indexes || [];
  const indexesB = entityB.indexes || [];

  // Simple approach: compare by column sets
  const indexMapA = new Map(indexesA.map(idx => [idx.columns.join(','), idx]));
  const indexMapB = new Map(indexesB.map(idx => [idx.columns.join(','), idx]));

  // Find dropped indexes
  for (const [key, index] of indexMapA) {
    if (!indexMapB.has(key)) {
      operations.push({
        type: 'drop_index',
        table: entityA.name,
        definition: index,
      });
    }
  }

  // Find added indexes
  for (const [key, index] of indexMapB) {
    if (!indexMapA.has(key)) {
      operations.push({
        type: 'add_index',
        table: entityB.name,
        definition: index,
      });
    }
  }

  return operations;
}

function attributesEqual(a: IRAttribute, b: IRAttribute): boolean {
  return (
    a.type === b.type &&
    a.nullable === b.nullable &&
    a.pk === b.pk &&
    a.unique === b.unique &&
    a.default === b.default &&
    JSON.stringify(a.references) === JSON.stringify(b.references) &&
    a.precision === b.precision &&
    a.scale === b.scale &&
    a.length === b.length
  );
}

function operationToSQL(op: MigrationOperation, schemaPrefix: string): string {
  const tableName = `${schemaPrefix}${op.table}`;

  switch (op.type) {
    case 'create_table':
      return generateCreateTableSQL(op.definition, schemaPrefix);

    case 'drop_table':
      return `DROP TABLE ${tableName};`;

    case 'rename_table':
      return `ALTER TABLE ${tableName} RENAME TO ${schemaPrefix}${op.newTable};`;

    case 'add_column':
      return `ALTER TABLE ${tableName} ADD COLUMN ${generateColumnSQL(op.definition)};`;

    case 'drop_column':
      return `ALTER TABLE ${tableName} DROP COLUMN ${op.column};`;

    case 'alter_column':
      return generateAlterColumnSQL(tableName, op.definition, op.oldDefinition);

    case 'rename_column':
      return `ALTER TABLE ${tableName} RENAME COLUMN ${op.column} TO ${op.newColumn};`;

    case 'add_index': {
      const indexName = `idx_${op.table}_${op.definition.columns.join('_')}`;
      const unique = op.definition.unique ? 'UNIQUE ' : '';
      const columns = op.definition.columns.join(', ');
      return `CREATE ${unique}INDEX ${indexName} ON ${tableName} (${columns});`;
    }

    case 'drop_index': {
      const dropIndexName = `idx_${op.table}_${op.definition.columns.join('_')}`;
      return `DROP INDEX ${dropIndexName};`;
    }

    default:
      return `-- Unsupported operation: ${op.type}`;
  }
}

function generateCreateTableSQL(entity: IREntity, schemaPrefix: string): string {
  const tableName = `${schemaPrefix}${entity.name}`;
  const columns = entity.attributes.map(attr => generateColumnSQL(attr));
  
  // Add primary key constraint if composite
  const pkAttrs = entity.attributes.filter(attr => attr.pk);
  if (pkAttrs.length > 1) {
    const pkColumns = pkAttrs.map(attr => attr.name).join(', ');
    columns.push(`PRIMARY KEY (${pkColumns})`);
  }

  return `CREATE TABLE ${tableName} (\n  ${columns.join(',\n  ')}\n);`;
}

function generateColumnSQL(attr: IRAttribute): string {
  const parts = [attr.name];
  
  // Data type mapping (simplified for PostgreSQL)
  let dataType: string;
  switch (attr.type) {
    case 'string':
      dataType = attr.length ? `varchar(${attr.length})` : 'varchar(255)';
      break;
    case 'text':
      dataType = 'text';
      break;
    case 'integer':
      dataType = 'integer';
      break;
    case 'bigint':
      dataType = 'bigint';
      break;
    case 'decimal':
      dataType = attr.precision && attr.scale !== undefined 
        ? `numeric(${attr.precision},${attr.scale})` 
        : 'numeric';
      break;
    case 'boolean':
      dataType = 'boolean';
      break;
    case 'date':
      dataType = 'date';
      break;
    case 'timestamp':
      dataType = 'timestamp with time zone';
      break;
    case 'uuid':
      dataType = 'uuid';
      break;
    case 'json':
      dataType = 'jsonb';
      break;
    default:
      dataType = 'text';
  }
  
  parts.push(dataType);
  
  if (!attr.nullable) {
    parts.push('NOT NULL');
  }
  
  if (attr.default) {
    parts.push(`DEFAULT ${attr.default}`);
  }
  
  if (attr.pk && !isCompositePK(attr)) {
    parts.push('PRIMARY KEY');
  }
  
  if (attr.unique) {
    parts.push('UNIQUE');
  }

  return parts.join(' ');
}

function generateAlterColumnSQL(tableName: string, newAttr: IRAttribute, oldAttr: IRAttribute): string {
  const statements: string[] = [];
  const columnName = newAttr.name;

  // Type change
  if (newAttr.type !== oldAttr.type) {
    let newType: string;
    switch (newAttr.type) {
      case 'string':
        newType = newAttr.length ? `varchar(${newAttr.length})` : 'varchar(255)';
        break;
      case 'integer':
        newType = 'integer';
        break;
      case 'boolean':
        newType = 'boolean';
        break;
      default:
        newType = 'text';
    }
    statements.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnName} TYPE ${newType};`);
  }

  // Nullability change
  if (newAttr.nullable !== oldAttr.nullable) {
    if (newAttr.nullable) {
      statements.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnName} DROP NOT NULL;`);
    } else {
      statements.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnName} SET NOT NULL;`);
    }
  }

  // Default value change
  if (newAttr.default !== oldAttr.default) {
    if (newAttr.default) {
      statements.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnName} SET DEFAULT ${newAttr.default};`);
    } else {
      statements.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnName} DROP DEFAULT;`);
    }
  }

  return statements.join('\n');
}

function isCompositePK(_attr: IRAttribute): boolean {
  // This is a simplified check
  return false;
}