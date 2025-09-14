import type { IRDiagram, IRTable, IRColumn } from '../../ir';

/**
 * JSON Schema type definitions for draft 2020-12
 */
export interface JSONSchemaProperty {
  type: string | string[];
  format?: string;
  description?: string;
  default?: unknown;
  nullable?: boolean;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean | JSONSchemaProperty;
  $ref?: string;
}

export interface JSONSchema {
  $schema: string;
  $id?: string;
  title?: string;
  description?: string;
  type: string;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
  definitions?: Record<string, JSONSchemaProperty>;
}

export interface JSONSchemaCollection {
  schemas: Record<string, JSONSchema>;
  definitions: Record<string, JSONSchemaProperty>;
}

/**
 * Options for JSON Schema generation
 */
export interface JSONSchemaOptions {
  /** Include nullable fields for optional columns */
  includeNullable?: boolean;
  /** Generate separate schemas for each table or a combined schema */
  separateSchemas?: boolean;
  /** Base URL for schema IDs */
  baseUrl?: string;
  /** Include foreign key references as $ref */
  includeForeignKeyRefs?: boolean;
  /** Include table descriptions */
  includeDescriptions?: boolean;
}

/**
 * Map IR column types to JSON Schema types with format specifications
 */
function mapColumnTypeToJSONSchema(irType: string): Pick<JSONSchemaProperty, 'type' | 'format' | 'minimum' | 'maximum' | 'minLength' | 'maxLength'> {
  const upperType = irType.toUpperCase();
  
  // Handle common SQL types
  if (upperType === 'SERIAL' || upperType === 'BIGSERIAL' || upperType === 'INTEGER' || upperType === 'INT' || upperType.startsWith('INT')) {
    return { type: 'integer', format: 'int32' };
  }
  
  if (upperType === 'BIGINT') {
    return { type: 'integer', format: 'int64' };
  }
  
  if (upperType === 'SMALLINT') {
    return { type: 'integer', minimum: -32768, maximum: 32767 };
  }
  
  if (upperType.startsWith('DECIMAL') || upperType.startsWith('NUMERIC') || upperType === 'REAL' || upperType === 'DOUBLE PRECISION' || upperType === 'FLOAT') {
    return { type: 'number' };
  }
  
  if (upperType === 'BOOLEAN' || upperType === 'BOOL') {
    return { type: 'boolean' };
  }
  
  if (upperType.startsWith('VARCHAR') || upperType.startsWith('CHAR') || upperType === 'TEXT') {
    const schema: Pick<JSONSchemaProperty, 'type' | 'maxLength'> = { type: 'string' };
    
    // Extract length from VARCHAR(n) or CHAR(n)
    const lengthMatch = irType.match(/\((\d+)\)/);
    if (lengthMatch) {
      schema.maxLength = parseInt(lengthMatch[1], 10);
    }
    
    return schema;
  }
  
  if (upperType === 'UUID') {
    return { type: 'string', format: 'uuid' };
  }
  
  if (upperType.includes('TIMESTAMP') || upperType.includes('DATETIME')) {
    return { type: 'string', format: 'date-time' };
  }
  
  if (upperType === 'DATE') {
    return { type: 'string', format: 'date' };
  }
  
  if (upperType === 'TIME') {
    return { type: 'string', format: 'time' };
  }
  
  if (upperType === 'JSON' || upperType === 'JSONB') {
    return { type: 'object' };
  }
  
  // Default to string for unknown types
  return { type: 'string' };
}

/**
 * Generate a JSON Schema property from an IR column
 */
function generatePropertyFromColumn(column: IRColumn, options: JSONSchemaOptions): JSONSchemaProperty {
  const baseSchema = mapColumnTypeToJSONSchema(column.type);
  
  const property: JSONSchemaProperty = {
    ...baseSchema,
    description: options.includeDescriptions ? `Column: ${column.name}` : undefined,
  };
  
  // Handle nullable/optional fields
  if (column.isOptional && options.includeNullable) {
    if (Array.isArray(property.type)) {
      property.type = [...property.type, 'null'];
    } else {
      property.type = [property.type, 'null'];
    }
  }
  
  // Handle default values
  if (column.default !== undefined) {
    // Parse common default values
    const defaultStr = column.default.toLowerCase();
    if (defaultStr === 'true' || defaultStr === 'false') {
      property.default = defaultStr === 'true';
    } else if (!isNaN(Number(defaultStr))) {
      property.default = Number(defaultStr);
    } else if (defaultStr.startsWith("'") && defaultStr.endsWith("'")) {
      property.default = defaultStr.slice(1, -1);
    }
  }
  
  // Handle foreign key references
  if (column.references && options.includeForeignKeyRefs) {
    property.$ref = `#/definitions/${column.references.table}`;
  }
  
  return property;
}

