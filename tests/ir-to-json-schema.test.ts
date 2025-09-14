import { describe, it, expect } from 'vitest';
import { irToJsonSchema } from '../src/ir-to-json-schema';
import type { IRDiagram } from '../src/ir';

describe('IR to JSON Schema', () => {
  it('should convert basic table to JSON Schema', () => {
    const diagram: IRDiagram = {
      tables: [{
        name: 'user',
        columns: [
          { name: 'id', type: 'SERIAL', isPrimaryKey: true },
          { name: 'name', type: 'VARCHAR(255)' },
          { name: 'email', type: 'VARCHAR(255)', isUnique: true },
          { name: 'age', type: 'INTEGER', isOptional: true }
        ]
      }]
    };

    const result = irToJsonSchema(diagram);
    const schema = JSON.parse(result);

    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(schema.definitions.User).toBeDefined();
    expect(schema.definitions.User.properties.id).toEqual({ type: 'integer', minimum: 1 });
    expect(schema.definitions.User.properties.name).toEqual({ type: 'string', maxLength: 255 });
    expect(schema.definitions.User.properties.email).toEqual({ type: 'string', maxLength: 255 });
    expect(schema.definitions.User.properties.age).toEqual({ type: 'integer', minimum: -2147483648, maximum: 2147483647 });
    expect(schema.definitions.User.required).toEqual(['name', 'email']);
  });

  it('should handle foreign key relationships', () => {
    const diagram: IRDiagram = {
      tables: [
        {
          name: 'user',
          columns: [
            { name: 'id', type: 'SERIAL', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR(255)' }
          ]
        },
        {
          name: 'post',
          columns: [
            { name: 'id', type: 'SERIAL', isPrimaryKey: true },
            { name: 'title', type: 'VARCHAR(255)' },
            { name: 'user_id', type: 'INTEGER', references: { table: 'user', column: 'id' } }
          ]
        }
      ]
    };

    const result = irToJsonSchema(diagram);
    const schema = JSON.parse(result);

    expect(schema.definitions.Post.properties.user_id).toEqual({
      type: 'integer',
      minimum: -2147483648,
      maximum: 2147483647,
      description: 'Foreign key reference to user.id'
    });
  });

  it('should handle various data types', () => {
    const diagram: IRDiagram = {
      tables: [{
        name: 'test_types',
        columns: [
          { name: 'id', type: 'SERIAL', isPrimaryKey: true },
          { name: 'text_field', type: 'TEXT' },
          { name: 'bool_field', type: 'BOOLEAN' },
          { name: 'date_field', type: 'DATE' },
          { name: 'timestamp_field', type: 'TIMESTAMP' },
          { name: 'decimal_field', type: 'DECIMAL(10,2)' }
        ]
      }]
    };

    const result = irToJsonSchema(diagram);
    const schema = JSON.parse(result);
    const props = schema.definitions.TestTypes.properties;

    expect(props.text_field).toEqual({ type: 'string' });
    expect(props.bool_field).toEqual({ type: 'boolean' });
    expect(props.date_field).toEqual({ type: 'string', format: 'date' });
    expect(props.timestamp_field).toEqual({ type: 'string', format: 'date-time' });
    expect(props.decimal_field).toEqual({ type: 'number' });
  });

  it('should handle default values', () => {
    const diagram: IRDiagram = {
      tables: [{
        name: 'test_defaults',
        columns: [
          { name: 'id', type: 'SERIAL', isPrimaryKey: true },
          { name: 'status', type: 'VARCHAR(20)', default: "'active'" },
          { name: 'count', type: 'INTEGER', default: '0' },
          { name: 'enabled', type: 'BOOLEAN', default: 'true' }
        ]
      }]
    };

    const result = irToJsonSchema(diagram);
    const schema = JSON.parse(result);
    const props = schema.definitions.TestDefaults.properties;

    expect(props.status.default).toBe('active');
    expect(props.count.default).toBe(0);
    expect(props.enabled.default).toBe(true);
  });
});