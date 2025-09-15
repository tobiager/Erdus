import { z } from 'zod';
import { IRDiagram, IRTable, IRColumn } from '../ir';
import { DatabaseEngine, MigrationResult } from '../types';

export interface MongoDBParseOptions {
  includeComments?: boolean;
  strictValidation?: boolean;
  inferRelationships?: boolean;
}

const MongoDBParseOptionsSchema = z.object({
  includeComments: z.boolean().optional().default(true),
  strictValidation: z.boolean().optional().default(false),
  inferRelationships: z.boolean().optional().default(true),
});

interface MongoDBCollection {
  name: string;
  documents: any[];
  schema?: any;
}

/**
 * MongoDB parser that extracts schema information from MongoDB collections
 * Infers schema from sample documents or explicit schema definitions
 */
export function parseMongoDB(input: string, options: MongoDBParseOptions = {}): MigrationResult {
  const opts = MongoDBParseOptionsSchema.parse(options);
  const tables: IRTable[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    let collections: MongoDBCollection[] = [];

    // Try to parse as MongoDB export (JSON array of collections)
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        collections = parsed;
      } else if (parsed.collections) {
        collections = parsed.collections;
      } else {
        // Single collection
        collections = [{ name: 'collection', documents: [parsed] }];
      }
    } catch {
      // Try to parse as JavaScript-style MongoDB schema
      collections = parseMongoSchema(input, warnings);
    }

    for (const collection of collections) {
      try {
        const table = convertCollectionToTable(collection, opts, warnings);
        tables.push(table);
      } catch (error) {
        errors.push(`Error parsing collection ${collection.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Infer relationships if enabled
    if (opts.inferRelationships) {
      inferRelationships(tables, warnings);
    }

    return {
      success: errors.length === 0,
      warnings,
      errors
    };

  } catch (error) {
    errors.push(`MongoDB parsing error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      warnings,
      errors
    };
  }
}

function parseMongoSchema(input: string, warnings: string[]): MongoDBCollection[] {
  const collections: MongoDBCollection[] = [];
  
  // Try to extract collection definitions from JavaScript-style schema
  const collectionRegex = /(?:db\.)?(\w+)\.(?:createCollection|insertMany|insertOne)\s*\(\s*([^)]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = collectionRegex.exec(input))) {
    const collectionName = match[1];
    const data = match[2];
    
    try {
      // Try to parse the data as JSON
      const documents = JSON.parse(data);
      collections.push({
        name: collectionName,
        documents: Array.isArray(documents) ? documents : [documents]
      });
    } catch {
      warnings.push(`Could not parse data for collection ${collectionName}`);
    }
  }

  return collections;
}

function convertCollectionToTable(collection: MongoDBCollection, options: MongoDBParseOptions, warnings: string[]): IRTable {
  const columns: IRColumn[] = [];
  const fieldTypes = new Map<string, Set<string>>();

  // Always add _id field for MongoDB collections
  columns.push({
    name: '_id',
    type: 'String',
    isPrimaryKey: true,
    isOptional: false,
    default: 'ObjectId()'
  });

  // Analyze sample documents to infer schema
  for (const doc of collection.documents.slice(0, 100)) { // Limit to first 100 docs for performance
    analyzeDocument(doc, '', fieldTypes, warnings);
  }

  // Convert field types to columns
  for (const [fieldPath, types] of fieldTypes.entries()) {
    if (fieldPath === '_id') continue; // Skip _id as we already added it

    const column: IRColumn = {
      name: fieldPath.replace(/\./g, '_'), // Replace dots with underscores for SQL compatibility
      type: inferTypeFromSet(types),
      isOptional: true, // MongoDB fields are optional by default
    };

    columns.push(column);
  }

  return {
    name: collection.name,
    columns
  };
}

function analyzeDocument(doc: any, prefix: string, fieldTypes: Map<string, Set<string>>, warnings: string[]): void {
  if (typeof doc !== 'object' || doc === null) return;

  for (const [key, value] of Object.entries(doc)) {
    const fieldPath = prefix ? `${prefix}.${key}` : key;
    
    if (!fieldTypes.has(fieldPath)) {
      fieldTypes.set(fieldPath, new Set());
    }

    const type = inferMongoType(value);
    fieldTypes.get(fieldPath)!.add(type);

    // Recursively analyze nested objects (flatten for SQL compatibility)
    if (type === 'Object' && typeof value === 'object' && !Array.isArray(value)) {
      analyzeDocument(value, fieldPath, fieldTypes, warnings);
    }
  }
}

