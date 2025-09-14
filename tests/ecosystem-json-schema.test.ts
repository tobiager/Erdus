import { describe, it, expect } from 'vitest';
import { irToJSONSchema, formatJSONSchemaOutput } from '../src/ecosystem/json-schema';
import type { IRDiagram } from '../src/ir';

const testDiagram: IRDiagram = {
  tables: [
    {
      name: 'User',
      columns: [
        { name: 'id', type: 'SERIAL', isPrimaryKey: true },
        { name: 'name', type: 'VARCHAR(100)' },
        { name: 'email', type: 'VARCHAR(255)', isUnique: true },
        { name: 'age', type: 'INTEGER', isOptional: true },
        { name: 'is_active', type: 'BOOLEAN', default: 'true' },
        { name: 'created_at', type: 'TIMESTAMPTZ', default: 'now()' },
      ],
    },
    {
      name: 'Post',
      columns: [
        { name: 'id', type: 'UUID', isPrimaryKey: true },
        { name: 'title', type: 'VARCHAR(200)' },
        { name: 'content', type: 'TEXT', isOptional: true },
        { name: 'user_id', type: 'INTEGER', references: { table: 'User', column: 'id' } },
        { name: 'views', type: 'INTEGER', default: '0' },
        { name: 'metadata', type: 'JSONB', isOptional: true },
      ],
    },
  ],
};

