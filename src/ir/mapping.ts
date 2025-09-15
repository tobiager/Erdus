/**
 * Common type mapping utilities for database conversions
 */

// SQL Server to PostgreSQL type mappings
export const SQL_SERVER_TO_POSTGRES: Record<string, string> = {
  // Integer types
  'INT': 'integer',
  'INTEGER': 'integer', 
  'BIGINT': 'bigint',
  'SMALLINT': 'smallint',
  'TINYINT': 'smallint',
  'BIT': 'boolean',
  
  // Decimal types
  'DECIMAL': 'numeric',
  'NUMERIC': 'numeric',
  'MONEY': 'money',
  'SMALLMONEY': 'money',
  'FLOAT': 'double precision',
  'REAL': 'real',
  
  // String types
  'VARCHAR': 'varchar',
  'NVARCHAR': 'varchar',
  'CHAR': 'char',
  'NCHAR': 'char', 
  'TEXT': 'text',
  'NTEXT': 'text',
  
  // Date/time types
  'DATETIME': 'timestamp with time zone',
  'DATETIME2': 'timestamp with time zone', 
  'SMALLDATETIME': 'timestamp',
  'DATE': 'date',
  'TIME': 'time',
  'DATETIMEOFFSET': 'timestamp with time zone',
  
  // Binary types
  'BINARY': 'bytea',
  'VARBINARY': 'bytea',
  'IMAGE': 'bytea',
  
  // Other types
  'UNIQUEIDENTIFIER': 'uuid',
  'XML': 'xml',
  'JSON': 'jsonb',
  'GEOGRAPHY': 'geometry',
  'GEOMETRY': 'geometry',
};

// MySQL to PostgreSQL type mappings  
export const MYSQL_TO_POSTGRES: Record<string, string> = {
  // Integer types
  'TINYINT': 'smallint',
  'SMALLINT': 'smallint',
  'MEDIUMINT': 'integer',
  'INT': 'integer',
  'INTEGER': 'integer',
  'BIGINT': 'bigint',
  
  // Decimal types
  'DECIMAL': 'numeric',
  'NUMERIC': 'numeric', 
  'FLOAT': 'real',
  'DOUBLE': 'double precision',
  'DOUBLE PRECISION': 'double precision',
  'BIT': 'bit',
  
  // String types
  'CHAR': 'char',
  'VARCHAR': 'varchar',
  'BINARY': 'bytea',
  'VARBINARY': 'bytea',
  'TINYBLOB': 'bytea',
  'BLOB': 'bytea',
  'MEDIUMBLOB': 'bytea',
  'LONGBLOB': 'bytea',
  'TINYTEXT': 'text',
  'TEXT': 'text',
  'MEDIUMTEXT': 'text',
  'LONGTEXT': 'text',
  
  // Date/time types
  'DATE': 'date',
  'TIME': 'time',
  'DATETIME': 'timestamp',
  'TIMESTAMP': 'timestamp with time zone',
  'YEAR': 'smallint',
  
  // Other types
  'JSON': 'jsonb',
  'GEOMETRY': 'geometry',
  'POINT': 'point',
  'LINESTRING': 'path',
  'POLYGON': 'polygon',
  'ENUM': 'text', // Will need special handling
  'SET': 'text[]', // Convert to array
};