function inferMongoType(value: any): string {
  if (value === null || value === undefined) return 'String';
  if (typeof value === 'string') return 'String';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'Int' : 'Float';
  }
  if (typeof value === 'boolean') return 'Boolean';
  if (value instanceof Date) return 'DateTime';
  if (Array.isArray(value)) return 'Json'; // Arrays as JSON
  if (typeof value === 'object') {
    // Check for MongoDB-specific types
    if (value.$oid) return 'String'; // ObjectId
    if (value.$date) return 'DateTime'; // ISODate
    if (value.$numberLong) return 'BigInt';
    if (value.$numberDecimal) return 'Decimal';
    return 'Json'; // Generic object as JSON
  }
  return 'String';
}

function inferTypeFromSet(types: Set<string>): string {
  const typeArray = Array.from(types);
  
  // If only one type, use it
  if (typeArray.length === 1) {
    return typeArray[0];
  }

  // If multiple numeric types, use the most general
  if (typeArray.every(t => ['Int', 'Float', 'BigInt', 'Decimal'].includes(t))) {
    if (typeArray.includes('Decimal')) return 'Decimal';
    if (typeArray.includes('Float')) return 'Float';
    if (typeArray.includes('BigInt')) return 'BigInt';
    return 'Int';
  }

  // Default to String for mixed types
  return 'String';
}

function inferRelationships(tables: IRTable[], warnings: string[]): void {
  // Look for potential foreign key relationships
  for (const table of tables) {
    for (const column of table.columns) {
      // Look for fields that might be references (ending with _id or Id)
      if (column.name.endsWith('_id') || column.name.endsWith('Id')) {
        const referencedTableName = column.name.replace(/_?[Ii]d$/, '');
        const referencedTable = tables.find(t => 
          t.name.toLowerCase() === referencedTableName.toLowerCase() ||
          t.name.toLowerCase() === referencedTableName.toLowerCase() + 's' ||
          t.name.toLowerCase() === referencedTableName.toLowerCase().slice(0, -1) // remove 's'
        );

        if (referencedTable && referencedTable !== table) {
          column.references = {
            table: referencedTable.name,
            column: '_id'
          };
          warnings.push(`Inferred relationship: ${table.name}.${column.name} -> ${referencedTable.name}._id`);
        }
      }
    }
  }
}

/**
 * Convert IR diagram to MongoDB-compatible schema or migration script
 */
export function generateMongoDB(diagram: IRDiagram, options: MongoDBParseOptions = {}): string {
  const opts = MongoDBParseOptionsSchema.parse(options);
  const statements: string[] = [];

  // Add header comment if enabled
  if (opts.includeComments) {
    statements.push('// Generated MongoDB schema');
    statements.push('// Created by Erdus Migration Tool');
    statements.push('');
  }

  for (const table of diagram.tables) {
    statements.push(generateCollectionSchema(table, opts));
    statements.push('');
  }

  return statements.join('\n');
}

function generateCollectionSchema(table: IRTable, options: MongoDBParseOptions): string {
  const lines: string[] = [];
  
  if (options.includeComments) {
    lines.push(`// Collection: ${table.name}`);
  }

  // Generate JSON Schema for validation
  const schema: any = {
    $jsonSchema: {
      bsonType: 'object',
      required: table.columns.filter(c => !c.isOptional).map(c => c.name),
      properties: {}
    }
  };

  for (const column of table.columns) {
    const mongoType = mapIRTypeToMongo(column.type);
    schema.$jsonSchema.properties[column.name] = {
      bsonType: mongoType
    };

    if (column.name !== '_id' && column.references) {
      schema.$jsonSchema.properties[column.name].description = `References ${column.references.table}.${column.references.column}`;
    }
  }

  lines.push(`db.createCollection("${table.name}", {`);
  lines.push(`  validator: ${JSON.stringify(schema, null, 2)}`);
  lines.push('});');

  // Generate indexes
  const indexes: string[] = [];
  
  // Primary key index (MongoDB _id is automatically indexed)
  const pkColumns = table.primaryKey || table.columns.filter(c => c.isPrimaryKey).map(c => c.name);
  
  // Unique indexes
  for (const column of table.columns) {
    if (column.isUnique && column.name !== '_id') {
      indexes.push(`db.${table.name}.createIndex({ "${column.name}": 1 }, { unique: true });`);
    }
  }

  // Foreign key indexes
  for (const column of table.columns) {
    if (column.references) {
      indexes.push(`db.${table.name}.createIndex({ "${column.name}": 1 });`);
    }
  }

  if (indexes.length > 0) {
    lines.push('');
    if (options.includeComments) {
      lines.push(`// Indexes for ${table.name}`);
    }
    lines.push(...indexes);
  }

  return lines.join('\n');
}

function mapIRTypeToMongo(irType: string): string {
  const typeMapping: Record<string, string> = {
    'Int': 'int',
    'BigInt': 'long',
    'SmallInt': 'int',
    'String': 'string',
    'Boolean': 'bool',
    'DateTime': 'date',
    'Date': 'date',
    'Time': 'string',
    'Decimal': 'decimal',
    'Float': 'double',
    'Double': 'double',
    'Json': 'object'
  };

  return typeMapping[irType] || 'string';
}