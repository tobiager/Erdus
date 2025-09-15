import { z } from 'zod';
import { IRDiagram, IRTable, IRColumn } from '../ir';
import { DatabaseEngine, MigrationResult } from '../types';

export interface OracleParseOptions {
  includeComments?: boolean;
  strictValidation?: boolean;
  schema?: string;
}

const OracleParseOptionsSchema = z.object({
  includeComments: z.boolean().optional().default(true),
  strictValidation: z.boolean().optional().default(false),
  schema: z.string().optional(),
});

/**
 * Oracle parser that extracts schema information from CREATE TABLE statements
 * Supports Oracle-specific syntax including sequences, triggers, and constraints
 */
export function parseOracle(sql: string, options: OracleParseOptions = {}): MigrationResult {
  const opts = OracleParseOptionsSchema.parse(options);
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

    // Match CREATE TABLE statements with Oracle-specific syntax
    const tableRegex = /CREATE\s+TABLE\s+(?:(\w+)\.)?(?:"?)(\w+)(?:"?)\s*\(([\s\S]*?)\)(?:\s*TABLESPACE\s+\w+)?(?:\s*;)?/gi;
    let match: RegExpExecArray | null;

    while ((match = tableRegex.exec(cleanSql))) {
      const schema = match[1];
      const tableName = match[2];
      const tableBody = match[3];
      
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
    errors.push(`Oracle parsing error: ${error instanceof Error ? error.message : String(error)}`);
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
  }> = [];

  // Split table body into individual statements
  const statements = tableBody
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  let primaryKeyColumns: string[] = [];

  for (const stmt of statements) {
    const upperStmt = stmt.toUpperCase();

    if (upperStmt.startsWith('CONSTRAINT') && upperStmt.includes('PRIMARY KEY')) {
      // Extract primary key columns from constraint
      const match = stmt.match(/CONSTRAINT\s+\w+\s+PRIMARY\s+KEY\s*\(\s*([^)]+)\s*\)/i);
      if (match) {
        primaryKeyColumns = match[1]
          .split(',')
          .map(col => col.replace(/["`]/g, '').trim());
      }
    } else if (upperStmt.startsWith('PRIMARY KEY')) {
      // Extract primary key columns
      const match = stmt.match(/PRIMARY\s+KEY\s*\(\s*([^)]+)\s*\)/i);
      if (match) {
        primaryKeyColumns = match[1]
          .split(',')
          .map(col => col.replace(/["`]/g, '').trim());
      }
    } else if (upperStmt.startsWith('CONSTRAINT') && upperStmt.includes('FOREIGN KEY')) {
      // Extract foreign key constraint
      const fkMatch = stmt.match(
        /CONSTRAINT\s+\w+\s+FOREIGN\s+KEY\s*\(\s*([^)]+)\s*\)\s+REFERENCES\s+(?:\w+\.)?(?:"?)(\w+)(?:"?)\s*\(\s*([^)]+)\s*\)(?:\s+ON\s+DELETE\s+([A-Z\s]+))?/i
      );
      if (fkMatch) {
        pendingForeignKeys.push({
          column: fkMatch[1].replace(/["`]/g, '').trim(),
          refTable: fkMatch[2],
          refColumn: fkMatch[3].replace(/["`]/g, '').trim(),
          onDelete: fkMatch[4]?.trim()
        });
      }
    } else if (upperStmt.startsWith('CONSTRAINT')) {
      // Handle other constraints (CHECK, UNIQUE, etc.)
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
        onDelete: fk.onDelete
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

  // Parse Oracle-specific column properties
  const isNotNull = remainingParts.includes('NOT NULL');
  const isUnique = remainingParts.includes('UNIQUE');
  const isPrimaryKey = remainingParts.includes('PRIMARY KEY');

  // Extract default value
  let defaultValue: string | undefined;
  const defaultMatch = remainingParts.match(/DEFAULT\s+([^\s,]+)/);
  if (defaultMatch) {
    defaultValue = defaultMatch[1];
  }

  // Map Oracle types to IR types
  const irType = mapOracleType(dataType);

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
  const alterRegex = /ALTER\s+TABLE\s+(?:\w+\.)?(?:"?)(\w+)(?:"?)\s+ADD\s+(?:CONSTRAINT\s+\w+\s+)?(.*?)(?:;|$)/gi;
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
        /FOREIGN\s+KEY\s*\(\s*([^)]+)\s*\)\s+REFERENCES\s+(?:\w+\.)?(?:"?)(\w+)(?:"?)\s*\(\s*([^)]+)\s*\)/i
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

function mapOracleType(oracleType: string): string {
  const typeMapping: Record<string, string> = {
    // Numeric types
    'NUMBER': 'Decimal',
    'INTEGER': 'Int',
    'INT': 'Int',
    'SMALLINT': 'SmallInt',
    'FLOAT': 'Float',
    'BINARY_FLOAT': 'Float',
    'BINARY_DOUBLE': 'Double',
    
    // Character types
    'VARCHAR2': 'String',
    'VARCHAR': 'String',
    'CHAR': 'String',
    'NCHAR': 'String',
    'NVARCHAR2': 'String',
    'CLOB': 'String',
    'NCLOB': 'String',
    
    // Date/Time types
    'DATE': 'DateTime',
    'TIMESTAMP': 'DateTime',
    'INTERVAL': 'String',
    
    // Binary types
    'RAW': 'String',
    'LONG': 'String',
    'BLOB': 'String',
    'BFILE': 'String',
    
    // Other types
    'ROWID': 'String',
    'UROWID': 'String',
    'XMLType': 'String'
  };

  // Handle types with parameters (e.g., VARCHAR2(255), NUMBER(10,2))
  const baseType = oracleType.split('(')[0];
  return typeMapping[baseType] || oracleType;
}

/**
 * Convert IR diagram to Oracle DDL
 */
export function generateOracle(diagram: IRDiagram, options: OracleParseOptions = {}): string {
  const opts = OracleParseOptionsSchema.parse(options);
  const statements: string[] = [];

  // Add header comment if enabled
  if (opts.includeComments) {
    statements.push('-- Generated Oracle schema');
    statements.push('-- Created by Erdus Migration Tool');
    statements.push('');
  }

  // Generate sequences for auto-increment columns
  const sequences: string[] = [];
  for (const table of diagram.tables) {
    for (const column of table.columns) {
      if (column.default === 'autoincrement()' && column.type === 'Int') {
        sequences.push(`CREATE SEQUENCE seq_${table.name}_${column.name} START WITH 1 INCREMENT BY 1;`);
      }
    }
  }

  if (sequences.length > 0) {
    if (opts.includeComments) {
      statements.push('-- Sequences for auto-increment columns');
    }
    statements.push(...sequences);
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

  // Generate triggers for auto-increment columns
  const triggers: string[] = [];
  for (const table of diagram.tables) {
    for (const column of table.columns) {
      if (column.default === 'autoincrement()' && column.type === 'Int') {
        if (opts.includeComments) {
          triggers.push(`-- Trigger for auto-increment: ${table.name}.${column.name}`);
        }
        triggers.push(`CREATE OR REPLACE TRIGGER trg_${table.name}_${column.name}`);
        triggers.push(`  BEFORE INSERT ON "${table.name}"`);
        triggers.push(`  FOR EACH ROW`);
        triggers.push(`BEGIN`);
        triggers.push(`  IF :NEW."${column.name}" IS NULL THEN`);
        triggers.push(`    :NEW."${column.name}" := seq_${table.name}_${column.name}.NEXTVAL;`);
        triggers.push(`  END IF;`);
        triggers.push(`END;`);
        triggers.push('/');
        triggers.push('');
      }
    }
  }

  if (triggers.length > 0) {
    statements.push(...triggers);
  }

  return statements.join('\n');
}

function generateTableStatement(table: IRTable, options: OracleParseOptions): string {
  const lines: string[] = [];
  
  if (options.includeComments) {
    lines.push(`-- Table: ${table.name}`);
  }
  
  lines.push(`CREATE TABLE "${table.name}" (`);

  const columnLines: string[] = [];
  
  for (const column of table.columns) {
    let line = `  "${column.name}" ${mapIRTypeToOracle(column.type)}`;
    
    if (!column.isOptional) {
      line += ' NOT NULL';
    }
    
    if (column.default && column.default !== 'autoincrement()') {
      line += ` DEFAULT ${column.default}`;
    }
    
    if (column.isUnique && !column.isPrimaryKey) {
      line += ' UNIQUE';
    }
    
    columnLines.push(line);
  }

  // Add primary key constraint
  const pkColumns = table.primaryKey || table.columns.filter(c => c.isPrimaryKey).map(c => c.name);
  if (pkColumns.length > 0) {
    columnLines.push(`  CONSTRAINT pk_${table.name} PRIMARY KEY (${pkColumns.map(c => `"${c}"`).join(', ')})`);
  }

  lines.push(columnLines.join(',\n'));
  lines.push(');');

  return lines.join('\n');
}

function generateForeignKeyStatements(table: IRTable, options: OracleParseOptions): string[] {
  const statements: string[] = [];
  
  for (const column of table.columns) {
    if (column.references) {
      if (options.includeComments) {
        statements.push(`-- Foreign key: ${table.name}.${column.name} -> ${column.references.table}.${column.references.column}`);
      }
      
      let stmt = `ALTER TABLE "${table.name}" ADD CONSTRAINT fk_${table.name}_${column.name} `;
      stmt += `FOREIGN KEY ("${column.name}") REFERENCES "${column.references.table}" ("${column.references.column}")`;
      
      if (column.references.onDelete) {
        stmt += ` ON DELETE ${column.references.onDelete}`;
      }
      
      stmt += ';';
      statements.push(stmt);
    }
  }
  
  return statements;
}

function mapIRTypeToOracle(irType: string): string {
  const typeMapping: Record<string, string> = {
    'Int': 'NUMBER(10)',
    'BigInt': 'NUMBER(19)',
    'SmallInt': 'NUMBER(5)',
    'String': 'VARCHAR2(255)',
    'Boolean': 'NUMBER(1)', // Oracle doesn't have native BOOLEAN in older versions
    'DateTime': 'TIMESTAMP',
    'Date': 'DATE',
    'Time': 'VARCHAR2(8)',
    'Decimal': 'NUMBER(10,2)',
    'Float': 'BINARY_FLOAT',
    'Double': 'BINARY_DOUBLE',
    'Json': 'CLOB' // Or XMLType for structured JSON
  };

  return typeMapping[irType] || irType;
}