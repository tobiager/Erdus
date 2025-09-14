import { describe, it, expect } from 'vitest';
import { diffSchemas, emitAlterSQL } from '../src/diff';
import type { IRSchema } from '../src/ir';

describe('Schema Diff', () => {
  it('should detect new tables', () => {
    const schemaA: IRSchema = {
      entities: [
        {
          name: 'users',
          attributes: [
            { name: 'id', type: 'uuid', pk: true, nullable: false },
            { name: 'email', type: 'string', nullable: false },
          ],
        },
      ],
      relations: [],
    };

    const schemaB: IRSchema = {
      entities: [
        ...schemaA.entities,
        {
          name: 'posts',
          attributes: [
            { name: 'id', type: 'uuid', pk: true, nullable: false },
            { name: 'title', type: 'string', nullable: false },
          ],
        },
      ],
      relations: [],
    };

    const plan = diffSchemas(schemaA, schemaB);
    
    expect(plan.operations).toHaveLength(1);
    expect(plan.operations[0].type).toBe('create_table');
    expect(plan.operations[0].table).toBe('posts');
  });

  it('should detect dropped tables', () => {
    const schemaA: IRSchema = {
      entities: [
        {
          name: 'users',
          attributes: [
            { name: 'id', type: 'uuid', pk: true, nullable: false },
          ],
        },
        {
          name: 'posts',
          attributes: [
            { name: 'id', type: 'uuid', pk: true, nullable: false },
          ],
        },
      ],
      relations: [],
    };

    const schemaB: IRSchema = {
      entities: [schemaA.entities[0]], // Only users
      relations: [],
    };

    const plan = diffSchemas(schemaA, schemaB);
    
    expect(plan.operations).toHaveLength(1);
    expect(plan.operations[0].type).toBe('drop_table');
    expect(plan.operations[0].table).toBe('posts');
  });

  it('should detect added columns', () => {
    const schemaA: IRSchema = {
      entities: [
        {
          name: 'users',
          attributes: [
            { name: 'id', type: 'uuid', pk: true, nullable: false },
            { name: 'email', type: 'string', nullable: false },
          ],
        },
      ],
      relations: [],
    };

    const schemaB: IRSchema = {
      entities: [
        {
          name: 'users',
          attributes: [
            ...schemaA.entities[0].attributes,
            { name: 'name', type: 'string', nullable: true },
          ],
        },
      ],
      relations: [],
    };

    const plan = diffSchemas(schemaA, schemaB);
    
    expect(plan.operations).toHaveLength(1);
    expect(plan.operations[0].type).toBe('add_column');
    expect(plan.operations[0].table).toBe('users');
    expect(plan.operations[0].column).toBe('name');
  });

  it('should generate ALTER SQL', () => {
    const schemaA: IRSchema = {
      entities: [
        {
          name: 'users',
          attributes: [
            { name: 'id', type: 'uuid', pk: true, nullable: false },
          ],
        },
      ],
      relations: [],
    };

    const schemaB: IRSchema = {
      entities: [
        {
          name: 'users',
          attributes: [
            { name: 'id', type: 'uuid', pk: true, nullable: false },
            { name: 'email', type: 'string', nullable: false },
          ],
        },
      ],
      relations: [],
    };

    const plan = diffSchemas(schemaA, schemaB);
    const sql = emitAlterSQL(plan);
    
    expect(sql).toContain('ALTER TABLE users ADD COLUMN email varchar(255) NOT NULL;');
  });
});