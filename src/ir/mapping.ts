import type { IRDataType } from './validators';

// Common type mappings used across generators
export interface TypeMapping {
  from: IRDataType;
  to: string;
  constraints?: {
    precision?: number;
    scale?: number;
    length?: number;
  };
}

// JSON Schema type mappings
export const JSON_SCHEMA_TYPES: Record<IRDataType, string> = {
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  date: 'string',
  datetime: 'string',
  timestamp: 'string',
  uuid: 'string',
  json: 'object',
  text: 'string',
  binary: 'string',
  decimal: 'number',
  integer: 'integer',
  bigint: 'integer',
};

// JSON Schema formats
export const JSON_SCHEMA_FORMATS: Partial<Record<IRDataType, string>> = {
  date: 'date',
  datetime: 'date-time',
  timestamp: 'date-time',
  uuid: 'uuid',
  binary: 'byte',
};

// Sequelize type mappings
export const SEQUELIZE_TYPES: Record<IRDataType, string> = {
  string: 'STRING',
  number: 'FLOAT',
  boolean: 'BOOLEAN',
  date: 'DATEONLY',
  datetime: 'DATE',
  timestamp: 'DATE',
  uuid: 'UUID',
  json: 'JSON',
  text: 'TEXT',
  binary: 'BLOB',
  decimal: 'DECIMAL',
  integer: 'INTEGER',
  bigint: 'BIGINT',
};

// PostgreSQL type mappings
export const POSTGRES_TYPES: Record<IRDataType, string> = {
  string: 'varchar',
  number: 'double precision',
  boolean: 'boolean',
  date: 'date',
  datetime: 'timestamp',
  timestamp: 'timestamp with time zone',
  uuid: 'uuid',
  json: 'jsonb',
  text: 'text',
  binary: 'bytea',
  decimal: 'numeric',
  integer: 'integer',
  bigint: 'bigint',
};

// SQL Server → PostgreSQL mappings
export const SQLSERVER_TO_POSTGRES: Record<string, string> = {
  'INT': 'integer',
  'BIGINT': 'bigint',
  'SMALLINT': 'smallint',
  'TINYINT': 'smallint',
  'BIT': 'boolean',
  'DECIMAL': 'numeric',
  'NUMERIC': 'numeric',
  'MONEY': 'money',
  'SMALLMONEY': 'money',
  'FLOAT': 'double precision',
  'REAL': 'real',
  'VARCHAR': 'varchar',
  'NVARCHAR': 'varchar',
  'CHAR': 'char',
  'NCHAR': 'char',
  'TEXT': 'text',
  'NTEXT': 'text',
  'DATETIME': 'timestamp with time zone',
  'DATETIME2': 'timestamp with time zone',
  'SMALLDATETIME': 'timestamp',
  'DATE': 'date',
  'TIME': 'time',
  'TIMESTAMP': 'bytea', // SQL Server timestamp is binary
  'UNIQUEIDENTIFIER': 'uuid',
  'XML': 'xml',
  'VARBINARY': 'bytea',
  'IMAGE': 'bytea',
  'BINARY': 'bytea',
};

// MySQL → PostgreSQL mappings
export const MYSQL_TO_POSTGRES: Record<string, string> = {
  'INT': 'integer',
  'INTEGER': 'integer',
  'BIGINT': 'bigint',
  'SMALLINT': 'smallint',
  'MEDIUMINT': 'integer',
  'TINYINT': 'smallint',
  'DECIMAL': 'numeric',
  'NUMERIC': 'numeric',
  'FLOAT': 'real',
  'DOUBLE': 'double precision',
  'BOOLEAN': 'boolean',
  'BOOL': 'boolean',
  'VARCHAR': 'varchar',
  'CHAR': 'char',
  'TEXT': 'text',
  'MEDIUMTEXT': 'text',
  'LONGTEXT': 'text',
  'TINYTEXT': 'text',
  'DATETIME': 'timestamp',
  'TIMESTAMP': 'timestamp with time zone',
  'DATE': 'date',
  'TIME': 'time',
  'YEAR': 'smallint',
  'JSON': 'jsonb',
  'BLOB': 'bytea',
  'MEDIUMBLOB': 'bytea',
  'LONGBLOB': 'bytea',
  'TINYBLOB': 'bytea',
  'BINARY': 'bytea',
  'VARBINARY': 'bytea',
  'ENUM': 'varchar', // Will need special handling
  'SET': 'text[]',
};

