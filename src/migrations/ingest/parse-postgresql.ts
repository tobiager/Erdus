import type { IRSchema } from '../../ir';
import { normalizeToIR, parseCreateTable, isDDLStatement, type ParsedTable } from '../common/normalize';

/**
 * Parse PostgreSQL DDL script to IR Schema
 */
export function parsePostgreSQL(input: string): IRSchema {
  const statements = splitStatements(input);
  const tables: ParsedTable[] = [];

  for (const statement of statements) {
    if (!isDDLStatement(statement)) continue;

    const upperStatement = statement.trim().toUpperCase();

    if (upperStatement.startsWith('CREATE TABLE')) {
      const table = parseCreateTable(statement);
      if (table) {
        tables.push(table);
      }
    }
    // TODO: Handle PostgreSQL specific syntax like ENUM types
  }

  return normalizeToIR(tables, 'postgresql');
}

function splitStatements(sql: string): string[] {
  return sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
}