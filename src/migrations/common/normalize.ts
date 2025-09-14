import { normalizeTypeName, extractTypeInfo } from '../../ir/mapping';

export interface ParsedColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isUnique: boolean;
  precision?: number;
  scale?: number;
  length?: number;
}

export interface ParsedConstraint {
  name?: string;
  type: 'primary_key' | 'foreign_key' | 'unique' | 'check';
  columns: string[];
  referencedTable?: string;
  referencedColumns?: string[];
  onDelete?: string;
  onUpdate?: string;
  expression?: string;
}

export interface ParsedIndex {
  name: string;
  table: string;
  columns: string[];
  unique: boolean;
  type?: string;
}

export interface ParsedTable {
  name: string;
  columns: ParsedColumn[];
  constraints: ParsedConstraint[];
  indexes: ParsedIndex[];
  comment?: string;
}

export interface ParsedSchema {
  tables: ParsedTable[];
  comment?: string;
}

export function normalizeColumnType(
  typeString: string,
  sourceDialect: 'sqlserver' | 'mysql' | 'oracle' | 'sqlite' | 'postgres' | 'mongodb'
): { type: string; precision?: number; scale?: number; length?: number } {
  const info = extractTypeInfo(typeString);
  const normalizedType = normalizeTypeName(info.baseType);
  
  return {
    type: normalizedType,
    precision: info.precision,
    scale: info.scale,
    length: info.length,
  };
}

export function normalizeConstraintAction(action: string): string {
  const normalized = action.toUpperCase().trim();
  switch (normalized) {
    case 'NO ACTION':
    case 'NOACTION':
      return 'NO ACTION';
    case 'SET NULL':
    case 'SETNULL':
      return 'SET NULL';
    case 'SET DEFAULT':
    case 'SETDEFAULT':
      return 'SET DEFAULT';
    case 'CASCADE':
      return 'CASCADE';
    case 'RESTRICT':
      return 'RESTRICT';
    default:
      return normalized;
  }
}

export function parseDefaultValue(
  defaultString: string,
  sourceDialect: 'sqlserver' | 'mysql' | 'oracle' | 'sqlite' | 'postgres' | 'mongodb'
): string {
  if (!defaultString) return '';
  
  const trimmed = defaultString.trim();
  const upper = trimmed.toUpperCase();
  
  // Handle common function mappings
  switch (sourceDialect) {
    case 'sqlserver':
      if (upper === 'GETDATE()') return 'now()';
      if (upper === 'NEWID()') return 'gen_random_uuid()';
      if (upper === 'CURRENT_USER') return 'CURRENT_USER';
      break;
      
    case 'mysql':
      if (upper === 'CURRENT_TIMESTAMP()' || upper === 'NOW()') return 'now()';
      if (upper === 'UUID()') return 'gen_random_uuid()';
      if (upper === 'USER()') return 'CURRENT_USER';
      break;
      
    case 'oracle':
      if (upper === 'SYSDATE') return 'now()';
      if (upper === 'SYSTIMESTAMP') return 'now()';
      if (upper === 'SYS_GUID()') return 'gen_random_uuid()';
      break;
      
    case 'sqlite':
      if (upper === 'CURRENT_TIMESTAMP') return 'CURRENT_TIMESTAMP';
      if (upper === 'DATETIME(\'NOW\')') return 'now()';
      break;
  }
  
  return trimmed;
}

export function cleanIdentifier(identifier: string): string {
  // Remove brackets, quotes, and normalize
  return identifier
    .replace(/^\[|\]$/g, '') // SQL Server brackets
    .replace(/^`|`$/g, '')   // MySQL backticks
    .replace(/^"|"$/g, '')   // Double quotes
    .replace(/^'|'$/g, '')   // Single quotes
    .trim();
}

export function isReservedWord(word: string): boolean {
  const reserved = new Set([
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP',
    'ALTER', 'TABLE', 'INDEX', 'VIEW', 'FUNCTION', 'PROCEDURE', 'TRIGGER',
    'DATABASE', 'SCHEMA', 'USER', 'GROUP', 'ROLE', 'GRANT', 'REVOKE',
    'PRIMARY', 'FOREIGN', 'KEY', 'UNIQUE', 'CHECK', 'DEFAULT', 'NULL',
    'NOT', 'AND', 'OR', 'IN', 'EXISTS', 'BETWEEN', 'LIKE', 'IS',
    'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'UNION',
    'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'JOIN', 'ON',
    'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'IF', 'WHILE', 'FOR',
    'BEGIN', 'COMMIT', 'ROLLBACK', 'TRANSACTION', 'LOCK', 'UNLOCK'
  ]);
  
  return reserved.has(word.toUpperCase());
}