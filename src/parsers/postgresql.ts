import { z } from 'zod';
import { IRDiagram, IRTable, IRColumn } from '../ir';
import { DatabaseEngine, MigrationResult } from '../types';

export interface PostgreSQLParseOptions {
  includeComments?: boolean;
  strictValidation?: boolean;
}

const PostgreSQLParseOptionsSchema = z.object({
  includeComments: z.boolean().optional().default(true),
  strictValidation: z.boolean().optional().default(false),
});

/**
 * Enhanced PostgreSQL parser that extracts schema information from CREATE TABLE statements
 * Supports primary keys, foreign keys, constraints, indexes, and comments
 */
export function parsePostgreSQL(sql: string, options: PostgreSQLParseOptions = {}): MigrationResult {
  const opts = PostgreSQLParseOptionsSchema.parse(options);
  const tables: IRTable[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    // Clean up SQL by removing comments and normalizing whitespace
    const cleanSql = sql
      .replace(/--.*$/gm, '') // Remove line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\s+/g, ' ')
      .trim();

    // Match CREATE TABLE statements (including IF NOT EXISTS)
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:[\w"`]+\.)?"?(\w+)"?\s*\(([\s\S]*?)\)(?:\s*;)?/gi;
    let match: RegExpExecArray | null;

    while ((match = tableRegex.exec(cleanSql))) {
      const tableName = match[1];
      const tableBody = match[2];
      
      try {
        const table = parseTableDefinition(tableName, tableBody, warnings);
        tables.push(table);
      } catch (error) {
        errors.push(`Error parsing table ${tableName}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Parse ALTER TABLE statements for additional constraints
    parseAlterStatements(cleanSql, tables, warnings);

    return {
      success: errors.length === 0,
      warnings,
      errors
    };

  } catch (error) {
    errors.push(`PostgreSQL parsing error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      warnings,
      errors
    };
  }
}

function parseTableDefinition(tableName: string, tableBody: string, warnings: string[]): IRTable {
  const columns: IRColumn[] = [];
  const pendingForeignKeys: Array<{
    column: string;
    refTable: string;
    refColumn: string;
    onDelete?: string;
    onUpdate?: string;
  }> = [];

  // Split table body into individual statements
  const statements = tableBody
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  let primaryKeyColumns: string[] = [];

  for (const stmt of statements) {
    const upperStmt = stmt.toUpperCase();

    if (upperStmt.startsWith('PRIMARY KEY')) {
      // Extract primary key columns
      const match = stmt.match(/PRIMARY\s+KEY\s*\(\s*([^)]+)\s*\)/i);
      if (match) {
        primaryKeyColumns = match[1]
          .split(',')
          .map(col => col.replace(/["`]/g, '').trim());
      }
    } else if (upperStmt.startsWith('FOREIGN KEY')) {
      // Extract foreign key constraint
      const fkMatch = stmt.match(
        /FOREIGN\s+KEY\s*\(\s*([^)]+)\s*\)\s+REFERENCES\s+"?(\w+)"?\s*\(\s*([^)]+)\s*\)(?:\s+ON\s+DELETE\s+([A-Z\s]+?)(?=\s+ON\s+UPDATE|$))?(?:\s+ON\s+UPDATE\s+([A-Z\s]+))?/i
      );
      if (fkMatch) {
        pendingForeignKeys.push({
          column: fkMatch[1].replace(/["`]/g, '').trim(),
          refTable: fkMatch[2],
          refColumn: fkMatch[3].replace(/["`]/g, '').trim(),
          onDelete: fkMatch[4]?.trim(),
          onUpdate: fkMatch[5]?.trim()
        });
      }
    } else if (upperStmt.startsWith('CONSTRAINT') || upperStmt.startsWith('UNIQUE') || upperStmt.startsWith('CHECK')) {
      // Handle named constraints (skip for now, could be enhanced)
      warnings.push(`Skipping constraint: ${stmt}`);
    } else {
      // Parse column definition
      const column = parseColumnDefinition(stmt, warnings);
      if (column) {
        columns.push(column);
      }
    }
  }

  // Apply primary key information
  primaryKeyColumns.forEach(pkCol => {
    const column = columns.find(col => col.name === pkCol);
    if (column) {
      column.isPrimaryKey = true;
    }
  });

  // Apply foreign key information
  pendingForeignKeys.forEach(fk => {
    const column = columns.find(col => col.name === fk.column);
    if (column) {
      column.references = {
        table: fk.refTable,
        column: fk.refColumn,
        onDelete: fk.onDelete,
        onUpdate: fk.onUpdate
      };
    }
  });

  return {
    name: tableName,
    columns,
    primaryKey: primaryKeyColumns.length > 1 ? primaryKeyColumns : undefined
  };
}

function parseColumnDefinition(stmt: string, warnings: string[]): IRColumn | null {
  // Split column definition into parts
  const parts = stmt.trim().split(/\s+/);
  if (parts.length < 2) return null;

  const columnName = parts[0].replace(/["`]/g, '');
  const dataType = parts[1].toUpperCase();
  const remainingParts = parts.slice(2).join(' ').toUpperCase();

  // Parse column properties
  const isNotNull = remainingParts.includes('NOT NULL');
  const isUnique = remainingParts.includes('UNIQUE');
  const isPrimaryKey = remainingParts.includes('PRIMARY KEY');
  const isSerial = dataType === 'SERIAL' || dataType === 'BIGSERIAL';

  // Extract default value
  let defaultValue: string | undefined;
  const defaultMatch = remainingParts.match(/DEFAULT\s+([^\s,]+)/);
  if (defaultMatch) {
    defaultValue = defaultMatch[1];
  } else if (isSerial) {
    defaultValue = 'autoincrement()';
  }

  // Map PostgreSQL types to IR types
  const irType = mapPostgreSQLType(dataType);

  return {
    name: columnName,
    type: irType,
    isPrimaryKey,
    isOptional: !isNotNull && !isPrimaryKey,
    isUnique,
    default: defaultValue
  };
}

function parseAlterStatements(sql: string, tables: IRTable[], warnings: string[]): void {
  // Parse ALTER TABLE statements for additional constraints
  const alterRegex = /ALTER\s+TABLE\s+"?(\w+)"?\s+ADD\s+(?:CONSTRAINT\s+\w+\s+)?(.*?)(?:;|$)/gi;
  let match: RegExpExecArray | null;

  while ((match = alterRegex.exec(sql))) {
    const tableName = match[1];
    const constraint = match[2].trim();
    const table = tables.find(t => t.name === tableName);

    if (!table) {
      warnings.push(`ALTER TABLE references unknown table: ${tableName}`);
      continue;
    }

    if (constraint.toUpperCase().startsWith('FOREIGN KEY')) {
      // Handle foreign key constraints added via ALTER TABLE
      const fkMatch = constraint.match(
        /FOREIGN\s+KEY\s*\(\s*([^)]+)\s*\)\s+REFERENCES\s+"?(\w+)"?\s*\(\s*([^)]+)\s*\)/i
      );
      if (fkMatch) {
        const columnName = fkMatch[1].replace(/["`]/g, '').trim();
        const refTable = fkMatch[2];
        const refColumn = fkMatch[3].replace(/["`]/g, '').trim();

        const column = table.columns.find(col => col.name === columnName);
        if (column) {
          column.references = {
            table: refTable,
            column: refColumn
          };
        }
      }
    }
  }
}

function mapPostgreSQLType(pgType: string): string {
  const typeMapping: Record<string, string> = {
    'INTEGER': 'Int',
    'INT': 'Int',
    'INT4': 'Int',
    'BIGINT': 'BigInt',
    'INT8': 'BigInt',
    'SMALLINT': 'SmallInt',
    'INT2': 'SmallInt',
    'SERIAL': 'Int',
    'BIGSERIAL': 'BigInt',
    'SMALLSERIAL': 'SmallInt',
    'VARCHAR': 'String',
    'TEXT': 'String',
    'CHAR': 'String',
    'CHARACTER': 'String',
    'BOOLEAN': 'Boolean',
    'BOOL': 'Boolean',
    'TIMESTAMP': 'DateTime',
    'TIMESTAMPTZ': 'DateTime',
    'DATE': 'Date',
    'TIME': 'Time',
    'TIMETZ': 'Time',
    'DECIMAL': 'Decimal',
    'NUMERIC': 'Decimal',
    'REAL': 'Float',
    'FLOAT4': 'Float',
    'DOUBLE': 'Double',
    'FLOAT8': 'Double',
    'UUID': 'String',
    'JSON': 'Json',
    'JSONB': 'Json'
  };

  // Handle types with parameters (e.g., VARCHAR(255))
  const baseType = pgType.split('(')[0];
  return typeMapping[baseType] || pgType;
}

/**
 * Convert IR diagram to PostgreSQL DDL
 */
export function generatePostgreSQL(diagram: IRDiagram, options: PostgreSQLParseOptions = {}): string {
  const opts = PostgreSQLParseOptionsSchema.parse(options);
  const statements: string[] = [];

  // Add header comment if enabled
  if (opts.includeComments) {
    statements.push('-- Generated PostgreSQL schema');
    statements.push('-- Created by Erdus Migration Tool');
    statements.push('');
  }

  // Generate CREATE TABLE statements
  for (const table of diagram.tables) {
    statements.push(generateTableStatement(table, opts));
    statements.push('');
  }

  // Generate foreign key constraints
  for (const table of diagram.tables) {
    const fkStatements = generateForeignKeyStatements(table, opts);
    if (fkStatements.length > 0) {
      statements.push(...fkStatements);
      statements.push('');
    }
  }

  return statements.join('\n');
}

function generateTableStatement(table: IRTable, options: PostgreSQLParseOptions): string {
  const lines: string[] = [];
  
  if (options.includeComments) {
    lines.push(`-- Table: ${table.name}`);
  }
  
  lines.push(`CREATE TABLE "${table.name}" (`);

  const columnLines: string[] = [];
  
  for (const column of table.columns) {
    let line = `  "${column.name}" ${mapIRTypeToPostgreSQL(column.type)}`;
    
    if (!column.isOptional) {
      line += ' NOT NULL';
    }
    
    if (column.default) {
      if (column.default === 'autoincrement()') {
        line = `  "${column.name}" SERIAL`;
        if (!column.isOptional) {
          line += ' NOT NULL';
        }
      } else {
        line += ` DEFAULT ${column.default}`;
      }
    }
    
    if (column.isUnique && !column.isPrimaryKey) {
      line += ' UNIQUE';
    }
    
    columnLines.push(line);
  }

  // Add primary key constraint
  const pkColumns = table.primaryKey || table.columns.filter(c => c.isPrimaryKey).map(c => c.name);
  if (pkColumns.length > 0) {
    columnLines.push(`  PRIMARY KEY (${pkColumns.map(c => `"${c}"`).join(', ')})`);
  }

  lines.push(columnLines.join(',\n'));
  lines.push(');');

  return lines.join('\n');
}

function generateForeignKeyStatements(table: IRTable, options: PostgreSQLParseOptions): string[] {
  const statements: string[] = [];
  
  for (const column of table.columns) {
    if (column.references) {
      if (options.includeComments) {
        statements.push(`-- Foreign key: ${table.name}.${column.name} -> ${column.references.table}.${column.references.column}`);
      }
      
      let stmt = `ALTER TABLE "${table.name}" ADD CONSTRAINT "fk_${table.name}_${column.name}" `;
      stmt += `FOREIGN KEY ("${column.name}") REFERENCES "${column.references.table}" ("${column.references.column}")`;
      
      if (column.references.onDelete) {
        stmt += ` ON DELETE ${column.references.onDelete}`;
      }
      
      if (column.references.onUpdate) {
        stmt += ` ON UPDATE ${column.references.onUpdate}`;
      }
      
      stmt += ';';
      statements.push(stmt);
    }
  }
  
  return statements;
}

function mapIRTypeToPostgreSQL(irType: string): string {
  const typeMapping: Record<string, string> = {
    'Int': 'INTEGER',
    'BigInt': 'BIGINT',
    'SmallInt': 'SMALLINT',
    'String': 'VARCHAR(255)',
    'Boolean': 'BOOLEAN',
    'DateTime': 'TIMESTAMP',
    'Date': 'DATE',
    'Time': 'TIME',
    'Decimal': 'DECIMAL',
    'Float': 'REAL',
    'Double': 'DOUBLE PRECISION',
    'Json': 'JSONB'
  };

  return typeMapping[irType] || irType;
}