/**
 * Complete data type mappings for database languages
 * Part of Erdus - Universal ER Diagram Converter
 * @author tobiager
 */

interface DataTypeInfo {
  range?: string;
  signed?: string;
  unsigned?: string;
  min?: number;
  max?: number;
  precision?: boolean;
  scale?: boolean;
  length?: boolean;
  maxLength?: number;
  enumValues?: boolean;
  baseType?: boolean;
  format?: string;
  description: string;
}

interface DataTypeCategory {
  [key: string]: DataTypeInfo;
}

interface LanguageDataTypes {
  numeric?: DataTypeCategory;
  string?: DataTypeCategory;
  temporal?: DataTypeCategory;
  json?: DataTypeCategory;
  spatial?: DataTypeCategory;
  arrays?: DataTypeCategory;
  uuid?: DataTypeCategory;
  boolean?: DataTypeCategory;
}

export const DATA_TYPE_MAPPINGS: Record<string, LanguageDataTypes> = {
  mysql: {
    numeric: {
      'TINYINT': { range: '1 byte', signed: '-128 to 127', unsigned: '0 to 255', description: 'Very small integer' },
      'SMALLINT': { range: '2 bytes', signed: '-32,768 to 32,767', unsigned: '0 to 65,535', description: 'Small integer' },
      'MEDIUMINT': { range: '3 bytes', signed: '-8,388,608 to 8,388,607', unsigned: '0 to 16,777,215', description: 'Medium integer' },
      'INT': { range: '4 bytes', signed: '-2,147,483,648 to 2,147,483,647', unsigned: '0 to 4,294,967,295', description: 'Standard integer' },
      'BIGINT': { range: '8 bytes', signed: 'Very large range', unsigned: 'Very large range', description: 'Large integer' },
      'DECIMAL': { precision: true, scale: true, description: 'Fixed-point number' },
      'FLOAT': { precision: true, description: 'Single-precision floating-point' },
      'DOUBLE': { precision: true, description: 'Double-precision floating-point' },
      'BIT': { length: true, description: 'Bit-field type' }
    },
    string: {
      'CHAR': { length: true, maxLength: 255, description: 'Fixed-length string' },
      'VARCHAR': { length: true, maxLength: 65535, description: 'Variable-length string' },
      'BINARY': { length: true, maxLength: 255, description: 'Fixed-length binary string' },
      'VARBINARY': { length: true, maxLength: 65535, description: 'Variable-length binary string' },
      'TINYTEXT': { maxLength: 255, description: 'Very small text' },
      'TEXT': { maxLength: 65535, description: 'Small text' },
      'MEDIUMTEXT': { maxLength: 16777215, description: 'Medium text' },
      'LONGTEXT': { maxLength: 4294967295, description: 'Large text' },
      'ENUM': { enumValues: true, description: 'Enumeration of string values' },
      'SET': { enumValues: true, description: 'Set of string values' }
    },
    temporal: {
      'DATE': { format: 'YYYY-MM-DD', range: '1000-01-01 to 9999-12-31', description: 'Date value' },
      'TIME': { format: 'HH:MM:SS', range: '-838:59:59 to 838:59:59', description: 'Time value' },
      'DATETIME': { format: 'YYYY-MM-DD HH:MM:SS', range: '1000-01-01 00:00:00 to 9999-12-31 23:59:59', description: 'Date and time' },
      'TIMESTAMP': { format: 'YYYY-MM-DD HH:MM:SS', range: '1970-01-01 00:00:01 UTC to 2038-01-19 03:14:07 UTC', description: 'Timestamp value' },
      'YEAR': { format: 'YYYY', range: '1901 to 2155', description: 'Year value' }
    },
    json: {
      'JSON': { description: 'JSON data type' }
    },
    spatial: {
      'GEOMETRY': { description: 'Geometry data' },
      'POINT': { description: 'Point geometry' },
      'LINESTRING': { description: 'LineString geometry' },
      'POLYGON': { description: 'Polygon geometry' }
    }
  },
  postgresql: {
    numeric: {
      'SMALLINT': { range: '2 bytes', min: -32768, max: 32767, description: 'Small-range integer' },
      'INTEGER': { range: '4 bytes', min: -2147483648, max: 2147483647, description: 'Typical choice for integer' },
      'BIGINT': { range: '8 bytes', description: 'Large-range integer' },
      'DECIMAL': { precision: true, scale: true, description: 'User-specified precision' },
      'NUMERIC': { precision: true, scale: true, description: 'User-specified precision' },
      'REAL': { range: '4 bytes', description: 'Single precision floating-point' },
      'DOUBLE PRECISION': { range: '8 bytes', description: 'Double precision floating-point' },
      'SMALLSERIAL': { description: 'Auto-incrementing 2-byte integer' },
      'SERIAL': { description: 'Auto-incrementing 4-byte integer' },
      'BIGSERIAL': { description: 'Auto-incrementing 8-byte integer' }
    },
    string: {
      'CHAR': { length: true, description: 'Fixed-length character string' },
      'VARCHAR': { length: true, description: 'Variable-length character string' },
      'TEXT': { description: 'Variable-length character string' }
    },
    temporal: {
      'DATE': { format: 'YYYY-MM-DD', description: 'Calendar date' },
      'TIME': { format: 'HH:MM:SS', description: 'Time of day' },
      'TIMESTAMP': { format: 'YYYY-MM-DD HH:MM:SS', description: 'Date and time' },
      'TIMESTAMPTZ': { format: 'YYYY-MM-DD HH:MM:SS+TZ', description: 'Date and time with timezone' },
      'INTERVAL': { description: 'Time interval' }
    },
    json: {
      'JSON': { description: 'JSON data' },
      'JSONB': { description: 'Binary JSON data' }
    },
    arrays: {
      'ARRAY': { baseType: true, description: 'Array of any data type' }
    },
    uuid: {
      'UUID': { description: 'Universally unique identifier' }
    },
    boolean: {
      'BOOLEAN': { description: 'Boolean value (true/false)' }
    }
  },
  sqlite: {
    numeric: {
      'INTEGER': { description: 'Signed integer' },
      'REAL': { description: 'Floating point value' },
      'NUMERIC': { description: 'Numeric value' }
    },
    string: {
      'TEXT': { description: 'Text string' },
      'BLOB': { description: 'Binary data' }
    }
  },
  default: {
    numeric: {
      'INT': { description: 'Integer number' },
      'BIGINT': { description: 'Large integer' },
      'DECIMAL': { precision: true, scale: true, description: 'Decimal number' },
      'FLOAT': { description: 'Floating point number' },
      'DOUBLE': { description: 'Double precision number' }
    },
    string: {
      'VARCHAR': { length: true, description: 'Variable-length string' },
      'TEXT': { description: 'Large text' },
      'CHAR': { length: true, description: 'Fixed-length string' }
    },
    temporal: {
      'DATE': { description: 'Date value' },
      'TIME': { description: 'Time value' },
      'DATETIME': { description: 'Date and time' },
      'TIMESTAMP': { description: 'Timestamp value' }
    },
    boolean: {
      'BOOLEAN': { description: 'Boolean value' }
    }
  }
};

/**
 * Get all available data types for a specific database language
 */
export function getDataTypesForLanguage(language: string): string[] {
  const langTypes = DATA_TYPE_MAPPINGS[language] || DATA_TYPE_MAPPINGS.default;
  const types: string[] = [];
  
  Object.values(langTypes).forEach(category => {
    types.push(...Object.keys(category));
  });
  
  return types;
}

/**
 * Get information about a specific data type
 */
export function getDataTypeInfo(language: string, dataType: string): DataTypeInfo | undefined {
  const langTypes = DATA_TYPE_MAPPINGS[language] || DATA_TYPE_MAPPINGS.default;
  
  for (const category of Object.values(langTypes)) {
    if (category[dataType]) {
      return category[dataType];
    }
  }
  
  return undefined;
}
