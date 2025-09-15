import type { IRSchema } from '../../ir';

/**
 * Parse MongoDB schema (from JSON schema or similar) to IR Schema
 * This is a simplified implementation for MongoDB collections
 */
export function parseMongoDB(input: string): IRSchema {
  try {
    // Try to parse as JSON (could be a MongoDB schema dump)
    const data = JSON.parse(input);
    
    if (Array.isArray(data)) {
      // Array of collection schemas
      return parseCollectionSchemas(data);
    } else if (data.collections) {
      // Schema export format
      return parseCollectionSchemas(data.collections);
    } else {
      // Single collection
      return parseCollectionSchemas([data]);
    }
  } catch {
    // Not JSON, try to parse as MongoDB shell commands
    return parseMongoShellCommands(input);
  }
}

function parseCollectionSchemas(collections: any[]): IRSchema {
  const entities = collections.map(collection => {
    const name = collection.name || collection._id || 'UnknownCollection';
    
    // Extract fields from MongoDB schema
    const attributes = [];
    
    if (collection.schema || collection.fields) {
      const schema = collection.schema || collection.fields;
      
      for (const [fieldName, fieldSchema] of Object.entries(schema)) {
        const attr = parseMongoField(fieldName, fieldSchema as any);
        if (attr) attributes.push(attr);
      }
    }
    
    // Add default _id field if not present
    if (!attributes.find(attr => attr.name === '_id')) {
      attributes.unshift({
        name: '_id',
        type: 'uuid',
        isPrimaryKey: true,
        isOptional: false
      });
    }
    
    return {
      name,
      columns: attributes,
      attributes // For compatibility
    };
  });

  return {
    entities,
    relations: [] // MongoDB typically uses embedded documents instead of relations
  };
}

function parseMongoField(name: string, schema: any): any {
  let type = 'text';
  let isOptional = true;
  
  if (typeof schema === 'string') {
    type = mapMongoType(schema);
  } else if (schema.type) {
    type = mapMongoType(schema.type);
    isOptional = !schema.required;
  } else if (schema.bsonType) {
    type = mapMongoType(schema.bsonType);
    isOptional = !schema.required;
  }
  
  return {
    name,
    type,
    isOptional,
    isPrimaryKey: name === '_id'
  };
}

function mapMongoType(mongoType: string): string {
  const type = mongoType.toLowerCase();
  
  switch (type) {
    case 'objectid':
      return 'uuid';
    case 'string':
      return 'text';
    case 'number':
    case 'int':
    case 'long':
      return 'integer';
    case 'double':
      return 'numeric';
    case 'boolean':
    case 'bool':
      return 'boolean';
    case 'date':
      return 'timestamp with time zone';
    case 'array':
      return 'jsonb';
    case 'object':
      return 'jsonb';
    case 'bindata':
      return 'bytea';
    default:
      return 'jsonb'; // Default for complex MongoDB types
  }
}

function parseMongoShellCommands(input: string): IRSchema {
  // Very basic parsing of MongoDB shell commands
  // TODO: Implement proper parsing of createCollection, createIndex, etc.
  
  const entities = [];
  const lines = input.split('\n');
  
  for (const line of lines) {
    const createMatch = line.match(/db\.(\w+)\.createCollection/);
    if (createMatch) {
      const collectionName = createMatch[1];
      entities.push({
        name: collectionName,
        columns: [
          {
            name: '_id',
            type: 'uuid',
            isPrimaryKey: true,
            isOptional: false
          }
        ],
        attributes: [
          {
            name: '_id',
            type: 'uuid',
            isPrimaryKey: true,
            isOptional: false
          }
        ]
      });
    }
  }
  
  return {
    entities,
    relations: []
  };
}