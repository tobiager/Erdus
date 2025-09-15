import type { IRSchema } from '../../ir';
import { normalizeToIR, parseCreateTable, isDDLStatement, type ParsedTable } from '../common/normalize';

/**
 * Parse SQL Server DDL script to IR Schema
 */
export function parseSQLServer(input: string): IRSchema {
  const statements = splitStatements(input);
  const tables: ParsedTable[] = [];

  for (const statement of statements) {
    if (!isDDLStatement(statement)) continue;

    const upperStatement = statement.trim().toUpperCase();

    if (upperStatement.startsWith('CREATE TABLE')) {
      const table = parseCreateTable(statement);
      if (table) {
        // Apply SQL Server specific normalizations
        normalizeSQLServerTable(table);
        tables.push(table);
      }
    }
    // TODO: Handle CREATE INDEX, ALTER TABLE, etc.
  }

  return normalizeToIR(tables, 'sqlserver');
}

function normalizeSQLServerTable(table: ParsedTable): void {
  // Apply SQL Server specific column normalizations
  for (const column of table.columns) {
    // Handle SQL Server specific types
    column.type = normalizeSQLServerType(column.type);
    
    // Handle SQL Server specific defaults
    if (column.defaultValue) {
      column.defaultValue = normalizeSQLServerDefault(column.defaultValue);
    }
  }
}

function normalizeSQLServerType(type: string): string {
  const upperType = type.toUpperCase();
  
  // Handle common SQL Server type patterns
  if (upperType === 'BIT') return 'BIT';
  if (upperType.startsWith('NVARCHAR')) return type.replace(/NVARCHAR/i, 'VARCHAR');
  if (upperType.startsWith('NCHAR')) return type.replace(/NCHAR/i, 'CHAR');
  if (upperType === 'NTEXT') return 'TEXT';
  if (upperType === 'DATETIME2') return 'DATETIME2';
  if (upperType === 'UNIQUEIDENTIFIER') return 'UNIQUEIDENTIFIER';
  
  return type;
}

function normalizeSQLServerDefault(defaultValue: string): string {
  const upper = defaultValue.toUpperCase();
  
  // Handle SQL Server specific function calls
  if (upper === 'GETDATE()') return 'GETDATE()';
  if (upper === 'NEWID()') return 'NEWID()';
  if (upper === 'GETUTCDATE()') return 'GETUTCDATE()';
  
  // Remove SQL Server specific wrapping
  if (defaultValue.startsWith('((') && defaultValue.endsWith('))')) {
    return defaultValue.slice(2, -2);
  }
  if (defaultValue.startsWith('(') && defaultValue.endsWith(')')) {
    return defaultValue.slice(1, -1);
  }
  
  return defaultValue;
}

function splitStatements(sql: string): string[] {
  // Split by semicolons, but be careful about strings
  const statements: string[] = [];
  let current = '';
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    
    if ((char === '"' || char === "'") && !inString) {
      inString = true;
      stringChar = char;
    } else if (char === stringChar && inString) {
      // Check for escaped quotes
      if (i + 1 < sql.length && sql[i + 1] === char) {
        current += char + char;
        i++; // Skip the next character
        continue;
      }
      inString = false;
      stringChar = '';
    } else if (char === ';' && !inString) {
      if (current.trim()) {
        statements.push(current.trim());
      }
      current = '';
      continue;
    }
    
    current += char;
  }
  
  if (current.trim()) {
    statements.push(current.trim());
  }
  
  return statements;
}

/**
 * Enhanced SQL Server CREATE TABLE parser
 */
export function parseSQLServerCreateTable(sql: string): ParsedTable | null {
  // Handle SQL Server specific syntax
  const cleanedSQL = sql
    .replace(/\[([^\]]+)\]/g, '"$1"') // Convert [brackets] to "quotes"
    .replace(/dbo\./gi, '') // Remove schema prefix
    .replace(/GO\s*$/i, ''); // Remove GO statements

  const table = parseCreateTable(cleanedSQL);
  if (table) {
    normalizeSQLServerTable(table);
  }
  
  return table;
}

/**
 * Parse SQL Server specific constraints and indexes
 */
export function parseSQLServerConstraints(sql: string): {
  primaryKeys: string[];
  foreignKeys: any[];
  checks: any[];
} {
  const primaryKeys: string[] = [];
  const foreignKeys: any[] = [];
  const checks: any[] = [];

  // Extract PRIMARY KEY constraint
  const pkMatch = sql.match(/CONSTRAINT\s+(?:\[([^\]]+)\]|(\w+))\s+PRIMARY\s+KEY[^(]*\(([^)]+)\)/i);
  if (pkMatch) {
    const columns = pkMatch[3].split(',').map(col => 
      // eslint-disable-next-line no-useless-escape
      col.trim().replace(/[\[\]"]/g, '')
    );
    primaryKeys.push(...columns);
  }

  // Extract FOREIGN KEY constraints
  const fkMatches = sql.matchAll(/CONSTRAINT\s+(?:\[([^\]]+)\]|(\w+))\s+FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+(?:\[([^\]]+)\]|(\w+))\s*\(([^)]+)\)/gi);
  for (const match of fkMatches) {
    const name = match[1] || match[2];
    // eslint-disable-next-line no-useless-escape
    const column = match[3].trim().replace(/[\[\]"]/g, '');
    // eslint-disable-next-line no-useless-escape
    const refTable = (match[4] || match[5]).trim().replace(/[\[\]"]/g, '');
    // eslint-disable-next-line no-useless-escape
    const refColumn = match[6].trim().replace(/[\[\]"]/g, '');
    
    foreignKeys.push({
      name,
      column,
      referencedTable: refTable,
      referencedColumn: refColumn
    });
  }

  // Extract CHECK constraints
  const checkMatches = sql.matchAll(/CONSTRAINT\s+\[?([^\]]+)\]?\s+CHECK\s*\(([^)]+)\)/gi);
  for (const match of checkMatches) {
    checks.push({
      name: match[1],
      expression: match[2]
    });
  }

  return { primaryKeys, foreignKeys, checks };
}