// Oracle to PostgreSQL type mappings
export const ORACLE_TO_POSTGRES: Record<string, string> = {
  // Numeric types
  'NUMBER': 'numeric',
  'INTEGER': 'integer',
  'INT': 'integer',
  'SMALLINT': 'smallint',
  'DECIMAL': 'numeric',
  'NUMERIC': 'numeric',
  'FLOAT': 'double precision',
  'DOUBLE PRECISION': 'double precision',
  'REAL': 'real',
  'BINARY_FLOAT': 'real',
  'BINARY_DOUBLE': 'double precision',
  
  // String types
  'CHAR': 'char',
  'VARCHAR': 'varchar',
  'VARCHAR2': 'varchar',
  'NCHAR': 'char',
  'NVARCHAR2': 'varchar',
  'CLOB': 'text',
  'NCLOB': 'text',
  'LONG': 'text',
  
  // Date/time types
  'DATE': 'timestamp',
  'TIMESTAMP': 'timestamp',
  'TIMESTAMP WITH TIME ZONE': 'timestamp with time zone',
  'TIMESTAMP WITH LOCAL TIME ZONE': 'timestamp with time zone',
  'INTERVAL YEAR TO MONTH': 'interval',
  'INTERVAL DAY TO SECOND': 'interval',
  
  // Binary types
  'BLOB': 'bytea',
  'RAW': 'bytea',
  'LONG RAW': 'bytea',
  'BFILE': 'text', // File reference
  
  // Other types
  'XMLTYPE': 'xml',
  'JSON': 'jsonb',
  'ROWID': 'oid',
  'UROWID': 'text',
};

// SQLite to PostgreSQL type mappings
export const SQLITE_TO_POSTGRES: Record<string, string> = {
  'INTEGER': 'integer',
  'TEXT': 'text', 
  'REAL': 'real',
  'BLOB': 'bytea',
  'NUMERIC': 'numeric',
  'BOOLEAN': 'boolean',
  'DATE': 'date',
  'DATETIME': 'timestamp',
  'TIMESTAMP': 'timestamp',
  'TIME': 'time',
  'VARCHAR': 'varchar',
  'CHAR': 'char',
  'DECIMAL': 'numeric',
  'FLOAT': 'real',
  'DOUBLE': 'double precision',
  'BIGINT': 'bigint',
  'SMALLINT': 'smallint',
  'TINYINT': 'smallint',
};

// MongoDB to PostgreSQL type mappings
export const MONGODB_TO_POSTGRES: Record<string, string> = {
  'ObjectId': 'uuid', // or text with CHECK constraint
  'String': 'text',
  'Number': 'numeric',
  'Boolean': 'boolean',
  'Date': 'timestamp with time zone',
  'Array': 'jsonb', // Arrays become JSONB
  'Object': 'jsonb', // Objects become JSONB  
  'Binary': 'bytea',
  'Decimal128': 'numeric',
  'Double': 'double precision',
  'Int32': 'integer', 
  'Int64': 'bigint',
  'Timestamp': 'timestamp',
  'Mixed': 'jsonb',
};

// Common SQL Server functions to PostgreSQL equivalents
export const SQL_SERVER_FUNCTIONS: Record<string, string> = {
  'GETDATE()': 'now()',
  'GETUTCDATE()': "now() AT TIME ZONE 'UTC'",
  'NEWID()': 'gen_random_uuid()',
  'LEN()': 'length()',
  'DATALENGTH()': 'octet_length()',
  'ISNULL()': 'COALESCE()',
  'CHARINDEX()': 'strpos()',
  'SUBSTRING()': 'substr()',
  'DATEPART()': 'extract()',
  'DATEADD()': 'interval',
  'DATEDIFF()': 'extract()',
  'CAST()': 'CAST()',
  'CONVERT()': 'CAST()',
  'TOP': 'LIMIT',
};

// MySQL functions to PostgreSQL equivalents  
export const MYSQL_FUNCTIONS: Record<string, string> = {
  'NOW()': 'now()',
  'CURDATE()': 'current_date',
  'CURTIME()': 'current_time', 
  'UNIX_TIMESTAMP()': 'extract(epoch from now())',
  'UUID()': 'gen_random_uuid()',
  'LENGTH()': 'length()',
  'CONCAT()': 'CONCAT()', // Same
  'IFNULL()': 'COALESCE()',
  'IF()': 'CASE WHEN ... THEN ... ELSE ... END',
  'SUBSTR()': 'substr()',
  'SUBSTRING()': 'substr()',
  'LOCATE()': 'strpos()',
  'REPLACE()': 'replace()',
  'UPPER()': 'upper()',
  'LOWER()': 'lower()',
  'LIMIT': 'LIMIT', // Same
};

