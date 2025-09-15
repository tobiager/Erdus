import type { IREntity, IRAttribute, IRSchema } from '../../ir';
import { normalizeType, normalizeDefault } from '../../ir/mapping';

/**
 * Common utilities for normalizing parsed database schemas to IR
 */

export interface ParsedTable {
  name: string;
  columns: ParsedColumn[];
  primaryKeys: string[];
  indexes: ParsedIndex[];
  foreignKeys: ParsedForeignKey[];
  checks: ParsedCheck[];
  comments?: { table?: string; columns: Record<string, string> };
}

export interface ParsedColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey?: boolean;
  isUnique?: boolean;
  autoIncrement?: boolean;
}

export interface ParsedIndex {
  name?: string;
  columns: string[];
  unique: boolean;
  type?: string;
}

export interface ParsedForeignKey {
  name?: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
  onDelete?: string;
  onUpdate?: string;
}

export interface ParsedCheck {
  name?: string;
  expression: string;
}

/**
 * Convert parsed tables to IR Schema
 */
export function normalizeToIR(
  tables: ParsedTable[],
  sourceEngine: string
): IRSchema {
  const entities: IREntity[] = [];
  const allForeignKeys: ParsedForeignKey[] = [];

  // First pass: create entities
  for (const table of tables) {
    const entity = normalizeTable(table, sourceEngine);
    entities.push(entity);
    
    // Collect foreign keys for relation generation
    allForeignKeys.push(...table.foreignKeys.map(fk => ({
      ...fk,
      sourceTable: table.name
    } as ParsedForeignKey & { sourceTable: string })));
  }

  // Second pass: create relations from foreign keys
  const relations = allForeignKeys.map(fk => ({
    type: '1-N' as const,
    sourceEntity: (fk as any).sourceTable,
    targetEntity: fk.referencedTable,
    sourceColumns: [fk.column],
    targetColumns: [fk.referencedColumn],
    onDelete: fk.onDelete as 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION' | 'SET DEFAULT' | undefined,
    onUpdate: fk.onUpdate as 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION' | 'SET DEFAULT' | undefined
  }));

  return {
    entities,
    relations
  };
}

function normalizeTable(table: ParsedTable, sourceEngine: string): IREntity {
  const attributes = table.columns.map(col => 
    normalizeColumn(col, sourceEngine)
  );

  // Create indexes from parsed indexes
  const indexes = table.indexes
    .filter(idx => !idx.unique) // Unique indexes are handled as unique constraints
    .map(idx => ({
      columns: idx.columns,
      unique: idx.unique
    }));

  // Handle unique constraints
  const uniques = table.indexes
    .filter(idx => idx.unique && idx.columns.length > 1)
    .map(idx => idx.columns);

  return {
    name: table.name,
    columns: attributes,
    attributes, // For compatibility
    primaryKey: table.primaryKeys,
    indexes,
    uniques: uniques.length > 0 ? uniques : undefined
  };
}

function normalizeColumn(column: ParsedColumn, sourceEngine: string): IRAttribute {
  return {
    name: column.name,
    type: normalizeType(column.type, sourceEngine),
    isPrimaryKey: column.isPrimaryKey,
    isOptional: column.nullable,
    isUnique: column.isUnique,
    default: column.defaultValue ? 
      normalizeDefault(column.defaultValue, sourceEngine) : 
      undefined
  };
}

/**
 * Parse a simple CREATE TABLE statement (basic implementation)
 */
