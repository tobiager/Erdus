import { z } from 'zod';
import { IRDiagram, IRTable, IRColumn } from '../ir';
import { DatabaseEngine, MigrationResult } from '../types';

export interface SQLiteParseOptions {
  includeComments?: boolean;
  strictValidation?: boolean;
}

const SQLiteParseOptionsSchema = z.object({
  includeComments: z.boolean().optional().default(true),
  strictValidation: z.boolean().optional().default(false),
});

/**
 * SQLite parser that extracts schema information from CREATE TABLE statements
 * Supports SQLite-specific syntax including AUTOINCREMENT and WITHOUT ROWID
 */
export function parseSQLite(sql: string, options: SQLiteParseOptions = {}): MigrationResult {
  const opts = SQLiteParseOptionsSchema.parse(options);
  const tables: IRTable[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    // Clean up SQL by removing comments and normalizing whitespace
    const cleanSql = sql
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Match CREATE TABLE statements with SQLite-specific syntax
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:["`]?)(\w+)(?:["`]?)\s*\(([\s\S]*?)\)(?:\s+WITHOUT\s+ROWID)?(?:\s*;)?/gi;
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

    return {
      success: errors.length === 0,
      warnings,
      errors
    };

  } catch (error) {
    errors.push(`SQLite parsing error: ${error instanceof Error ? error.message : String(error)}`);
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
    } else if (upperStmt.startsWith('FOREIGN KEY') || upperStmt.includes('REFERENCES')) {
      // Extract foreign key constraint
      const fkMatch = stmt.match(
        /(?:FOREIGN\s+KEY\s*\(\s*([^)]+)\s*\)\s+)?REFERENCES\s+(?:["`]?)(\w+)(?:["`]?)\s*\(\s*([^)]+)\s*\)(?:\s+ON\s+DELETE\s+([A-Z\s]+?)(?=\s+ON\s+UPDATE|$))?(?:\s+ON\s+UPDATE\s+([A-Z\s]+))?/i
      );
      if (fkMatch) {
        pendingForeignKeys.push({
          column: fkMatch[1]?.replace(/["`]/g, '').trim() || 'unknown',
          refTable: fkMatch[2],
          refColumn: fkMatch[3].replace(/["`]/g, '').trim(),
          onDelete: fkMatch[4]?.trim(),
          onUpdate: fkMatch[5]?.trim()
        });
      }
    } else if (upperStmt.startsWith('CONSTRAINT')) {
      // Handle named constraints (skip for now)
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

  // Parse SQLite-specific column properties
  const isNotNull = remainingParts.includes('NOT NULL');
  const isUnique = remainingParts.includes('UNIQUE');
  const isPrimaryKey = remainingParts.includes('PRIMARY KEY');
  const isAutoIncrement = remainingParts.includes('AUTOINCREMENT');

  // Extract default value
  let defaultValue: string | undefined;
  const defaultMatch = remainingParts.match(/DEFAULT\s+([^\s,]+)/);
  if (defaultMatch) {
    defaultValue = defaultMatch[1];
  } else if (isAutoIncrement || (isPrimaryKey && dataType === 'INTEGER')) {
    defaultValue = 'autoincrement()';
  }

  // Map SQLite types to IR types
  const irType = mapSQLiteType(dataType);

  return {
    name: columnName,
    type: irType,
    isPrimaryKey,
    isOptional: !isNotNull && !isPrimaryKey,
    isUnique,
    default: defaultValue
  };
}

function mapSQLiteType(sqliteType: string): string {
  const typeMapping: Record<string, string> = {
    // SQLite has dynamic typing, but these are common type names
    'INTEGER': 'Int',
    'INT': 'Int',
    'BIGINT': 'BigInt',
    'SMALLINT': 'SmallInt',
    'TINYINT': 'SmallInt',
    
    'REAL': 'Float',
    'DOUBLE': 'Double',
    'FLOAT': 'Float',
    'DECIMAL': 'Decimal',
    'NUMERIC': 'Decimal',
    
    'TEXT': 'String',
    'VARCHAR': 'String',
    'CHAR': 'String',
    'CHARACTER': 'String',
    'CLOB': 'String',
    
    'BLOB': 'String',
    
    'BOOLEAN': 'Boolean',
    'BOOL': 'Boolean',
    
    'DATE': 'Date',
    'DATETIME': 'DateTime',
    'TIMESTAMP': 'DateTime',
    'TIME': 'Time'
  };

  // Handle types with parameters (e.g., VARCHAR(255))
  const baseType = sqliteType.split('(')[0];
  return typeMapping[baseType] || sqliteType;
}

/**
 * Convert IR diagram to SQLite DDL
 */
export function generateSQLite(diagram: IRDiagram, options: SQLiteParseOptions = {}): string {
  const opts = SQLiteParseOptionsSchema.parse(options);
  const statements: string[] = [];

  // Add header comment if enabled
  if (opts.includeComments) {
    statements.push('-- Generated SQLite schema');
    statements.push('-- Created by Erdus Migration Tool');
    statements.push('');
  }

  // SQLite requires foreign key support to be enabled
  if (diagram.tables.some(t => t.columns.some(c => c.references))) {
    statements.push('PRAGMA foreign_keys = ON;');
    statements.push('');
  }

  // Generate CREATE TABLE statements
  for (const table of diagram.tables) {
    statements.push(generateTableStatement(table, opts));
    statements.push('');
  }

  return statements.join('\n');
}

function generateTableStatement(table: IRTable, options: SQLiteParseOptions): string {
  const lines: string[] = [];
  
  if (options.includeComments) {
    lines.push(`-- Table: ${table.name}`);
  }
  
  lines.push(`CREATE TABLE "${table.name}" (`);

  const columnLines: string[] = [];
  
  for (const column of table.columns) {
    let line = `  "${column.name}" ${mapIRTypeToSQLite(column.type)}`;
    
    // SQLite INTEGER PRIMARY KEY is automatically AUTOINCREMENT
    if (column.isPrimaryKey && column.type === 'Int' && column.default === 'autoincrement()') {
      line = `  "${column.name}" INTEGER PRIMARY KEY AUTOINCREMENT`;
    } else {
      if (column.isPrimaryKey) {
        line += ' PRIMARY KEY';
      }
      
      if (!column.isOptional) {
        line += ' NOT NULL';
      }
      
      if (column.default && column.default !== 'autoincrement()') {
        line += ` DEFAULT ${column.default}`;
      }
      
      if (column.isUnique && !column.isPrimaryKey) {
        line += ' UNIQUE';
      }
    }
    
    // Add foreign key constraint inline for SQLite
    if (column.references) {
      line += ` REFERENCES "${column.references.table}" ("${column.references.column}")`;
      
      if (column.references.onDelete) {
        line += ` ON DELETE ${column.references.onDelete}`;
      }
      
      if (column.references.onUpdate) {
        line += ` ON UPDATE ${column.references.onUpdate}`;
      }
    }
    
    columnLines.push(line);
  }

  // Add composite primary key if needed
  const pkColumns = table.primaryKey;
  if (pkColumns && pkColumns.length > 1) {
    columnLines.push(`  PRIMARY KEY (${pkColumns.map(c => `"${c}"`).join(', ')})`);
  }

  lines.push(columnLines.join(',\n'));
  lines.push(');');

  return lines.join('\n');
}

function mapIRTypeToSQLite(irType: string): string {
  const typeMapping: Record<string, string> = {
    'Int': 'INTEGER',
    'BigInt': 'INTEGER',
    'SmallInt': 'INTEGER',
    'String': 'TEXT',
    'Boolean': 'INTEGER', // SQLite doesn't have native BOOLEAN
    'DateTime': 'TEXT', // SQLite stores dates as text
    'Date': 'TEXT',
    'Time': 'TEXT',
    'Decimal': 'REAL',
    'Float': 'REAL',
    'Double': 'REAL',
    'Json': 'TEXT'
  };

  return typeMapping[irType] || irType;
}