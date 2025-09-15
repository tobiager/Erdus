import { describe, it, expect } from 'vitest';
import { toJSONSchema } from '../../src/generators/json-schema/index';
import type { IRSchema } from '../../src/ir';

describe('JSON Schema Generator', () => {
  const sampleIR: IRSchema = {
    entities: [
      {
        name: 'User',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimaryKey: true,
            isOptional: false
          },
          {
            name: 'email',
            type: 'varchar(255)',
            isOptional: false,
            isUnique: true
          },
          {
            name: 'name',
            type: 'varchar(100)',
            isOptional: true
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            isOptional: false,
            default: 'now()'
          }
        ],
        attributes: [
          {
            name: 'id',
            type: 'uuid',
            isPrimaryKey: true,
            isOptional: false
          },
          {
            name: 'email',
            type: 'varchar(255)',
            isOptional: false,
            isUnique: true
          },
          {
            name: 'name',
            type: 'varchar(100)',
            isOptional: true
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            isOptional: false,
            default: 'now()'
          }
        ]
      }
    ],
    relations: []
  };

  it('should generate basic JSON schema', () => {
    const schemas = toJSONSchema(sampleIR);
    
    expect(schemas).toHaveProperty('User');
    expect(schemas.User).toMatchObject({
      type: 'object',
      title: 'User',
      properties: {
        id: {
          type: 'string',
          format: 'uuid'
        },
        email: {
          type: 'string',
          maxLength: 255,
          'x-unique': true
        },
        name: {
          type: ['string', 'null'],
          maxLength: 100
        },
        created_at: {
          type: 'string',
          format: 'date-time'
        }
      },
      required: ['id', 'email', 'created_at'],
      additionalProperties: false
    });
  });

  it('should handle different data types', () => {
    const ir: IRSchema = {
      entities: [
        {
          name: 'TestEntity',
          columns: [
            { name: 'int_field', type: 'integer', isOptional: false },
            { name: 'bool_field', type: 'boolean', isOptional: false },
            { name: 'json_field', type: 'jsonb', isOptional: true },
            { name: 'date_field', type: 'date', isOptional: false }
          ],
          attributes: [
            { name: 'int_field', type: 'integer', isOptional: false },
            { name: 'bool_field', type: 'boolean', isOptional: false },
            { name: 'json_field', type: 'jsonb', isOptional: true },
            { name: 'date_field', type: 'date', isOptional: false }
          ]
        }
      ],
      relations: []
    };

    const schemas = toJSONSchema(ir);
    
    expect(schemas.TestEntity.properties).toMatchObject({
      int_field: { type: 'integer' },
      bool_field: { type: 'boolean' },
      json_field: { type: ['object', 'array', 'string', 'number', 'boolean', 'null', 'null'] },
      date_field: { type: 'string', format: 'date' }
    });
  });

  it('should include foreign key extensions', () => {
    const ir: IRSchema = {
      entities: [
        {
          name: 'Post',
          columns: [
            {
              name: 'user_id',
              type: 'uuid',
              isOptional: false,
              references: {
                table: 'User',
                column: 'id',
                onDelete: 'CASCADE'
              }
            }
          ],
          attributes: [
            {
              name: 'user_id',
              type: 'uuid',
              isOptional: false,
              references: {
                table: 'User',
                column: 'id',
                onDelete: 'CASCADE'
              }
            }
          ]
        }
      ],
      relations: []
    };

    const schemas = toJSONSchema(ir);
    
    expect(schemas.Post.properties.user_id).toMatchObject({
      type: 'string',
      format: 'uuid',
      'x-foreignKey': {
        table: 'User',
        column: 'id',
        onDelete: 'CASCADE'
      }
    });
  });
});