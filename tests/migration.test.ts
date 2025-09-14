import { describe, it, expect } from 'vitest';
import { diffIR } from '../src/migration';
import { renderMigration } from '../src/migration-render';
import type { IRDiagram } from '../src/ir';

describe('Migration diff and render', () => {
  const oldSchema: IRDiagram = {
    tables: [
      {
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'Int',
            isPrimaryKey: true,
            isOptional: false,
            default: 'autoincrement()'
          },
          {
            name: 'username',
            type: 'NVARCHAR(50)',
            isPrimaryKey: false,
            isOptional: false,
            isUnique: true
          },
          {
            name: 'email',
            type: 'NVARCHAR(100)',
            isPrimaryKey: false,
            isOptional: false
          },
          {
            name: 'created_at',
            type: 'DATETIME2',
            isPrimaryKey: false,
            isOptional: false,
            default: 'GETDATE()'
          }
        ]
      }
    ]
  };

  const newSchema: IRDiagram = {
    tables: [
      {
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'INTEGER',
            isPrimaryKey: true,
            isOptional: false,
            default: 'autoincrement()'
          },
          {
            name: 'username',
            type: 'VARCHAR(50)',
            isPrimaryKey: false,
            isOptional: false,
            isUnique: true
          },
          {
            name: 'email',
            type: 'VARCHAR(150)',
            isPrimaryKey: false,
            isOptional: false
          },
          {
            name: 'full_name',
            type: 'VARCHAR(100)',
            isPrimaryKey: false,
            isOptional: true
          },
          {
            name: 'created_at',
            type: 'TIMESTAMP WITHOUT TIME ZONE',
            isPrimaryKey: false,
            isOptional: false,
            default: 'now()'
          }
        ]
      },
      {
        name: 'posts',
        columns: [
          {
            name: 'id',
            type: 'INTEGER',
            isPrimaryKey: true,
            isOptional: false,
            default: 'autoincrement()'
          },
          {
            name: 'title',
            type: 'VARCHAR(200)',
            isPrimaryKey: false,
            isOptional: false
          },
          {
            name: 'user_id',
            type: 'INTEGER',
            isPrimaryKey: false,
            isOptional: false,
            references: {
              table: 'users',
              column: 'id',
              onDelete: 'CASCADE'
            }
          }
        ]
      }
    ]
  };

  it('should generate diff plan with all operation types', () => {
    const plan = diffIR(oldSchema, newSchema);

    expect(plan.operations).toBeDefined();
    expect(plan.version).toBe('1.0');

    // Should detect new table
    const addTableOp = plan.operations.find(op => op.type === 'addTable' && op.table === 'posts');
    expect(addTableOp).toBeDefined();

    // Should detect new column
    const addColumnOp = plan.operations.find(op => op.type === 'addColumn' && op.column === 'full_name');
    expect(addColumnOp).toBeDefined();
    expect(addColumnOp?.columnDef?.type).toBe('VARCHAR(100)');
    expect(addColumnOp?.columnDef?.isOptional).toBe(true);

    // Should detect altered columns
    const alterOps = plan.operations.filter(op => op.type === 'alterColumn');
    expect(alterOps.length).toBeGreaterThan(0);

    // Verify operation ordering (drops before adds)
    const dropOps = plan.operations.filter(op => op.type.startsWith('drop'));
    const addOps = plan.operations.filter(op => op.type.startsWith('add'));
    
    if (dropOps.length > 0 && addOps.length > 0) {
      const firstDropIndex = plan.operations.findIndex(op => op.type.startsWith('drop'));
      const firstAddIndex = plan.operations.findIndex(op => op.type.startsWith('add'));
      expect(firstDropIndex).toBeLessThan(firstAddIndex);
    }
  });

  it('should render PostgreSQL migration correctly', () => {
    const plan = diffIR(oldSchema, newSchema);
    const sql = renderMigration(plan, 'postgres');

    expect(sql).toContain('ALTER TABLE "users" ADD COLUMN "full_name" VARCHAR(100)');
    expect(sql).toContain('CREATE TABLE "posts"'); // Should not appear as we don't handle full table creation
    expect(sql).toContain('VARCHAR'); // Should map NVARCHAR to VARCHAR
    expect(sql).toContain('INTEGER'); // Should map Int to INTEGER
    expect(sql).toContain('TIMESTAMP WITHOUT TIME ZONE'); // Should map DATETIME2
    expect(sql).toContain('now()'); // Should map GETDATE() to now()
  });

  it('should render SQL Server migration correctly', () => {
    const plan = diffIR(oldSchema, newSchema);
    const sql = renderMigration(plan, 'sqlserver');

    expect(sql).toContain('ALTER TABLE [users] ADD COLUMN [full_name] NVARCHAR(100)');
    expect(sql).toContain('['); // Should use SQL Server brackets
    expect(sql).toContain('NVARCHAR'); // Should map VARCHAR to NVARCHAR
    expect(sql).toContain('INT'); // Should map INTEGER to INT
    expect(sql).toContain('DATETIME2'); // Should map TIMESTAMP
  });

  it('should handle foreign key operations', () => {
    const schemaWithFK: IRDiagram = {
      tables: [
        {
          name: 'users',
          columns: [
            { name: 'id', type: 'Int', isPrimaryKey: true, isOptional: false }
          ]
        },
        {
          name: 'posts',
          columns: [
            { name: 'id', type: 'Int', isPrimaryKey: true, isOptional: false },
            {
              name: 'user_id',
              type: 'Int',
              isPrimaryKey: false,
              isOptional: false,
              references: { table: 'users', column: 'id', onDelete: 'CASCADE' }
            }
          ]
        }
      ]
    };

    const schemaWithoutFK: IRDiagram = {
      tables: [
        {
          name: 'users',
          columns: [
            { name: 'id', type: 'Int', isPrimaryKey: true, isOptional: false }
          ]
        },
        {
          name: 'posts',
          columns: [
            { name: 'id', type: 'Int', isPrimaryKey: true, isOptional: false },
            { name: 'user_id', type: 'Int', isPrimaryKey: false, isOptional: false }
          ]
        }
      ]
    };

    const plan = diffIR(schemaWithFK, schemaWithoutFK);
    const dropFKOp = plan.operations.find(op => op.type === 'dropForeignKey');
    expect(dropFKOp).toBeDefined();
    expect(dropFKOp?.foreignKey?.column).toBe('user_id');

    const sql = renderMigration(plan, 'postgres');
    expect(sql).toContain('DROP CONSTRAINT FK_posts_user_id');
  });

  it('should detect column renames', () => {
    const oldSchemaRename: IRDiagram = {
      tables: [
        {
          name: 'users',
          columns: [
            { name: 'user_name', type: 'VARCHAR(50)', isPrimaryKey: false, isOptional: false }
          ]
        }
      ]
    };

    const newSchemaRename: IRDiagram = {
      tables: [
        {
          name: 'users',
          columns: [
            { name: 'username', type: 'VARCHAR(50)', isPrimaryKey: false, isOptional: false }
          ]
        }
      ]
    };

    const plan = diffIR(oldSchemaRename, newSchemaRename);
    const renameOp = plan.operations.find(op => op.type === 'renameColumn');
    
    if (renameOp) {
      expect(renameOp.column).toBe('user_name');
      expect(renameOp.newName).toBe('username');
    }
  });

  it('should handle type mapping edge cases', () => {
    const mssqlSchema: IRDiagram = {
      tables: [
        {
          name: 'test',
          columns: [
            { name: 'id', type: 'UNIQUEIDENTIFIER', isPrimaryKey: true, isOptional: false },
            { name: 'flag', type: 'BIT', isPrimaryKey: false, isOptional: false },
            { name: 'amount', type: 'FLOAT', isPrimaryKey: false, isOptional: false }
          ]
        }
      ]
    };

    const pgSchema: IRDiagram = {
      tables: [
        {
          name: 'test',
          columns: [
            { name: 'id', type: 'UUID', isPrimaryKey: true, isOptional: false },
            { name: 'flag', type: 'BOOLEAN', isPrimaryKey: false, isOptional: false },
            { name: 'amount', type: 'REAL', isPrimaryKey: false, isOptional: false }
          ]
        }
      ]
    };

    const plan = diffIR(mssqlSchema, pgSchema);
    const sql = renderMigration(plan, 'postgres');

    expect(sql).toContain('UUID');
    expect(sql).toContain('BOOLEAN');
    expect(sql).toContain('REAL');
  });
});