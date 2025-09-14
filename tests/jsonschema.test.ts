import { describe, it, expect } from 'vitest';
import { toJSONSchema } from '../src/generators/json-schema';
import type { IRSchema } from '../src/ir';

describe('JSON Schema Generator', () => {
  it('should generate basic JSON schema for simple entity', () => {
    const ir: IRSchema = {
      entities: [
        {
          name: 'User',
          attributes: [
            { name: 'id', type: 'uuid', pk: true, nullable: false },
            { name: 'email', type: 'string', unique: true, nullable: false, length: 255 },
            { name: 'name', type: 'string', nullable: true },
            { name: 'age', type: 'integer', nullable: true },
            { name: 'active', type: 'boolean', default: 'true', nullable: false },
          ],
        },
      ],
      relations: [],
    };

    const schemas = toJSONSchema(ir, { target: 'ajv' });
    
    expect(schemas).toHaveProperty('User');
    expect(schemas.User.type).toBe('object');
    expect(schemas.User.properties).toHaveProperty('id');
    expect(schemas.User.properties.id.type).toBe('string');
    expect(schemas.User.properties.id.format).toBe('uuid');
    expect(schemas.User.properties.email['x-unique']).toBe(true);
    expect(schemas.User.required).toContain('id');
    expect(schemas.User.required).toContain('email');
    expect(schemas.User.required).toContain('active');
    expect(schemas.User.required).not.toContain('name');
  });

  it('should handle foreign key relationships', () => {
    const ir: IRSchema = {
      entities: [
        {
          name: 'Post',
          attributes: [
            { name: 'id', type: 'uuid', pk: true, nullable: false },
            { name: 'title', type: 'string', nullable: false },
            { 
              name: 'user_id', 
              type: 'uuid', 
              nullable: false,
              references: { table: 'User', column: 'id', onDelete: 'CASCADE' }
            },
          ],
        },
      ],
      relations: [],
    };

    const schemas = toJSONSchema(ir);
    
    expect(schemas.Post.properties.user_id['x-foreignKey']).toEqual({
      table: 'User',
      column: 'id',
      onDelete: 'CASCADE',
      onUpdate: undefined,
    });
  });
});