// Oracle functions to PostgreSQL equivalents
export const ORACLE_FUNCTIONS: Record<string, string> = {
  'SYSDATE': 'now()',
  'SYSTIMESTAMP': 'now()',
  'SYS_GUID()': 'gen_random_uuid()',
  'LENGTH()': 'length()',
  'SUBSTR()': 'substr()',
  'INSTR()': 'strpos()',
  'NVL()': 'COALESCE()',
  'NVL2()': 'CASE WHEN ... IS NULL THEN ... ELSE ... END',
  'DECODE()': 'CASE ... WHEN ... THEN ... END',
  'TO_CHAR()': 'to_char()',
  'TO_DATE()': 'to_date()',
  'TO_NUMBER()': 'to_number()',
  'TRUNC()': 'trunc()',
  'ROUND()': 'round()',
  'ROWNUM': 'ROW_NUMBER() OVER ()',
};

/**
 * Normalize a SQL type string to a canonical PostgreSQL type
 */
export function normalizeType(sqlType: string, sourceEngine: string): string {
  const upperType = sqlType.toUpperCase().trim();
  
  // Handle parameterized types like VARCHAR(50), DECIMAL(10,2)
  const baseType = upperType.split('(')[0];
  const params = upperType.includes('(') ? 
    upperType.substring(upperType.indexOf('(')) : '';
  
  let pgType: string;
  
  switch (sourceEngine.toLowerCase()) {
    case 'sqlserver':
    case 'mssql':
      pgType = SQL_SERVER_TO_POSTGRES[baseType] || 'text';
      break;
    case 'mysql':
      pgType = MYSQL_TO_POSTGRES[baseType] || 'text';
      break;
    case 'oracle':
      pgType = ORACLE_TO_POSTGRES[baseType] || 'text';
      break;
    case 'sqlite':
      pgType = SQLITE_TO_POSTGRES[baseType] || 'text';
      break;
    case 'mongodb':
      pgType = MONGODB_TO_POSTGRES[baseType] || 'jsonb';
      break;
    case 'postgresql':
    case 'postgres':
      return sqlType; // Already PostgreSQL
    default:
      pgType = 'text'; // Safe fallback
  }
  
  // Add parameters back for types that support them
  if (params && ['varchar', 'char', 'numeric', 'decimal'].includes(pgType)) {
    return pgType + params;
  }
  
  return pgType;
}

/**
 * Convert a SQL function call to PostgreSQL equivalent
 */
export function normalizeFunction(functionCall: string, sourceEngine: string): string {
  const upper = functionCall.toUpperCase().trim();
  
  let functions: Record<string, string>;
  switch (sourceEngine.toLowerCase()) {
    case 'sqlserver':
    case 'mssql':
      functions = SQL_SERVER_FUNCTIONS;
      break;
    case 'mysql':
      functions = MYSQL_FUNCTIONS;
      break;
    case 'oracle':
      functions = ORACLE_FUNCTIONS;
      break;
    default:
      return functionCall; // No conversion needed
  }
  
  for (const [source, target] of Object.entries(functions)) {
    if (upper.includes(source)) {
      return functionCall.replace(new RegExp(source, 'gi'), target);
    }
  }
  
  return functionCall;
}

/**
 * Get default value expression for PostgreSQL
 */
export function normalizeDefault(defaultValue: string, sourceEngine: string): string {
  if (!defaultValue) return defaultValue;
  
  // Remove parentheses and quotes if they wrap the entire expression
  let normalized = defaultValue.trim();
  if (normalized.startsWith('(') && normalized.endsWith(')')) {
    normalized = normalized.slice(1, -1);
  }
  
  return normalizeFunction(normalized, sourceEngine);
}