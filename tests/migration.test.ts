import { describe, it, expect } from 'vitest';
import { diffIRDiagrams, generateMigrationSQL } from '../migration/diff';
import { DatabaseMigrator } from '../migration';

describe('Migration Diff', () => {
  const oldDiagram = {
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
            name: 'name',
            type: 'String',
            isOptional: false
          }
        ]
      }
    ]
  };

  const newDiagram = {
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
            name: 'name',
            type: 'String',
            isOptional: false
          },
          {
            name: 'email',
            type: 'String',
            isOptional: true,
            isUnique: true
          }
        ]
      },
      {
        name: 'posts',
        columns: [
          {
            name: 'id',
            type: 'Int',
            isPrimaryKey: true,
            isOptional: false,
            default: 'autoincrement()'
          },
          {
            name: 'user_id',
            type: 'Int',
            isOptional: false,
            references: {
              table: 'users',
              column: 'id'
            }
          },
          {
            name: 'title',
            type: 'String',
            isOptional: false
          }
        ]
      }
    ]
  };

  it('should detect table additions', () => {
    const diff = diffIRDiagrams(oldDiagram, newDiagram);
    
    expect(diff.tablesToAdd).toHaveLength(1);
    expect(diff.tablesToAdd[0].name).toBe('posts');
  });

  it('should detect column additions', () => {
    const diff = diffIRDiagrams(oldDiagram, newDiagram);
    
    expect(diff.tablesToModify).toHaveLength(1);
    expect(diff.tablesToModify[0].columnsToAdd).toHaveLength(1);
    expect(diff.tablesToModify[0].columnsToAdd[0].name).toBe('email');
  });

  it('should detect column modifications', () => {
    const modifiedDiagram = {
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
              name: 'name',
              type: 'String',
              isOptional: true // Changed from false to true
            }
          ]
        }
      ]
    };

    const diff = diffIRDiagrams(oldDiagram, modifiedDiagram);
    
    expect(diff.tablesToModify).toHaveLength(1);
    expect(diff.tablesToModify[0].columnsToModify).toHaveLength(1);
    expect(diff.tablesToModify[0].columnsToModify[0].changes).toContain('nullable');
  });

  it('should generate migration SQL', () => {
    const diff = diffIRDiagrams(oldDiagram, newDiagram);
    const result = generateMigrationSQL(diff, {
      targetEngine: 'postgresql',
      includeComments: true
    });

    expect(result.success).toBe(true);
    expect(result.sql).toContain('ALTER TABLE "users" ADD COLUMN');
    expect(result.sql).toContain('CREATE TABLE "posts"');
    expect(result.sql).toContain('BEGIN;');
    expect(result.sql).toContain('COMMIT;');
  });

  it('should generate safe migration warnings', () => {
    const dangerousDiagram = {
      tables: [] // Empty - will drop all tables
    };

    const diff = diffIRDiagrams(oldDiagram, dangerousDiagram);
    const result = generateMigrationSQL(diff, {
      targetEngine: 'postgresql',
      includeComments: true
    });

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some(w => w.includes('permanently delete'))).toBe(true);
  });
});

describe('Database Migrator', () => {
  it('should validate configuration', () => {
    const config = {
      sourceEngine: 'postgresql' as const,
      targetEngine: 'mysql' as const,
      includeComments: true
    };

    const migrator = new DatabaseMigrator(config);
    expect(migrator).toBeDefined();
  });

  it('should handle invalid source engine', async () => {
    const config = {
      sourceEngine: 'invalid' as any,
      targetEngine: 'postgresql' as const,
      includeComments: true
    };

    expect(() => new DatabaseMigrator(config)).toThrow();
  });
});