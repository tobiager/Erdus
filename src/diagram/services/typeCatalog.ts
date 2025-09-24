import { Dialect } from '../../types';

export interface TypeInfo {
  name: string;
  category: 'numeric' | 'text' | 'datetime' | 'boolean' | 'binary' | 'json' | 'enum' | 'uuid' | 'array';
  hasSize?: boolean;
  hasPrecision?: boolean;
  hasScale?: boolean;
  defaultSize?: number;
  description?: string;
  limitations?: string[];
}

const numericTypes: TypeInfo[] = [
  { name: 'smallint', category: 'numeric', description: '16-bit integer' },
  { name: 'integer', category: 'numeric', description: '32-bit integer' },
  { name: 'bigint', category: 'numeric', description: '64-bit integer' },
  { name: 'serial', category: 'numeric', description: 'Auto-incrementing integer' },
  { name: 'bigserial', category: 'numeric', description: 'Auto-incrementing bigint' },
  { name: 'decimal', category: 'numeric', hasPrecision: true, hasScale: true, description: 'Exact decimal number' },
  { name: 'numeric', category: 'numeric', hasPrecision: true, hasScale: true, description: 'Exact decimal number' },
  { name: 'real', category: 'numeric', description: '32-bit floating point' },
  { name: 'double precision', category: 'numeric', description: '64-bit floating point' }
];

const textTypes: TypeInfo[] = [
  { name: 'varchar', category: 'text', hasSize: true, defaultSize: 255, description: 'Variable-length string' },
  { name: 'char', category: 'text', hasSize: true, defaultSize: 1, description: 'Fixed-length string' },
  { name: 'text', category: 'text', description: 'Variable-length string (unlimited)' }
];

const datetimeTypes: TypeInfo[] = [
  { name: 'date', category: 'datetime', description: 'Date (year, month, day)' },
  { name: 'time', category: 'datetime', description: 'Time of day' },
  { name: 'timestamp', category: 'datetime', description: 'Date and time' },
  { name: 'timestamptz', category: 'datetime', description: 'Date and time with timezone' }
];

const booleanTypes: TypeInfo[] = [
  { name: 'boolean', category: 'boolean', description: 'True/false value' }
];

const binaryTypes: TypeInfo[] = [
  { name: 'bytea', category: 'binary', description: 'Binary data' }
];

const jsonTypes: TypeInfo[] = [
  { name: 'json', category: 'json', description: 'JSON data' },
  { name: 'jsonb', category: 'json', description: 'Binary JSON data (more efficient)' }
];

const uuidTypes: TypeInfo[] = [
  { name: 'uuid', category: 'uuid', description: 'Universally unique identifier' }
];

const defaultTypes = [
  ...numericTypes,
  ...textTypes,
  ...datetimeTypes,
  ...booleanTypes,
  ...binaryTypes,
  ...jsonTypes,
  ...uuidTypes
];

