import type { IRSchema, IRDiagram, IRAttribute, IRColumn } from '../../ir';
import { validateIRSchema, validateIRDiagram } from '../../ir/validators';
import { JSON_SCHEMA_TYPES, JSON_SCHEMA_FORMATS } from '../../ir/mapping';

interface JSONSchemaProperty {
  type: string | string[];
  format?: string;
  description?: string;
  enum?: string[];
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  default?: any;
  nullable?: boolean;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  'x-unique'?: boolean;
  'x-foreignKey'?: {
    table: string;
    column: string;
    onDelete?: string;
    onUpdate?: string;
  };
}

interface JSONSchema {
  $schema: string;
  $id?: string;
  type: 'object';
  title?: string;
  description?: string;
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface JSONSchemaOptions {
  $idPrefix?: string;
  target?: 'openapi' | 'ajv';
  includeTitle?: boolean;
  includeDescription?: boolean;
  strictAdditionalProperties?: boolean;
}

export function toJSONSchema(
  ir: IRSchema | IRDiagram,
  options: JSONSchemaOptions = {}
): Record<string, JSONSchema> {
  const opts = {
    target: 'ajv' as const,
    includeTitle: true,
    includeDescription: true,
    strictAdditionalProperties: false,
    ...options,
  };

  let schemas: Record<string, JSONSchema>;

  // Handle both new IRSchema and legacy IRDiagram formats
  if ('entities' in ir) {
    const validIR = validateIRSchema(ir);
    schemas = generateFromIRSchema(validIR, opts);
  } else {
    const validIR = validateIRDiagram(ir);
    schemas = generateFromIRDiagram(validIR, opts);
  }

  return schemas;
}

function generateFromIRSchema(ir: IRSchema, options: JSONSchemaOptions): Record<string, JSONSchema> {
  const schemas: Record<string, JSONSchema> = {};

  for (const entity of ir.entities) {
    const schema: JSONSchema = {
      $schema: getSchemaVersion(options.target!),
      type: 'object',
      properties: {},
      additionalProperties: options.strictAdditionalProperties ? false : undefined,
    };

    if (options.$idPrefix) {
      schema.$id = `${options.$idPrefix}/${entity.name}.json`;
    }

    if (options.includeTitle) {
      schema.title = entity.name;
    }

    if (options.includeDescription && entity.comment) {
      schema.description = entity.comment;
    }

    const required: string[] = [];

    for (const attr of entity.attributes) {
      const property = mapAttributeToProperty(attr, options.target!);
      schema.properties[attr.name] = property;

      // Add to required if not nullable and not optional
      if (!attr.nullable && !attr.default) {
        required.push(attr.name);
      }
    }

    if (required.length > 0) {
      schema.required = required;
    }

    schemas[entity.name] = schema;
  }

  return schemas;
}

function generateFromIRDiagram(ir: IRDiagram, options: JSONSchemaOptions): Record<string, JSONSchema> {
  const schemas: Record<string, JSONSchema> = {};

  for (const table of ir.tables) {
    const schema: JSONSchema = {
      $schema: getSchemaVersion(options.target!),
      type: 'object',
      properties: {},
      additionalProperties: options.strictAdditionalProperties ? false : undefined,
    };

    if (options.$idPrefix) {
      schema.$id = `${options.$idPrefix}/${table.name}.json`;
    }

    if (options.includeTitle) {
      schema.title = table.name;
    }

    const required: string[] = [];

    for (const column of table.columns) {
      const property = mapColumnToProperty(column, options.target!);
      schema.properties[column.name] = property;

      // Add to required if not optional and not nullable
      if (!column.isOptional && !column.default) {
        required.push(column.name);
      }
    }

    if (required.length > 0) {
      schema.required = required;
    }

    schemas[table.name] = schema;
  }

  return schemas;
}

function mapAttributeToProperty(attr: IRAttribute, target: 'openapi' | 'ajv'): JSONSchemaProperty {
  const property: JSONSchemaProperty = {
    type: JSON_SCHEMA_TYPES[attr.type] || 'string',
  };

  // Add format if available
  const format = JSON_SCHEMA_FORMATS[attr.type];
  if (format) {
    property.format = format;
  }

  // Handle nullable
  if (attr.nullable) {
    if (target === 'openapi') {
      property.nullable = true;
    } else {
      // For JSON Schema draft 7+, use type array
      property.type = [property.type as string, 'null'];
    }
  }

  // Add default value
  if (attr.default !== undefined) {
    property.default = parseDefaultValue(attr.default, attr.type);
  }

  // Add constraints based on type and metadata
  addTypeConstraints(property, attr);

  // Add unique marker
  if (attr.unique) {
    property['x-unique'] = true;
  }

  // Add foreign key information
  if (attr.references) {
    property['x-foreignKey'] = {
      table: attr.references.table,
      column: attr.references.column,
      onDelete: attr.references.onDelete,
      onUpdate: attr.references.onUpdate,
    };
  }

  return property;
}

function mapColumnToProperty(column: IRColumn, target: 'openapi' | 'ajv'): JSONSchemaProperty {
  const property: JSONSchemaProperty = {
    type: inferJSONSchemaType(column.type),
  };

  // Add format based on type
  const format = inferJSONSchemaFormat(column.type);
  if (format) {
    property.format = format;
  }

  // Handle nullable (isOptional in legacy format)
  if (column.isOptional) {
    if (target === 'openapi') {
      property.nullable = true;
    } else {
      property.type = [property.type as string, 'null'];
    }
  }

  // Add default value
  if (column.default !== undefined) {
    property.default = parseDefaultValue(column.default, 'string'); // Legacy doesn't have typed defaults
  }

  // Add unique marker
  if (column.isUnique) {
    property['x-unique'] = true;
  }

  // Add foreign key information
  if (column.references) {
    property['x-foreignKey'] = {
      table: column.references.table,
      column: column.references.column,
      onDelete: column.references.onDelete,
      onUpdate: column.references.onUpdate,
    };
  }

  // Add legacy type constraints
  addLegacyTypeConstraints(property, column.type);

  return property;
}

function addTypeConstraints(property: JSONSchemaProperty, attr: IRAttribute): void {
  switch (attr.type) {
    case 'string':
      if (attr.length) {
        property.maxLength = attr.length;
      }
      break;
    case 'decimal':
      if (attr.precision && attr.scale !== undefined) {
        // For decimals, we can set reasonable bounds
        const maxValue = Math.pow(10, attr.precision - attr.scale) - Math.pow(10, -attr.scale);
        property.maximum = maxValue;
        property.minimum = -maxValue;
      }
      break;
    case 'integer':
      property.minimum = -2147483648; // INT32_MIN
      property.maximum = 2147483647;  // INT32_MAX
      break;
    case 'bigint':
      // JavaScript safe integer limits
      property.minimum = Number.MIN_SAFE_INTEGER;
      property.maximum = Number.MAX_SAFE_INTEGER;
      break;
  }
}

function addLegacyTypeConstraints(property: JSONSchemaProperty, typeString: string): void {
  const upperType = typeString.toUpperCase();
  
  // Extract length from VARCHAR(n), etc.
  const lengthMatch = upperType.match(/VARCHAR\((\d+)\)/);
  if (lengthMatch) {
    property.maxLength = parseInt(lengthMatch[1], 10);
  }

  // Handle common types
  if (upperType.includes('INT')) {
    property.type = 'integer';
  } else if (upperType.includes('DECIMAL') || upperType.includes('NUMERIC')) {
    property.type = 'number';
  } else if (upperType.includes('BOOL')) {
    property.type = 'boolean';
  } else if (upperType.includes('DATE') || upperType.includes('TIME')) {
    property.format = 'date-time';
  } else if (upperType.includes('UUID')) {
    property.format = 'uuid';
  }
}

function inferJSONSchemaType(typeString: string): string {
  const upperType = typeString.toUpperCase();
  
  if (upperType.includes('INT') || upperType.includes('SERIAL')) {
    return 'integer';
  }
  if (upperType.includes('DECIMAL') || upperType.includes('NUMERIC') || upperType.includes('FLOAT') || upperType.includes('DOUBLE')) {
    return 'number';
  }
  if (upperType.includes('BOOL')) {
    return 'boolean';
  }
  if (upperType.includes('JSON')) {
    return 'object';
  }
  
  return 'string';
}

function inferJSONSchemaFormat(typeString: string): string | undefined {
  const upperType = typeString.toUpperCase();
  
  if (upperType.includes('DATE') && !upperType.includes('TIME')) {
    return 'date';
  }
  if (upperType.includes('TIME') || upperType.includes('TIMESTAMP')) {
    return 'date-time';
  }
  if (upperType.includes('UUID')) {
    return 'uuid';
  }
  if (upperType.includes('EMAIL')) {
    return 'email';
  }
  if (upperType.includes('URI') || upperType.includes('URL')) {
    return 'uri';
  }
  
  return undefined;
}

function parseDefaultValue(defaultValue: string, dataType: any): any {
  if (!defaultValue) return undefined;

  const lower = defaultValue.toLowerCase().trim();
  
  // Handle boolean defaults
  if (lower === 'true' || lower === 'false') {
    return lower === 'true';
  }
  
  // Handle null
  if (lower === 'null') {
    return null;
  }
  
  // Handle numeric defaults
  if (/^-?\d+(\.\d+)?$/.test(defaultValue)) {
    return parseFloat(defaultValue);
  }
  
  // Handle quoted strings
  if (defaultValue.startsWith("'") && defaultValue.endsWith("'")) {
    return defaultValue.slice(1, -1);
  }
  
  // Functions and expressions - return as string for now
  return defaultValue;
}

function getSchemaVersion(target: 'openapi' | 'ajv'): string {
  switch (target) {
    case 'openapi':
      return 'http://json-schema.org/draft-04/schema#';
    case 'ajv':
      return 'http://json-schema.org/draft-07/schema#';
    default:
      return 'http://json-schema.org/draft-07/schema#';
  }
}