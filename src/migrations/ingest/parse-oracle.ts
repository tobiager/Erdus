import type { IRSchema } from '../../ir';
import { normalizeToIR, parseCreateTable, isDDLStatement, type ParsedTable } from '../common/normalize';

/**
 * Parse Oracle DDL script to IR Schema
 */
export function parseOracle(input: string): IRSchema {
  const statements = splitStatements(input);
  const tables: ParsedTable[] = [];

  for (const statement of statements) {
    if (!isDDLStatement(statement)) continue;

    const upperStatement = statement.trim().toUpperCase();

    if (upperStatement.startsWith('CREATE TABLE')) {
      const table = parseCreateTable(statement);
      if (table) {
        // Apply Oracle specific normalizations
        normalizeOracleTable(table);
        tables.push(table);
      }
    }
    // TODO: Handle Oracle specific syntax
  }

  return normalizeToIR(tables, 'oracle');
}

function normalizeOracleTable(table: ParsedTable): void {
  for (const column of table.columns) {
    // Handle Oracle NUMBER type without precision as INTEGER
    if (column.type.toUpperCase() === 'NUMBER') {
      column.type = 'INTEGER';
    }
    
    // Handle Oracle specific defaults
    if (column.defaultValue === 'SYSDATE') {
      column.defaultValue = 'SYSDATE';
    }
  }
}

function splitStatements(sql: string): string[] {
  return sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
}