// Type catalog by dialect
export const typeCatalog: Record<Dialect, TypeInfo[]> = {
  default: defaultTypes,
  
  postgres: [
    ...defaultTypes,
    { name: 'array', category: 'array', description: 'Array of any type (append [] to type)' },
    { name: 'enum', category: 'enum', description: 'Custom enumerated type' }
  ],
  
  mysql: [
    { name: 'tinyint', category: 'numeric', description: '8-bit integer' },
    { name: 'smallint', category: 'numeric', description: '16-bit integer' },
    { name: 'mediumint', category: 'numeric', description: '24-bit integer' },
    { name: 'int', category: 'numeric', description: '32-bit integer' },
    { name: 'bigint', category: 'numeric', description: '64-bit integer' },
    { name: 'decimal', category: 'numeric', hasPrecision: true, hasScale: true, description: 'Exact decimal' },
    { name: 'float', category: 'numeric', description: '32-bit floating point' },
    { name: 'double', category: 'numeric', description: '64-bit floating point' },
    { name: 'varchar', category: 'text', hasSize: true, defaultSize: 255, description: 'Variable-length string' },
    { name: 'char', category: 'text', hasSize: true, defaultSize: 1, description: 'Fixed-length string' },
    { name: 'text', category: 'text', description: 'Long text' },
    { name: 'mediumtext', category: 'text', description: 'Medium text' },
    { name: 'longtext', category: 'text', description: 'Very long text' },
    { name: 'date', category: 'datetime', description: 'Date' },
    { name: 'time', category: 'datetime', description: 'Time' },
    { name: 'datetime', category: 'datetime', description: 'Date and time' },
    { name: 'timestamp', category: 'datetime', description: 'Timestamp' },
    { name: 'boolean', category: 'boolean', description: 'True/false (stored as TINYINT)' },
    { name: 'json', category: 'json', description: 'JSON data' },
    { name: 'enum', category: 'enum', description: 'Enumerated type' }
  ],
  
  mssql: [
    { name: 'tinyint', category: 'numeric', description: '8-bit integer' },
    { name: 'smallint', category: 'numeric', description: '16-bit integer' },
    { name: 'int', category: 'numeric', description: '32-bit integer' },
    { name: 'bigint', category: 'numeric', description: '64-bit integer' },
    { name: 'decimal', category: 'numeric', hasPrecision: true, hasScale: true, description: 'Exact decimal' },
    { name: 'numeric', category: 'numeric', hasPrecision: true, hasScale: true, description: 'Exact decimal' },
    { name: 'float', category: 'numeric', description: 'Floating point' },
    { name: 'real', category: 'numeric', description: 'Single precision float' },
    { name: 'varchar', category: 'text', hasSize: true, defaultSize: 50, description: 'Variable-length string' },
    { name: 'nvarchar', category: 'text', hasSize: true, defaultSize: 50, description: 'Unicode variable-length string' },
    { name: 'char', category: 'text', hasSize: true, defaultSize: 1, description: 'Fixed-length string' },
    { name: 'nchar', category: 'text', hasSize: true, defaultSize: 1, description: 'Unicode fixed-length string' },
    { name: 'text', category: 'text', description: 'Long text', limitations: ['Consider nvarchar(max) instead'] },
    { name: 'ntext', category: 'text', description: 'Long Unicode text', limitations: ['Consider nvarchar(max) instead'] },
    { name: 'date', category: 'datetime', description: 'Date' },
    { name: 'time', category: 'datetime', description: 'Time' },
    { name: 'datetime', category: 'datetime', description: 'Date and time' },
    { name: 'datetime2', category: 'datetime', description: 'Date and time (more precise)' },
    { name: 'datetimeoffset', category: 'datetime', description: 'Date and time with timezone' },
    { name: 'bit', category: 'boolean', description: 'Boolean (0 or 1)' },
    { name: 'uniqueidentifier', category: 'uuid', description: 'GUID' },
    { name: 'varbinary', category: 'binary', hasSize: true, description: 'Variable-length binary' },
    { name: 'binary', category: 'binary', hasSize: true, description: 'Fixed-length binary' }
  ],
  
  sqlite: [
    { name: 'integer', category: 'numeric', description: 'Integer (dynamic size)' },
    { name: 'real', category: 'numeric', description: 'Floating point number' },
    { name: 'text', category: 'text', description: 'Text string' },
    { name: 'blob', category: 'binary', description: 'Binary large object' },
    { name: 'numeric', category: 'numeric', description: 'Numeric value (flexible type)' }
  ]
};

export function getTypesForDialect(dialect: Dialect): TypeInfo[] {
  return typeCatalog[dialect] || typeCatalog.default;
}

export function validateTypeForDialect(type: string, dialect: Dialect): { valid: boolean; suggestion?: string; warnings?: string[] } {
  const types = getTypesForDialect(dialect);
  const typeInfo = types.find(t => t.name.toLowerCase() === type.toLowerCase());
  
  if (typeInfo) {
    return { 
      valid: true, 
      warnings: typeInfo.limitations 
    };
  }
  
  // Suggest alternatives
  const suggestions: Record<string, Record<Dialect, string>> = {
    'json': {
      mssql: 'nvarchar(max) with CHECK(ISJSON(column) = 1)',
      sqlite: 'text'
    },
    'uuid': {
      mysql: 'char(36)',
      sqlite: 'text'
    },
    'serial': {
      mysql: 'int AUTO_INCREMENT',
      mssql: 'int IDENTITY(1,1)',
      sqlite: 'integer PRIMARY KEY AUTOINCREMENT'
    }
  };
  
  const suggestion = suggestions[type.toLowerCase()]?.[dialect];
  
  return {
    valid: false,
    suggestion,
    warnings: suggestion ? [`Type '${type}' not natively supported. Consider: ${suggestion}`] : undefined
  };
}