/**
 * Generate a JSON Schema for a single table
 */
function generateSchemaForTable(table: IRTable, options: JSONSchemaOptions): JSONSchema {
  const properties: Record<string, JSONSchemaProperty> = {};
  const required: string[] = [];
  
  for (const column of table.columns) {
    properties[column.name] = generatePropertyFromColumn(column, options);
    
    // Add to required if not optional and not nullable
    if (!column.isOptional) {
      required.push(column.name);
    }
  }
  
  const schema: JSONSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties,
    additionalProperties: false,
  };
  
  if (options.baseUrl) {
    schema.$id = `${options.baseUrl}/${table.name}.json`;
  }
  
  if (options.includeDescriptions) {
    schema.title = table.name;
    schema.description = `Schema for ${table.name} table`;
  }
  
  if (required.length > 0) {
    schema.required = required;
  }
  
  return schema;
}

/**
 * Convert IR diagram to JSON Schema(s) (draft 2020-12)
 * 
 * @param diagram - The IR diagram to convert
 * @param options - Configuration options for schema generation
 * @returns JSON Schema collection or single schema
 * 
 * @example
 * ```typescript
 * const diagram: IRDiagram = {
 *   tables: [
 *     {
 *       name: 'User',
 *       columns: [
 *         { name: 'id', type: 'SERIAL', isPrimaryKey: true },
 *         { name: 'name', type: 'VARCHAR(100)' },
 *         { name: 'email', type: 'VARCHAR(255)', isUnique: true }
 *       ]
 *     }
 *   ]
 * };
 * 
 * const result = irToJSONSchema(diagram, { 
 *   includeNullable: true,
 *   separateSchemas: true 
 * });
 * ```
 */
export function irToJSONSchema(
  diagram: IRDiagram, 
  options: JSONSchemaOptions = {}
): JSONSchemaCollection | JSONSchema {
  const defaultOptions: Required<JSONSchemaOptions> = {
    includeNullable: false,
    separateSchemas: true,
    baseUrl: '',
    includeForeignKeyRefs: false,
    includeDescriptions: true,
    ...options,
  };
  
  if (defaultOptions.separateSchemas) {
    const schemas: Record<string, JSONSchema> = {};
    const definitions: Record<string, JSONSchemaProperty> = {};
    
    // Generate individual schemas for each table
    for (const table of diagram.tables) {
      schemas[table.name] = generateSchemaForTable(table, defaultOptions);
      
      // Also add to definitions for referencing
      definitions[table.name] = {
        type: 'object',
        properties: schemas[table.name].properties,
        required: schemas[table.name].required,
        additionalProperties: false,
      };
    }
    
    return { schemas, definitions };
  } else {
    // Generate a single combined schema
    const properties: Record<string, JSONSchemaProperty> = {};
    const definitions: Record<string, JSONSchemaProperty> = {};
    
    for (const table of diagram.tables) {
      const tableSchema = generateSchemaForTable(table, defaultOptions);
      properties[table.name] = {
        type: 'object',
        properties: tableSchema.properties,
        required: tableSchema.required,
        additionalProperties: false,
      };
      
      definitions[table.name] = properties[table.name];
    }
    
    const combinedSchema: JSONSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties,
      definitions,
      additionalProperties: false,
    };
    
    if (defaultOptions.baseUrl) {
      combinedSchema.$id = `${defaultOptions.baseUrl}/schema.json`;
    }
    
    if (defaultOptions.includeDescriptions) {
      combinedSchema.title = 'Database Schema';
      combinedSchema.description = 'Complete database schema with all tables';
    }
    
    return combinedSchema;
  }
}

/**
 * Convert JSON Schema collection to formatted JSON string
 */
export function formatJSONSchemaOutput(result: JSONSchemaCollection | JSONSchema): string {
  if ('schemas' in result) {
    // Multiple schemas - format as separate JSON documents
    const outputs: string[] = [];
    
    for (const [tableName, schema] of Object.entries(result.schemas)) {
      outputs.push(`// ${tableName}.json`);
      outputs.push(JSON.stringify(schema, null, 2));
      outputs.push('');
    }
    
    return outputs.join('\n');
  } else {
    // Single schema
    return JSON.stringify(result, null, 2);
  }
}