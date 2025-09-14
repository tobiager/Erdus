import type { IRDiagram, IRTable, IRColumn } from './ir';

interface JsonSchemaProperty {
  type: string | string[];
  description?: string;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  default?: any;
  enum?: any[];
}

interface JsonSchemaObject {
  type: 'object';
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
  title?: string;
  description?: string;
}

interface JsonSchemaDefinitions {
  [key: string]: JsonSchemaObject;
}

interface JsonSchemaDocument {
  $schema: string;
  type: 'object';
  definitions: JsonSchemaDefinitions;
  oneOf?: Array<{ $ref: string }>;
}

function mapSqlTypeToJsonSchema(sqlType: string, isOptional: boolean = false): JsonSchemaProperty {
  const upperType = sqlType.toUpperCase();
  
  // Integer types
  if (upperType.startsWith('INT') || upperType === 'INTEGER' || upperType.startsWith('BIGINT') || upperType.startsWith('SMALLINT')) {
    const prop: JsonSchemaProperty = { type: 'integer' };
    if (upperType.startsWith('BIGINT')) {
      prop.minimum = -9223372036854775808;
      prop.maximum = 9223372036854775807;
    } else if (upperType.startsWith('SMALLINT')) {
      prop.minimum = -32768;
      prop.maximum = 32767;
    } else {
      prop.minimum = -2147483648;
      prop.maximum = 2147483647;
    }
    return prop;
  }
  
  // Serial types (auto-increment integers)
  if (upperType === 'SERIAL' || upperType === 'BIGSERIAL') {
    return { type: 'integer', minimum: 1 };
  }
  
  // Decimal/numeric types
  if (upperType.startsWith('DECIMAL') || upperType.startsWith('NUMERIC') || upperType.startsWith('FLOAT') || upperType.startsWith('DOUBLE') || upperType.startsWith('REAL')) {
    return { type: 'number' };
  }
  
  // String types
  const varcharMatch = upperType.match(/^VARCHAR\((\d+)\)$/);
  if (varcharMatch) {
    return { 
      type: 'string', 
      maxLength: parseInt(varcharMatch[1], 10) 
    };
  }
  
  const charMatch = upperType.match(/^CHAR\((\d+)\)$/);
  if (charMatch) {
    return { 
      type: 'string', 
      maxLength: parseInt(charMatch[1], 10),
      minLength: parseInt(charMatch[1], 10)
    };
  }
  
  if (upperType === 'TEXT') {
    return { type: 'string' };
  }
  
  // Date/time types
  if (upperType === 'DATE') {
    return { type: 'string', format: 'date' };
  }
  
  if (upperType === 'DATETIME' || upperType === 'TIMESTAMP' || upperType === 'TIMESTAMPTZ') {
    return { type: 'string', format: 'date-time' };
  }
  
  // Boolean type
  if (upperType === 'BOOLEAN' || upperType === 'BOOL') {
    return { type: 'boolean' };
  }
  
  // Default fallback
  return { type: 'string' };
}

function toPascalCase(str: string): string {
  return str
    .split(/[_\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Convert canonical IR to JSON Schema definitions.
 * Creates a schema with definitions for each table that can be used for API validation.
 */
export function irToJsonSchema(diagram: IRDiagram): string {
  const definitions: JsonSchemaDefinitions = {};
  
  for (const table of diagram.tables) {
    const properties: Record<string, JsonSchemaProperty> = {};
    const required: string[] = [];
    
    for (const column of table.columns) {
      const property = mapSqlTypeToJsonSchema(column.type, column.isOptional);
      
      // Add description for foreign key relationships
      if (column.references) {
        property.description = `Foreign key reference to ${column.references.table}.${column.references.column}`;
      }
      
      // Handle default values
      if (column.default) {
        try {
          // Try to parse as JSON for proper types
          if (column.default.startsWith("'") && column.default.endsWith("'")) {
            property.default = column.default.slice(1, -1); // Remove quotes for strings
          } else if (column.default.toLowerCase() === 'true') {
            property.default = true;
          } else if (column.default.toLowerCase() === 'false') {
            property.default = false;
          } else if (!isNaN(Number(column.default))) {
            property.default = Number(column.default);
          } else {
            property.default = column.default;
          }
        } catch {
          property.default = column.default;
        }
      }
      
      properties[column.name] = property;
      
      // Add to required if not optional and not auto-generated
      if (!column.isOptional && !column.type.toUpperCase().includes('SERIAL')) {
        required.push(column.name);
      }
    }
    
    const schemaObject: JsonSchemaObject = {
      type: 'object',
      title: toPascalCase(table.name),
      description: `Schema for ${table.name} table`,
      properties,
      additionalProperties: false
    };
    
    if (required.length > 0) {
      schemaObject.required = required;
    }
    
    definitions[toPascalCase(table.name)] = schemaObject;
  }
  
  const schema: JsonSchemaDocument = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    definitions,
    oneOf: Object.keys(definitions).map(key => ({ $ref: `#/definitions/${key}` }))
  };
  
  return JSON.stringify(schema, null, 2);
}