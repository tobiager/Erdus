import { z } from 'zod';
import { IRDiagram, IRTable, IRColumn } from '../ir';
import { DatabaseEngine, MigrationResult } from '../types';

export interface MySQLParseOptions {
  includeComments?: boolean;
  strictValidation?: boolean;
  engine?: 'InnoDB' | 'MyISAM';
}

const MySQLParseOptionsSchema = z.object({
  includeComments: z.boolean().optional().default(true),
  strictValidation: z.boolean().optional().default(false),
  engine: z.enum(['InnoDB', 'MyISAM']).optional().default('InnoDB'),
});

/**
 * MySQL parser that extracts schema information from CREATE TABLE statements
 * Supports MySQL-specific syntax including AUTO_INCREMENT, ENGINE, and charset
 */
export function parseMySQL(sql: string, options: MySQLParseOptions = {}): MigrationResult {
  const opts = MySQLParseOptionsSchema.parse(options);
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

    // Match CREATE TABLE statements with MySQL-specific syntax
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?\s*\(([\s\S]*?)\)(?:\s*ENGINE\s*=\s*\w+)?(?:\s*DEFAULT\s+CHARSET\s*=\s*\w+)?(?:\s*;)?/gi;
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
    errors.push(`MySQL parsing error: ${error instanceof Error ? error.message : String(error)}`);
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
          .map(col => col.replace(/[`"]/g, '').trim());
      }
    } else if (upperStmt.startsWith('FOREIGN KEY') || upperStmt.includes('REFERENCES')) {
      // Extract foreign key constraint
      const fkMatch = stmt.match(
        /(?:FOREIGN\s+KEY\s*\(\s*([^)]+)\s*\)\s+)?REFERENCES\s+`?(\w+)`?\s*\(\s*([^)]+)\s*\)(?:\s+ON\s+DELETE\s+([A-Z\s]+?)(?=\s+ON\s+UPDATE|$))?(?:\s+ON\s+UPDATE\s+([A-Z\s]+))?/i
      );
      if (fkMatch) {
        pendingForeignKeys.push({
          column: fkMatch[1]?.replace(/[`"]/g, '').trim() || 'unknown',
          refTable: fkMatch[2],
          refColumn: fkMatch[3].replace(/[`"]/g, '').trim(),
          onDelete: fkMatch[4]?.trim(),
          onUpdate: fkMatch[5]?.trim()
        });
      }
    } else if (upperStmt.startsWith('KEY') || upperStmt.startsWith('INDEX')) {
      // Handle indexes (skip for now)
      warnings.push(`Skipping index: ${stmt}`);
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

  const columnName = parts[0].replace(/[`"]/g, '');
  const dataType = parts[1].toUpperCase();
  const remainingParts = parts.slice(2).join(' ').toUpperCase();

  // Parse MySQL-specific column properties
  const isNotNull = remainingParts.includes('NOT NULL');
  const isUnique = remainingParts.includes('UNIQUE');
  const isPrimaryKey = remainingParts.includes('PRIMARY KEY');
  const isAutoIncrement = remainingParts.includes('AUTO_INCREMENT');

  // Extract default value
  let defaultValue: string | undefined;
  const defaultMatch = remainingParts.match(/DEFAULT\s+([^\s,]+)/);
  if (defaultMatch) {
    defaultValue = defaultMatch[1];
  } else if (isAutoIncrement) {
    defaultValue = 'autoincrement()';
  }

  // Map MySQL types to IR types
  const irType = mapMySQLType(dataType);

  return {
    name: columnName,
    type: irType,
    isPrimaryKey,
    isOptional: !isNotNull && !isPrimaryKey,
    isUnique,
    default: defaultValue
  };
}

function mapMySQLType(mysqlType: string): string {
  const typeMapping: Record<string, string> = {
    // Integer types
    'TINYINT': 'SmallInt',
    'SMALLINT': 'SmallInt',
    'MEDIUMINT': 'Int',
    'INT': 'Int',
    'INTEGER': 'Int',
    'BIGINT': 'BigInt',
    
    // Decimal types
    'DECIMAL': 'Decimal',
    'NUMERIC': 'Decimal',
    'FLOAT': 'Float',
    'DOUBLE': 'Double',
    'REAL': 'Float',
    
    // String types
    'CHAR': 'String',
    'VARCHAR': 'String',
    'TEXT': 'String',
    'TINYTEXT': 'String',
    'MEDIUMTEXT': 'String',
    'LONGTEXT': 'String',
    
    // Binary types
    'BINARY': 'String',
    'VARBINARY': 'String',
    'BLOB': 'String',
    'TINYBLOB': 'String',
    'MEDIUMBLOB': 'String',
    'LONGBLOB': 'String',
    
    // Date/Time types
    'DATE': 'Date',
    'TIME': 'Time',
    'DATETIME': 'DateTime',
    'TIMESTAMP': 'DateTime',
    'YEAR': 'Int',
    
    // Other types
    'BOOLEAN': 'Boolean',
    'BOOL': 'Boolean',
    'JSON': 'Json',
    'ENUM': 'String',
    'SET': 'String'
  };

  // Handle types with parameters (e.g., VARCHAR(255))
  const baseType = mysqlType.split('(')[0];
  return typeMapping[baseType] || mysqlType;
}

/**
 * Convert IR diagram to MySQL DDL
 */
export function generateMySQL(diagram: IRDiagram, options: MySQLParseOptions = {}): string {
  const opts = MySQLParseOptionsSchema.parse(options);
  const statements: string[] = [];

  // Add header comment if enabled
  if (opts.includeComments) {
    statements.push('-- Generated MySQL schema');
    statements.push('-- Created by Erdus Migration Tool');
    statements.push('');
  }

  // Generate CREATE TABLE statements
  for (const table of diagram.tables) {
    statements.push(generateTableStatement(table, opts));
    statements.push('');
  }

  return statements.join('\n');
}

function generateTableStatement(table: IRTable, options: MySQLParseOptions): string {
  const lines: string[] = [];
  
  if (options.includeComments) {
    lines.push(`-- Table: ${table.name}`);
  }
  
  lines.push(`CREATE TABLE \`${table.name}\` (`);

  const columnLines: string[] = [];
  
  for (const column of table.columns) {
    let line = `  \`${column.name}\` ${mapIRTypeToMySQL(column.type)}`;
    
    if (!column.isOptional) {
      line += ' NOT NULL';
    }
    
    if (column.default) {
      if (column.default === 'autoincrement()') {
        line += ' AUTO_INCREMENT';
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
    columnLines.push(`  PRIMARY KEY (${pkColumns.map(c => `\`${c}\``).join(', ')})`);
  }

  // Add foreign key constraints
  for (const column of table.columns) {
    if (column.references) {
      let fkLine = `  FOREIGN KEY (\`${column.name}\`) REFERENCES \`${column.references.table}\` (\`${column.references.column}\`)`;
      
      if (column.references.onDelete) {
        fkLine += ` ON DELETE ${column.references.onDelete}`;
      }
      
      if (column.references.onUpdate) {
        fkLine += ` ON UPDATE ${column.references.onUpdate}`;
      }
      
      columnLines.push(fkLine);
    }
  }

  lines.push(columnLines.join(',\n'));
  lines.push(`) ENGINE=${options.engine} DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);

  return lines.join('\n');
}

function mapIRTypeToMySQL(irType: string): string {
  const typeMapping: Record<string, string> = {
    'Int': 'INT',
    'BigInt': 'BIGINT',
    'SmallInt': 'SMALLINT',
    'String': 'VARCHAR(255)',
    'Boolean': 'BOOLEAN',
    'DateTime': 'DATETIME',
    'Date': 'DATE',
    'Time': 'TIME',
    'Decimal': 'DECIMAL(10,2)',
    'Float': 'FLOAT',
    'Double': 'DOUBLE',
    'Json': 'JSON'
  };

  return typeMapping[irType] || irType;
}