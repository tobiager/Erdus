import type { IRSchema } from '../../ir';
import { normalizeToIR, parseCreateTable, isDDLStatement, type ParsedTable } from '../common/normalize';

/**
 * Parse SQLite DDL script to IR Schema
 */
export function parseSQLite(input: string): IRSchema {
  const statements = splitStatements(input);
  const tables: ParsedTable[] = [];

  for (const statement of statements) {
    if (!isDDLStatement(statement)) continue;

    const upperStatement = statement.trim().toUpperCase();

    if (upperStatement.startsWith('CREATE TABLE')) {
      const table = parseCreateTable(statement);
      if (table) {
        // Apply SQLite specific normalizations
        normalizeSQLiteTable(table);
        tables.push(table);
      }
    }
  }

  return normalizeToIR(tables, 'sqlite');
}

function normalizeSQLiteTable(table: ParsedTable): void {
  for (const column of table.columns) {
    // SQLite type affinity - map common patterns
    const upperType = column.type.toUpperCase();
    
    if (upperType.includes('INT')) {
      column.type = 'INTEGER';
    } else if (upperType.includes('CHAR') || upperType.includes('TEXT')) {
      column.type = 'TEXT';
    } else if (upperType.includes('REAL') || upperType.includes('FLOA') || upperType.includes('DOUB')) {
      column.type = 'REAL';
    } else if (upperType.includes('BLOB')) {
      column.type = 'BLOB';
    } else if (upperType.includes('NUMERIC') || upperType.includes('DECIMAL')) {
      column.type = 'NUMERIC';
    }
  }
}

function splitStatements(sql: string): string[] {
  return sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
}