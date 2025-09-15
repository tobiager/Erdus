import type { IRSchema } from '../ir';
import { parseSQLServer } from './ingest/parse-sqlserver';
import { parseMySQL } from './ingest/parse-mysql';
import { parsePostgreSQL } from './ingest/parse-postgresql';
import { parseOracle } from './ingest/parse-oracle';
import { parseSQLite } from './ingest/parse-sqlite';
import { parseMongoDB } from './ingest/parse-mongodb';
import { emitPostgresSQL } from './emit/emit-postgres';

export type SupportedEngine = 'oracle' | 'mysql' | 'sqlserver' | 'postgresql' | 'mongodb' | 'sqlite';

export interface MigrationOptions {
  schema?: string;
  withRLS?: boolean;
  preserveComments?: boolean;
}

/**
 * Convert a SQL script from one database engine to Supabase/PostgreSQL
 */
export function migrateScriptToSupabase(
  input: string,
  engine: SupportedEngine,
  options: MigrationOptions = {}
): string {
  // Step 1: Parse the input SQL to IR
  const ir = parseToIR(input, engine);
  
  // Step 2: Emit PostgreSQL SQL from IR
  const postgresSQL = emitPostgresSQL(ir, options);
  
  return postgresSQL;
}

/**
 * Parse SQL DDL script to IR Schema based on the source engine
 */
function parseToIR(input: string, engine: SupportedEngine): IRSchema {
  switch (engine) {
    case 'sqlserver':
      return parseSQLServer(input);
    case 'mysql':
      return parseMySQL(input);
    case 'postgresql':
      return parsePostgreSQL(input);
    case 'oracle':
      return parseOracle(input);
    case 'sqlite':
      return parseSQLite(input);
    case 'mongodb':
      return parseMongoDB(input);
    default:
      throw new Error(`Unsupported database engine: ${engine}`);
  }
}

/**
 * Utility function to clean and normalize SQL input
 */
export function cleanSQL(sql: string): string {
  return sql
    // Remove SQL comments
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract CREATE TABLE statements from SQL script
 */
export function extractCreateTableStatements(sql: string): string[] {
  const cleanedSQL = cleanSQL(sql);
  const createTablePattern = /CREATE\s+TABLE\s+[^;]+;/gi;
  return cleanedSQL.match(createTablePattern) || [];
}

/**
 * Extract CREATE INDEX statements from SQL script
 */
export function extractCreateIndexStatements(sql: string): string[] {
  const cleanedSQL = cleanSQL(sql);
  const createIndexPattern = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+[^;]+;/gi;
  return cleanedSQL.match(createIndexPattern) || [];
}

/**
 * Extract ALTER TABLE statements from SQL script
 */
export function extractAlterTableStatements(sql: string): string[] {
  const cleanedSQL = cleanSQL(sql);
  const alterTablePattern = /ALTER\s+TABLE\s+[^;]+;/gi;
  return cleanedSQL.match(alterTablePattern) || [];
}