describe('JSON Schema Generator', () => {
  describe('irToJSONSchema', () => {
    it('generates separate schemas by default', () => {
      const result = irToJSONSchema(testDiagram);
      
      expect(result).toHaveProperty('schemas');
      expect(result).toHaveProperty('definitions');
      
      if ('schemas' in result) {
        expect(result.schemas).toHaveProperty('User');
        expect(result.schemas).toHaveProperty('Post');
      }
    });

    it('generates combined schema when separateSchemas is false', () => {
      const result = irToJSONSchema(testDiagram, { separateSchemas: false });
      
      expect(result).toHaveProperty('$schema');
      expect(result).toHaveProperty('type', 'object');
      expect(result).toHaveProperty('properties');
      
      if ('properties' in result) {
        expect(result.properties).toHaveProperty('User');
        expect(result.properties).toHaveProperty('Post');
      }
    });

    it('maps SQL types to correct JSON Schema types', () => {
      const result = irToJSONSchema(testDiagram);
      
      if ('schemas' in result) {
        const userSchema = result.schemas.User;
        expect(userSchema.properties?.id?.type).toBe('integer');
        expect(userSchema.properties?.name?.type).toBe('string');
        expect(userSchema.properties?.email?.type).toBe('string');
        expect(userSchema.properties?.is_active?.type).toBe('boolean');
        expect(userSchema.properties?.created_at?.type).toBe('string');
        expect(userSchema.properties?.created_at?.format).toBe('date-time');
        
        const postSchema = result.schemas.Post;
        expect(postSchema.properties?.id?.type).toBe('string');
        expect(postSchema.properties?.id?.format).toBe('uuid');
        expect(postSchema.properties?.content?.type).toBe('string'); // Not nullable by default
        expect(postSchema.properties?.metadata?.type).toBe('object'); // Not nullable by default
      }
    });

    it('handles nullable fields correctly', () => {
      const result = irToJSONSchema(testDiagram, { includeNullable: true });
      
      if ('schemas' in result) {
        const userSchema = result.schemas.User;
        expect(userSchema.properties?.age?.type).toEqual(['integer', 'null']);
        expect(userSchema.properties?.name?.type).toBe('string'); // required, not nullable
        
        const postSchema = result.schemas.Post;
        expect(postSchema.properties?.content?.type).toEqual(['string', 'null']);
      }
    });

    it('includes required fields', () => {
      const result = irToJSONSchema(testDiagram);
      
      if ('schemas' in result) {
        const userSchema = result.schemas.User;
        expect(userSchema.required).toContain('id');
        expect(userSchema.required).toContain('name');
        expect(userSchema.required).toContain('email');
        expect(userSchema.required).not.toContain('age'); // optional
        
        const postSchema = result.schemas.Post;
        expect(postSchema.required).toContain('id');
        expect(postSchema.required).toContain('title');
        expect(postSchema.required).toContain('user_id');
        expect(postSchema.required).not.toContain('content'); // optional
      }
    });

    it('handles default values', () => {
      const result = irToJSONSchema(testDiagram);
      
      if ('schemas' in result) {
        const userSchema = result.schemas.User;
        expect(userSchema.properties?.is_active?.default).toBe(true);
        
        const postSchema = result.schemas.Post;
        expect(postSchema.properties?.views?.default).toBe(0);
      }
    });

    it('includes schema metadata', () => {
      const result = irToJSONSchema(testDiagram, { 
        baseUrl: 'https://example.com/schemas',
        includeDescriptions: true 
      });
      
      if ('schemas' in result) {
        const userSchema = result.schemas.User;
        expect(userSchema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
        expect(userSchema.$id).toBe('https://example.com/schemas/User.json');
        expect(userSchema.title).toBe('User');
        expect(userSchema.description).toContain('Schema for User table');
      }
    });

    it('extracts length constraints from VARCHAR types', () => {
      const result = irToJSONSchema(testDiagram);
      
      if ('schemas' in result) {
        const userSchema = result.schemas.User;
        expect(userSchema.properties?.name?.maxLength).toBe(100);
        expect(userSchema.properties?.email?.maxLength).toBe(255);
        
        const postSchema = result.schemas.Post;
        expect(postSchema.properties?.title?.maxLength).toBe(200);
      }
    });
  });

  describe('formatJSONSchemaOutput', () => {
    it('formats separate schemas as multiple JSON documents', () => {
      const result = irToJSONSchema(testDiagram);
      const formatted = formatJSONSchemaOutput(result);
      
      expect(formatted).toContain('// User.json');
      expect(formatted).toContain('// Post.json');
      expect(formatted).toContain('"$schema": "https://json-schema.org/draft/2020-12/schema"');
    });

    it('formats combined schema as single JSON document', () => {
      const result = irToJSONSchema(testDiagram, { separateSchemas: false });
      const formatted = formatJSONSchemaOutput(result);
      
      // Should be a single JSON object, not multiple with comments
      expect(formatted).toContain('"$schema": "https://json-schema.org/draft/2020-12/schema"');
      expect(formatted).toContain('"type": "object"');
      expect(formatted).toContain('"properties"');
      // Should not have table name comments like "// User.json"
      expect(formatted.startsWith('{')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles empty diagram', () => {
      const emptyDiagram: IRDiagram = { tables: [] };
      const result = irToJSONSchema(emptyDiagram);
      
      if ('schemas' in result) {
        expect(Object.keys(result.schemas)).toHaveLength(0);
      }
    });

    it('handles table with no columns', () => {
      const diagram: IRDiagram = {
        tables: [{ name: 'Empty', columns: [] }],
      };
      const result = irToJSONSchema(diagram);
      
      if ('schemas' in result) {
        const emptySchema = result.schemas.Empty;
        expect(emptySchema.properties).toEqual({});
        expect(emptySchema.required).toBeUndefined();
      }
    });

    it('handles unknown column types', () => {
      const diagram: IRDiagram = {
        tables: [{
          name: 'Test',
          columns: [{ name: 'weird_field', type: 'UNKNOWN_TYPE' }],
        }],
      };
      const result = irToJSONSchema(diagram);
      
      if ('schemas' in result) {
        const testSchema = result.schemas.Test;
        expect(testSchema.properties?.weird_field?.type).toBe('string'); // fallback
      }
    });
  });

  describe('snapshot tests', () => {
    it('matches expected JSON Schema output', () => {
      const result = irToJSONSchema(testDiagram, {
        includeNullable: true,
        separateSchemas: true,
        includeDescriptions: true,
      });

      expect(result).toMatchInlineSnapshot(`
        {
          "definitions": {
            "Post": {
              "additionalProperties": false,
              "properties": {
                "content": {
                  "description": "Column: content",
                  "type": [
                    "string",
                    "null",
                  ],
                },
                "id": {
                  "description": "Column: id",
                  "format": "uuid",
                  "type": "string",
                },
                "metadata": {
                  "description": "Column: metadata",
                  "type": [
                    "object",
                    "null",
                  ],
                },
                "title": {
                  "description": "Column: title",
                  "maxLength": 200,
                  "type": "string",
                },
                "user_id": {
                  "description": "Column: user_id",
                  "format": "int32",
                  "type": "integer",
                },
                "views": {
                  "default": 0,
                  "description": "Column: views",
                  "format": "int32",
                  "type": "integer",
                },
              },
              "required": [
                "id",
                "title",
                "user_id",
                "views",
              ],
              "type": "object",
            },
            "User": {
              "additionalProperties": false,
              "properties": {
                "age": {
                  "description": "Column: age",
                  "format": "int32",
                  "type": [
                    "integer",
                    "null",
                  ],
                },
                "created_at": {
                  "description": "Column: created_at",
                  "format": "date-time",
                  "type": "string",
                },
                "email": {
                  "description": "Column: email",
                  "maxLength": 255,
                  "type": "string",
                },
                "id": {
                  "description": "Column: id",
                  "format": "int32",
                  "type": "integer",
                },
                "is_active": {
                  "default": true,
                  "description": "Column: is_active",
                  "type": "boolean",
                },
                "name": {
                  "description": "Column: name",
                  "maxLength": 100,
                  "type": "string",
                },
              },
              "required": [
                "id",
                "name",
                "email",
                "is_active",
                "created_at",
              ],
              "type": "object",
            },
          },
          "schemas": {
            "Post": {
              "$schema": "https://json-schema.org/draft/2020-12/schema",
              "additionalProperties": false,
              "description": "Schema for Post table",
              "properties": {
                "content": {
                  "description": "Column: content",
                  "type": [
                    "string",
                    "null",
                  ],
                },
                "id": {
                  "description": "Column: id",
                  "format": "uuid",
                  "type": "string",
                },
                "metadata": {
                  "description": "Column: metadata",
                  "type": [
                    "object",
                    "null",
                  ],
                },
                "title": {
                  "description": "Column: title",
                  "maxLength": 200,
                  "type": "string",
                },
                "user_id": {
                  "description": "Column: user_id",
                  "format": "int32",
                  "type": "integer",
                },
                "views": {
                  "default": 0,
                  "description": "Column: views",
                  "format": "int32",
                  "type": "integer",
                },
              },
              "required": [
                "id",
                "title",
                "user_id",
                "views",
              ],
              "title": "Post",
              "type": "object",
            },
            "User": {
              "$schema": "https://json-schema.org/draft/2020-12/schema",
              "additionalProperties": false,
              "description": "Schema for User table",
              "properties": {
                "age": {
                  "description": "Column: age",
                  "format": "int32",
                  "type": [
                    "integer",
                    "null",
                  ],
                },
                "created_at": {
                  "description": "Column: created_at",
                  "format": "date-time",
                  "type": "string",
                },
                "email": {
                  "description": "Column: email",
                  "maxLength": 255,
                  "type": "string",
                },
                "id": {
                  "description": "Column: id",
                  "format": "int32",
                  "type": "integer",
                },
                "is_active": {
                  "default": true,
                  "description": "Column: is_active",
                  "type": "boolean",
                },
                "name": {
                  "description": "Column: name",
                  "maxLength": 100,
                  "type": "string",
                },
              },
              "required": [
                "id",
                "name",
                "email",
                "is_active",
                "created_at",
              ],
              "title": "User",
              "type": "object",
            },
          },
        }
      `);
    });
  });
});