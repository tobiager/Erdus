import { describe, it, expect } from 'vitest';
import { diffSchemas, emitAlterSQL } from '../../src/diff/index';
import type { IRSchema } from '../../src/ir';

describe('Schema Diff and Migration', () => {
  const schemaA: IRSchema = {
    entities: [
      {
        name: 'User',
        columns: [
          { name: 'id', type: 'uuid', isPrimaryKey: true, isOptional: false },
          { name: 'email', type: 'varchar(255)', isOptional: false }
        ],
        attributes: [
          { name: 'id', type: 'uuid', isPrimaryKey: true, isOptional: false },
          { name: 'email', type: 'varchar(255)', isOptional: false }
        ]
      }
    ],
    relations: []
  };

  const schemaB: IRSchema = {
    entities: [
      {
        name: 'User',
        columns: [
          { name: 'id', type: 'uuid', isPrimaryKey: true, isOptional: false },
          { name: 'email', type: 'varchar(255)', isOptional: false },
          { name: 'name', type: 'varchar(100)', isOptional: true }
        ],
        attributes: [
          { name: 'id', type: 'uuid', isPrimaryKey: true, isOptional: false },
          { name: 'email', type: 'varchar(255)', isOptional: false },
          { name: 'name', type: 'varchar(100)', isOptional: true }
        ]
      },
      {
        name: 'Post',
        columns: [
          { name: 'id', type: 'uuid', isPrimaryKey: true, isOptional: false },
          { name: 'title', type: 'varchar(200)', isOptional: false }
        ],
        attributes: [
          { name: 'id', type: 'uuid', isPrimaryKey: true, isOptional: false },
          { name: 'title', type: 'varchar(200)', isOptional: false }
        ]
      }
    ],
    relations: []
  };

  it('should detect added columns', () => {
    const plan = diffSchemas(schemaA, schemaB);
    
    const addColumnOp = plan.operations.find(op => op.type === 'add_column');
    expect(addColumnOp).toBeDefined();
    expect(addColumnOp).toMatchObject({
      type: 'add_column',
      tableName: 'User',
      column: {
        name: 'name',
        type: 'varchar(100)',
        isOptional: true
      }
    });
  });

  it('should detect added tables', () => {
    const plan = diffSchemas(schemaA, schemaB);
    
    const createTableOp = plan.operations.find(op => op.type === 'create_table');
    expect(createTableOp).toBeDefined();
    expect(createTableOp).toMatchObject({
      type: 'create_table',
      entity: {
        name: 'Post'
      }
    });
  });

  it('should generate valid SQL ALTER statements', () => {
    const plan = diffSchemas(schemaA, schemaB);
    const sql = emitAlterSQL(plan);
    
    expect(sql).toContain('ALTER TABLE "User" ADD COLUMN "name" varchar(100);');
    expect(sql).toContain('CREATE TABLE "Post"');
    expect(sql).toContain('CONSTRAINT "Post_pkey" PRIMARY KEY ("id")');
  });

  it('should detect dropped tables', () => {
    const plan = diffSchemas(schemaB, schemaA);
    
    const dropTableOp = plan.operations.find(op => op.type === 'drop_table');
    expect(dropTableOp).toBeDefined();
    expect(dropTableOp).toMatchObject({
      type: 'drop_table',
      tableName: 'Post'
    });
  });
});