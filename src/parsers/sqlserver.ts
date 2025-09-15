import { z } from 'zod';
import { IRDiagram, IRTable, IRColumn } from '../ir';
import { DatabaseEngine, MigrationResult } from '../types';

export interface SQLServerParseOptions {
  includeComments?: boolean;
  strictValidation?: boolean;
  schema?: string;
}

const SQLServerParseOptionsSchema = z.object({
  includeComments: z.boolean().optional().default(true),
  strictValidation: z.boolean().optional().default(false),
  schema: z.string().optional().default('dbo'),
});

/**
 * SQL Server parser that extracts schema information from CREATE TABLE statements
 * Supports SQL Server-specific syntax including IDENTITY, NVARCHAR, and constraints
 */
export function parseSQLServer(sql: string, options: SQLServerParseOptions = {}): MigrationResult {
  const opts = SQLServerParseOptionsSchema.parse(options);
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

    // Match CREATE TABLE statements with SQL Server-specific syntax
    const tableRegex = /CREATE\s+TABLE\s+(?:\[?(\w+)\]?\.\[?(\w+)\]?|\[?(\w+)\]?)\s*\(([\s\S]*?)\)(?:\s+ON\s+\w+)?(?:\s*;)?/gi;
    let match: RegExpExecArray | null;

    while ((match = tableRegex.exec(cleanSql))) {
      const schema = match[1];
      const tableName = match[2] || match[3];
      const tableBody = match[4];
      
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
    errors.push(`SQL Server parsing error: ${error instanceof Error ? error.message : String(error)}`);
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

    if (upperStmt.startsWith('CONSTRAINT') && upperStmt.includes('PRIMARY KEY')) {
      // Extract primary key columns from constraint
      const match = stmt.match(/CONSTRAINT\s+\[?\w+\]?\s+PRIMARY\s+KEY\s*(?:CLUSTERED|NONCLUSTERED)?\s*\(\s*([^)]+)\s*\)/i);
      if (match) {
        primaryKeyColumns = match[1]
          .split(',')
          .map(col => col.replace(/[\[\]"`]/g, '').trim());
      }
    } else if (upperStmt.startsWith('PRIMARY KEY')) {
      // Extract primary key columns
      const match = stmt.match(/PRIMARY\s+KEY\s*(?:CLUSTERED|NONCLUSTERED)?\s*\(\s*([^)]+)\s*\)/i);
      if (match) {
        primaryKeyColumns = match[1]
          .split(',')
          .map(col => col.replace(/[\[\]"`]/g, '').trim());
      }
    } else if (upperStmt.startsWith('CONSTRAINT') && upperStmt.includes('FOREIGN KEY')) {
      // Extract foreign key constraint
      const fkMatch = stmt.match(
        /CONSTRAINT\s+\[?\w+\]?\s+FOREIGN\s+KEY\s*\(\s*([^)]+)\s*\)\s+REFERENCES\s+(?:\[?\w+\]?\.\[?(\w+)\]?|\[?(\w+)\]?)\s*\(\s*([^)]+)\s*\)(?:\s+ON\s+DELETE\s+([A-Z\s]+?)(?=\s+ON\s+UPDATE|$))?(?:\s+ON\s+UPDATE\s+([A-Z\s]+))?/i
      );
      if (fkMatch) {
        pendingForeignKeys.push({
          column: fkMatch[1].replace(/[\[\]"`]/g, '').trim(),
          refTable: fkMatch[2] || fkMatch[3],
          refColumn: fkMatch[4].replace(/[\[\]"`]/g, '').trim(),
          onDelete: fkMatch[5]?.trim(),
          onUpdate: fkMatch[6]?.trim()
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

  const columnName = parts[0].replace(/[\[\]"`]/g, '');
  const dataType = parts[1].toUpperCase();
  const remainingParts = parts.slice(2).join(' ').toUpperCase();

  // Parse SQL Server-specific column properties
  const isNotNull = remainingParts.includes('NOT NULL');
  const isUnique = remainingParts.includes('UNIQUE');
  const isPrimaryKey = remainingParts.includes('PRIMARY KEY');
  const isIdentity = remainingParts.includes('IDENTITY');

  // Extract default value
  let defaultValue: string | undefined;
  const defaultMatch = remainingParts.match(/DEFAULT\s+([^\s,]+)/);
  if (defaultMatch) {
    defaultValue = defaultMatch[1];
  } else if (isIdentity) {
    defaultValue = 'autoincrement()';
  }

  // Map SQL Server types to IR types
  const irType = mapSQLServerType(dataType);

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
  const alterRegex = /ALTER\s+TABLE\s+(?:\[?\w+\]?\.\[?(\w+)\]?|\[?(\w+)\]?)\s+ADD\s+(?:CONSTRAINT\s+\[?\w+\]?\s+)?(.*?)(?:;|$)/gi;
  let match: RegExpExecArray | null;

  while ((match = alterRegex.exec(sql))) {
    const tableName = match[1] || match[2];
    const constraint = match[3].trim();
    const table = tables.find(t => t.name === tableName);

    if (!table) {
      warnings.push(`ALTER TABLE references unknown table: ${tableName}`);
      continue;
    }

    if (constraint.toUpperCase().startsWith('FOREIGN KEY')) {
      // Handle foreign key constraints added via ALTER TABLE
      const fkMatch = constraint.match(
        /FOREIGN\s+KEY\s*\(\s*([^)]+)\s*\)\s+REFERENCES\s+(?:\[?\w+\]?\.\[?(\w+)\]?|\[?(\w+)\]?)\s*\(\s*([^)]+)\s*\)/i
      );
      if (fkMatch) {
        const columnName = fkMatch[1].replace(/[\[\]"`]/g, '').trim();
        const refTable = fkMatch[2] || fkMatch[3];
        const refColumn = fkMatch[4].replace(/[\[\]"`]/g, '').trim();

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

function mapSQLServerType(sqlServerType: string): string {
  const typeMapping: Record<string, string> = {
    // Integer types
    'TINYINT': 'SmallInt',
    'SMALLINT': 'SmallInt',
    'INT': 'Int',
    'INTEGER': 'Int',
    'BIGINT': 'BigInt',
    
    // Decimal types
    'DECIMAL': 'Decimal',
    'NUMERIC': 'Decimal',
    'MONEY': 'Decimal',
    'SMALLMONEY': 'Decimal',
    'FLOAT': 'Float',
    'REAL': 'Float',
    
    // String types
    'CHAR': 'String',
    'VARCHAR': 'String',
    'TEXT': 'String',
    'NCHAR': 'String',
    'NVARCHAR': 'String',
    'NTEXT': 'String',
    
    // Binary types
    'BINARY': 'String',
    'VARBINARY': 'String',
    'IMAGE': 'String',
    
    // Date/Time types
    'DATE': 'Date',
    'TIME': 'Time',
    'DATETIME': 'DateTime',
    'DATETIME2': 'DateTime',
    'SMALLDATETIME': 'DateTime',
    'DATETIMEOFFSET': 'DateTime',
    'TIMESTAMP': 'DateTime',
    
    // Other types
    'BIT': 'Boolean',
    'UNIQUEIDENTIFIER': 'String',
    'XML': 'String',
    'JSON': 'Json',
    'GEOGRAPHY': 'String',
    'GEOMETRY': 'String',
    'HIERARCHYID': 'String',
    'SQL_VARIANT': 'String'
  };

  // Handle types with parameters (e.g., VARCHAR(255))
  const baseType = sqlServerType.split('(')[0];
  return typeMapping[baseType] || sqlServerType;
}

/**
 * Convert IR diagram to SQL Server DDL
 */
export function generateSQLServer(diagram: IRDiagram, options: SQLServerParseOptions = {}): string {
  const opts = SQLServerParseOptionsSchema.parse(options);
  const statements: string[] = [];

  // Add header comment if enabled
  if (opts.includeComments) {
    statements.push('-- Generated SQL Server schema');
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

function generateTableStatement(table: IRTable, options: SQLServerParseOptions): string {
  const lines: string[] = [];
  
  if (options.includeComments) {
    lines.push(`-- Table: ${table.name}`);
  }
  
  lines.push(`CREATE TABLE [${options.schema}].[${table.name}] (`);

  const columnLines: string[] = [];
  
  for (const column of table.columns) {
    let line = `  [${column.name}] ${mapIRTypeToSQLServer(column.type)}`;
    
    // Handle IDENTITY for auto-increment
    if (column.default === 'autoincrement()' && ['Int', 'BigInt'].includes(column.type)) {
      line += ' IDENTITY(1,1)';
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
    
    columnLines.push(line);
  }

  // Add primary key constraint
  const pkColumns = table.primaryKey || table.columns.filter(c => c.isPrimaryKey).map(c => c.name);
  if (pkColumns.length > 0) {
    columnLines.push(`  CONSTRAINT [PK_${table.name}] PRIMARY KEY CLUSTERED (${pkColumns.map(c => `[${c}]`).join(', ')})`);
  }

  lines.push(columnLines.join(',\n'));
  lines.push(');');

  return lines.join('\n');
}

function generateForeignKeyStatements(table: IRTable, options: SQLServerParseOptions): string[] {
  const statements: string[] = [];
  
  for (const column of table.columns) {
    if (column.references) {
      if (options.includeComments) {
        statements.push(`-- Foreign key: ${table.name}.${column.name} -> ${column.references.table}.${column.references.column}`);
      }
      
      let stmt = `ALTER TABLE [${options.schema}].[${table.name}] ADD CONSTRAINT [FK_${table.name}_${column.name}] `;
      stmt += `FOREIGN KEY ([${column.name}]) REFERENCES [${options.schema}].[${column.references.table}] ([${column.references.column}])`;
      
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

function mapIRTypeToSQLServer(irType: string): string {
  const typeMapping: Record<string, string> = {
    'Int': 'INT',
    'BigInt': 'BIGINT',
    'SmallInt': 'SMALLINT',
    'String': 'NVARCHAR(255)',
    'Boolean': 'BIT',
    'DateTime': 'DATETIME2',
    'Date': 'DATE',
    'Time': 'TIME',
    'Decimal': 'DECIMAL(18,2)',
    'Float': 'FLOAT',
    'Double': 'FLOAT',
    'Json': 'NVARCHAR(MAX)' // SQL Server 2016+ supports JSON functions with NVARCHAR
  };

  return typeMapping[irType] || irType;
}