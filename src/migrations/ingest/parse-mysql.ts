import type { IRSchema } from '../../ir';
import { normalizeToIR, parseCreateTable, isDDLStatement, type ParsedTable } from '../common/normalize';

/**
 * Parse MySQL DDL script to IR Schema
 */
export function parseMySQL(input: string): IRSchema {
  const statements = splitStatements(input);
  const tables: ParsedTable[] = [];

  for (const statement of statements) {
    if (!isDDLStatement(statement)) continue;

    const upperStatement = statement.trim().toUpperCase();

    if (upperStatement.startsWith('CREATE TABLE')) {
      const table = parseCreateTable(statement);
      if (table) {
        // Apply MySQL specific normalizations
        normalizeMySQLTable(table);
        tables.push(table);
      }
    }
    // TODO: Handle MySQL specific syntax
  }

  return normalizeToIR(tables, 'mysql');
}

function normalizeMySQLTable(table: ParsedTable): void {
  for (const column of table.columns) {
    // Handle MySQL specific types
    if (column.type.toUpperCase() === 'TINYINT(1)') {
      column.type = 'BOOLEAN';
    }
    
    // Handle AUTO_INCREMENT
    if (column.autoIncrement) {
      column.type = column.type.includes('BIGINT') ? 'BIGSERIAL' : 'SERIAL';
    }
  }
}

function splitStatements(sql: string): string[] {
  return sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
}