// Oracle → PostgreSQL mappings
export const ORACLE_TO_POSTGRES: Record<string, string> = {
  'NUMBER': 'numeric',
  'INTEGER': 'integer',
  'INT': 'integer',
  'SMALLINT': 'smallint',
  'FLOAT': 'double precision',
  'BINARY_FLOAT': 'real',
  'BINARY_DOUBLE': 'double precision',
  'VARCHAR2': 'varchar',
  'NVARCHAR2': 'varchar',
  'CHAR': 'char',
  'NCHAR': 'char',
  'CLOB': 'text',
  'NCLOB': 'text',
  'BLOB': 'bytea',
  'RAW': 'bytea',
  'LONG RAW': 'bytea',
  'DATE': 'timestamp',
  'TIMESTAMP': 'timestamp',
  'TIMESTAMP WITH TIME ZONE': 'timestamp with time zone',
  'TIMESTAMP WITH LOCAL TIME ZONE': 'timestamp with time zone',
  'INTERVAL YEAR TO MONTH': 'interval',
  'INTERVAL DAY TO SECOND': 'interval',
  'XMLTYPE': 'xml',
  'ROWID': 'oid',
  'UROWID': 'text',
};

// SQLite → PostgreSQL mappings
export const SQLITE_TO_POSTGRES: Record<string, string> = {
  'INTEGER': 'integer',
  'REAL': 'real',
  'TEXT': 'text',
  'BLOB': 'bytea',
  'NUMERIC': 'numeric',
  'BOOLEAN': 'boolean',
  'DATE': 'date',
  'DATETIME': 'timestamp',
  'TIMESTAMP': 'timestamp with time zone',
};

// Common default value mappings
export const DEFAULT_MAPPINGS: Record<string, string> = {
  'GETDATE()': 'now()',
  'CURRENT_TIMESTAMP': 'CURRENT_TIMESTAMP',
  'NEWID()': 'gen_random_uuid()',
  'UUID()': 'gen_random_uuid()',
  'RAND()': 'random()',
  'CURRENT_USER': 'CURRENT_USER',
  'USER': 'CURRENT_USER',
  'SYSDATE': 'now()',
  'SYSTIMESTAMP': 'now()',
};

// Constraint action mappings
export const CONSTRAINT_ACTIONS = [
  'CASCADE', 'SET NULL', 'SET DEFAULT', 'RESTRICT', 'NO ACTION'
] as const;

export type ConstraintAction = typeof CONSTRAINT_ACTIONS[number];

// Helper functions
export function normalizeTypeName(typeName: string): string {
  return typeName.toUpperCase().trim();
}

export function mapDefaultValue(value: string, _targetDialect: 'postgres' = 'postgres'): string {
  const normalized = value.toUpperCase().trim();
  return DEFAULT_MAPPINGS[normalized] || value;
}

export function getPostgresType(sourceType: string, sourceDialect: 'sqlserver' | 'mysql' | 'oracle' | 'sqlite' | 'postgres'): string {
  const normalized = normalizeTypeName(sourceType);
  
  switch (sourceDialect) {
    case 'sqlserver':
      return SQLSERVER_TO_POSTGRES[normalized] || 'text';
    case 'mysql':
      return MYSQL_TO_POSTGRES[normalized] || 'text';
    case 'oracle':
      return ORACLE_TO_POSTGRES[normalized] || 'text';
    case 'sqlite':
      return SQLITE_TO_POSTGRES[normalized] || 'text';
    case 'postgres':
      return normalized.toLowerCase();
    default:
      return 'text';
  }
}

export function extractTypeInfo(typeString: string): {
  baseType: string;
  precision?: number;
  scale?: number;
  length?: number;
} {
  // Extract type with precision/scale/length
  const match = typeString.match(/^(\w+)(?:\((\d+)(?:,\s*(\d+))?\))?/i);
  if (!match) {
    return { baseType: typeString };
  }

  const [, baseType, firstParam, secondParam] = match;
  
  // For DECIMAL(p,s) or NUMERIC(p,s)
  if (secondParam && ['DECIMAL', 'NUMERIC'].includes(baseType.toUpperCase())) {
    return {
      baseType,
      precision: parseInt(firstParam, 10),
      scale: parseInt(secondParam, 10),
    };
  }
  
  // For VARCHAR(n) or CHAR(n) etc.
  if (firstParam) {
    return {
      baseType,
      length: parseInt(firstParam, 10),
    };
  }

  return { baseType };
}