export function parseCreateTable(sql: string): ParsedTable | null {
  // This is a simplified parser - real implementation would use a proper SQL parser
  const match = sql.match(/CREATE\s+TABLE\s+(?:`?)([^`\s]+)(?:`?)\s*\((.*)\)/is);
  if (!match) return null;

  const tableName = match[1];
  const columnsPart = match[2];

  const columns: ParsedColumn[] = [];
  const primaryKeys: string[] = [];
  const foreignKeys: ParsedForeignKey[] = [];

  // Split by commas, but be careful about nested parentheses
  const parts = splitColumns(columnsPart);

  for (const part of parts) {
    const trimmed = part.trim();
    
    if (trimmed.toUpperCase().includes('PRIMARY KEY')) {
      // Extract primary key columns
      const pkMatch = trimmed.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
      if (pkMatch) {
        const pkColumns = pkMatch[1].split(',').map(col => 
          col.trim().replace(/[`"]/g, '')
        );
        primaryKeys.push(...pkColumns);
      }
    } else if (trimmed.toUpperCase().includes('FOREIGN KEY')) {
      // Extract foreign key
      const fkMatch = trimmed.match(/FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([^(]+)\(([^)]+)\)/i);
      if (fkMatch) {
        const column = fkMatch[1].trim().replace(/[`"]/g, '');
        const refTable = fkMatch[2].trim().replace(/[`"]/g, '');
        const refColumn = fkMatch[3].trim().replace(/[`"]/g, '');
        
        foreignKeys.push({
          column,
          referencedTable: refTable,
          referencedColumn: refColumn
        });
      }
    } else {
      // Parse column definition
      const column = parseColumnDefinition(trimmed);
      if (column) {
        columns.push(column);
      }
    }
  }

  // Mark primary key columns
  for (const column of columns) {
    if (primaryKeys.includes(column.name)) {
      column.isPrimaryKey = true;
    }
  }

  return {
    name: tableName,
    columns,
    primaryKeys,
    indexes: [],
    foreignKeys,
    checks: []
  };
}

function splitColumns(columnsPart: string): string[] {
  const parts: string[] = [];
  let current = '';
  let parentheses = 0;
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < columnsPart.length; i++) {
    const char = columnsPart[i];
    
    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = '';
    } else if (char === '(' && !inQuotes) {
      parentheses++;
    } else if (char === ')' && !inQuotes) {
      parentheses--;
    } else if (char === ',' && parentheses === 0 && !inQuotes) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    
    current += char;
  }
  
  if (current.trim()) {
    parts.push(current.trim());
  }
  
  return parts;
}

function parseColumnDefinition(definition: string): ParsedColumn | null {
  // Very basic column parsing - real implementation would be more robust
  const parts = definition.trim().split(/\s+/);
  if (parts.length < 2) return null;

  const name = parts[0].replace(/[`"]/g, '');
  const type = parts[1];

  const column: ParsedColumn = {
    name,
    type,
    nullable: true
  };

  const upperDef = definition.toUpperCase();
  
  if (upperDef.includes('NOT NULL')) {
    column.nullable = false;
  }
  
  if (upperDef.includes('PRIMARY KEY')) {
    column.isPrimaryKey = true;
    column.nullable = false;
  }
  
  if (upperDef.includes('UNIQUE')) {
    column.isUnique = true;
  }
  
  if (upperDef.includes('AUTO_INCREMENT') || upperDef.includes('AUTOINCREMENT')) {
    column.autoIncrement = true;
  }

  // Extract default value
  const defaultMatch = definition.match(/DEFAULT\s+([^,\s]+(?:\([^)]*\))?)/i);
  if (defaultMatch) {
    column.defaultValue = defaultMatch[1];
  }

  return column;
}

/**
 * Extract table name from various SQL statement formats
 */
export function extractTableName(sql: string): string | null {
  const createMatch = sql.match(/CREATE\s+TABLE\s+(?:`?)([^`\s(]+)(?:`?)/i);
  if (createMatch) return createMatch[1];

  const alterMatch = sql.match(/ALTER\s+TABLE\s+(?:`?)([^`\s]+)(?:`?)/i);
  if (alterMatch) return alterMatch[1];

  return null;
}

/**
 * Check if a SQL statement is a DDL statement we should process
 */
export function isDDLStatement(sql: string): boolean {
  const upperSQL = sql.trim().toUpperCase();
  return upperSQL.startsWith('CREATE TABLE') ||
         upperSQL.startsWith('CREATE INDEX') ||
         upperSQL.startsWith('CREATE UNIQUE INDEX') ||
         upperSQL.startsWith('ALTER TABLE') ||
         upperSQL.startsWith('CREATE TYPE') ||
         upperSQL.startsWith('CREATE ENUM');
}