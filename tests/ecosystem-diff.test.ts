import { describe, it, expect } from 'vitest';
import { diffIRDiagrams, formatMigrationReport } from '../src/ecosystem/diff';
import type { IRDiagram } from '../src/ir';

const oldDiagram: IRDiagram = {
  tables: [
    {
      name: 'User',
      columns: [
        { name: 'id', type: 'SERIAL', isPrimaryKey: true },
        { name: 'name', type: 'VARCHAR(100)' },
        { name: 'email', type: 'VARCHAR(255)', isUnique: true },
      ],
    },
    {
      name: 'Post',
      columns: [
        { name: 'id', type: 'SERIAL', isPrimaryKey: true },
        { name: 'title', type: 'VARCHAR(200)' },
        { name: 'user_id', type: 'INTEGER', references: { table: 'User', column: 'id' } },
      ],
    },
  ],
};

const newDiagram: IRDiagram = {
  tables: [
    {
      name: 'User',
      columns: [
        { name: 'id', type: 'SERIAL', isPrimaryKey: true },
        { name: 'name', type: 'VARCHAR(150)' }, // Changed length
        { name: 'email', type: 'VARCHAR(255)', isUnique: true },
        { name: 'age', type: 'INTEGER', isOptional: true }, // Added column
        { name: 'is_active', type: 'BOOLEAN', default: 'true' }, // Added column
      ],
    },
    {
      name: 'Post',
      columns: [
        { name: 'id', type: 'SERIAL', isPrimaryKey: true },
        { name: 'title', type: 'VARCHAR(200)' },
        { name: 'content', type: 'TEXT', isOptional: true }, // Added column
        { name: 'user_id', type: 'INTEGER', references: { table: 'User', column: 'id' } },
        { name: 'published_at', type: 'TIMESTAMPTZ', isOptional: true }, // Added column
      ],
    },
    {
      name: 'Comment', // New table
      columns: [
        { name: 'id', type: 'SERIAL', isPrimaryKey: true },
        { name: 'content', type: 'TEXT' },
        { name: 'post_id', type: 'INTEGER', references: { table: 'Post', column: 'id' } },
        { name: 'user_id', type: 'INTEGER', references: { table: 'User', column: 'id' } },
      ],
    },
  ],
};

describe('Diff/Migration Generator', () => {
  describe('diffIRDiagrams', () => {
    it('detects added tables', () => {
      const migration = diffIRDiagrams(oldDiagram, newDiagram);
      
      const addedTable = migration.changes.find(c => 
        c.type === 'table_added' && c.table === 'Comment'
      );
      
      expect(addedTable).toBeDefined();
      expect(addedTable?.sql).toContain('CREATE TABLE "Comment"');
      expect(addedTable?.risk).toBe('low');
    });

    it('detects added columns', () => {
      const migration = diffIRDiagrams(oldDiagram, newDiagram);
      
      const addedColumns = migration.changes.filter(c => c.type === 'column_added');
      expect(addedColumns).toHaveLength(4); // age, is_active, content, published_at
      
      const ageColumn = addedColumns.find(c => c.column === 'age');
      expect(ageColumn?.sql).toContain('ALTER TABLE "User" ADD COLUMN "age" INTEGER');
      expect(ageColumn?.risk).toBe('low'); // optional column
      
      const isActiveColumn = addedColumns.find(c => c.column === 'is_active');
      expect(isActiveColumn?.sql).toContain('ALTER TABLE "User" ADD COLUMN "is_active" BOOLEAN NOT NULL');
      expect(isActiveColumn?.risk).toBe('medium'); // NOT NULL column
    });

    it('detects column type changes', () => {
      const modifiedDiagram: IRDiagram = {
        tables: [{
          name: 'User',
          columns: [
            { name: 'id', type: 'SERIAL', isPrimaryKey: true },
            { name: 'name', type: 'TEXT' }, // Changed from VARCHAR(100)
            { name: 'email', type: 'VARCHAR(255)', isUnique: true },
          ],
        }],
      };
      
      const migration = diffIRDiagrams(oldDiagram, modifiedDiagram);
      
      const typeChange = migration.changes.find(c => 
        c.type === 'column_type_changed' && c.column === 'name'
      );
      
      expect(typeChange).toBeDefined();
      expect(typeChange?.sql).toContain('ALTER TABLE "User" ALTER COLUMN "name" TYPE TEXT');
      expect(typeChange?.risk).toBe('high');
      expect(typeChange?.warnings).toContain('Type changes may cause data loss or application errors');
    });

    it('detects removed tables when includeDrops is enabled', () => {
      const reducedDiagram: IRDiagram = {
        tables: [oldDiagram.tables[0]], // Only User table
      };
      
      const migration = diffIRDiagrams(oldDiagram, reducedDiagram, { includeDrops: true });
      
      const removedTable = migration.changes.find(c => 
        c.type === 'table_removed' && c.table === 'Post'
      );
      
      expect(removedTable).toBeDefined();
      expect(removedTable?.sql).toContain('DROP TABLE "Post"');
      expect(removedTable?.risk).toBe('high');
    });

    it('detects removed columns when includeDrops is enabled', () => {
      const reducedDiagram: IRDiagram = {
        tables: [{
          name: 'User',
          columns: [
            { name: 'id', type: 'SERIAL', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR(100)' },
            // email column removed
          ],
        }],
      };
      
      const migration = diffIRDiagrams(oldDiagram, reducedDiagram, { includeDrops: true });
      
      const removedColumn = migration.changes.find(c => 
        c.type === 'column_removed' && c.column === 'email'
      );
      
      expect(removedColumn).toBeDefined();
      expect(removedColumn?.sql).toContain('ALTER TABLE "User" DROP COLUMN "email"');
      expect(removedColumn?.risk).toBe('high');
    });

    it('detects table renames based on similarity', () => {
      const renamedDiagram: IRDiagram = {
        tables: [
          {
            name: 'Users', // Renamed from 'User'
            columns: oldDiagram.tables[0].columns,
          },
          oldDiagram.tables[1], // Post unchanged
        ],
      };
      
      const migration = diffIRDiagrams(oldDiagram, renamedDiagram, { renameThreshold: 0.6 });
      
      const rename = migration.changes.find(c => c.type === 'table_renamed');
      expect(rename).toBeDefined();
      expect(rename?.oldValue).toBe('User');
      expect(rename?.newValue).toBe('Users');
      expect(rename?.sql).toContain('ALTER TABLE "User" RENAME TO "Users"');
    });

    it('detects column renames based on similarity', () => {
      const renamedDiagram: IRDiagram = {
        tables: [{
          name: 'User',
          columns: [
            { name: 'id', type: 'SERIAL', isPrimaryKey: true },
            { name: 'name_new', type: 'VARCHAR(100)' }, // Renamed from 'name'
            { name: 'email', type: 'VARCHAR(255)', isUnique: true },
          ],
        }],
      };
      
      const migration = diffIRDiagrams(oldDiagram, renamedDiagram, { renameThreshold: 0.4 });
      
      const rename = migration.changes.find(c => c.type === 'column_renamed');
      expect(rename).toBeDefined();
      expect(rename?.oldValue).toBe('name');
      expect(rename?.newValue).toBe('name_new');
      expect(rename?.sql).toContain('ALTER TABLE "User" RENAME COLUMN "name" TO "name_new"');
    });

    it('detects constraint changes', () => {
      const constraintDiagram: IRDiagram = {
        tables: [{
          name: 'User',
          columns: [
            { name: 'id', type: 'SERIAL', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR(100)' }, // Remove NOT NULL (was required)
            { name: 'email', type: 'VARCHAR(255)', isUnique: true, isOptional: true }, // Add nullable
          ],
        }],
      };
      
      const migration = diffIRDiagrams({
        tables: [{
          name: 'User',
          columns: [
            { name: 'id', type: 'SERIAL', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR(100)', isOptional: false }, // was NOT NULL
            { name: 'email', type: 'VARCHAR(255)', isUnique: true, isOptional: false }, // was NOT NULL
          ],
        }]
      }, constraintDiagram);
      
      const constraintChanges = migration.changes.filter(c => 
        c.type === 'column_constraint_removed'
      );
      
      expect(constraintChanges.length).toBeGreaterThan(0);
      expect(constraintChanges.some(c => c.sql.includes('DROP NOT NULL'))).toBe(true);
    });

    it('detects foreign key changes', () => {
      const fkDiagram: IRDiagram = {
        tables: [{
          name: 'Post',
          columns: [
            { name: 'id', type: 'SERIAL', isPrimaryKey: true },
            { name: 'title', type: 'VARCHAR(200)' },
            { name: 'user_id', type: 'INTEGER' }, // Remove FK reference
          ],
        }],
      };
      
      const migration = diffIRDiagrams(oldDiagram, fkDiagram);
      
      const fkChange = migration.changes.find(c => c.type === 'foreign_key_removed');
      expect(fkChange).toBeDefined();
      expect(fkChange?.sql).toContain('DROP CONSTRAINT');
    });

    it('calculates migration complexity correctly', () => {
      const simpleMigration = diffIRDiagrams(oldDiagram, {
        tables: [{
          ...oldDiagram.tables[0],
          columns: [
            ...oldDiagram.tables[0].columns,
            { name: 'created_at', type: 'TIMESTAMPTZ', isOptional: true },
          ],
        }],
      });
      
      expect(simpleMigration.complexity).toBe('simple');
      
      const complexMigration = diffIRDiagrams(oldDiagram, newDiagram);
      expect(['moderate', 'complex']).toContain(complexMigration.complexity);
    });

    it('counts breaking changes correctly', () => {
      const migration = diffIRDiagrams(oldDiagram, newDiagram);
      
      const highRiskChanges = migration.changes.filter(c => c.risk === 'high');
      expect(migration.breakingChanges).toBe(highRiskChanges.length);
    });

    it('generates rollback SQL when enabled', () => {
      const migration = diffIRDiagrams(oldDiagram, newDiagram, { generateRollback: true });
      
      expect(migration.rollbackSql).toBeDefined();
      expect(migration.rollbackSql).toContain('DROP TABLE "Comment"'); // rollback table creation
      expect(migration.rollbackSql).toContain('DROP COLUMN'); // rollback column additions
    });

    it('excludes rollback SQL when disabled', () => {
      const migration = diffIRDiagrams(oldDiagram, newDiagram, { generateRollback: false });
      
      expect(migration.rollbackSql).toBeUndefined();
    });

    it('respects schema name option', () => {
      const migration = diffIRDiagrams(oldDiagram, newDiagram, { schemaName: 'custom' });
      
      expect(migration.sql).toContain('"custom"."Comment"');
      expect(migration.sql).toContain('"custom"."User"');
    });
  });

  describe('formatMigrationReport', () => {
    it('generates human-readable migration report', () => {
      const migration = diffIRDiagrams(oldDiagram, newDiagram);
      const report = formatMigrationReport(migration);
      
      expect(report).toContain('# Database Migration Report');
      expect(report).toContain('**Complexity:**');
      expect(report).toContain('**Total Changes:**');
      expect(report).toContain('**Breaking Changes:**');
    });

    it('groups changes by risk level', () => {
      const migration = diffIRDiagrams(oldDiagram, newDiagram);
      const report = formatMigrationReport(migration);
      
      expect(report).toContain('## HIGH Risk Changes');
      expect(report).toContain('## MEDIUM Risk Changes');
      expect(report).toContain('## LOW Risk Changes');
    });

    it('includes SQL code blocks', () => {
      const migration = diffIRDiagrams(oldDiagram, newDiagram);
      const report = formatMigrationReport(migration);
      
      expect(report).toContain('## Migration SQL');
      expect(report).toContain('```sql');
      expect(report).toContain('```');
    });

    it('includes rollback SQL when available', () => {
      const migration = diffIRDiagrams(oldDiagram, newDiagram, { generateRollback: true });
      const report = formatMigrationReport(migration);
      
      expect(report).toContain('## Rollback SQL');
    });

    it('handles empty migrations', () => {
      const migration = diffIRDiagrams(oldDiagram, oldDiagram); // no changes
      const report = formatMigrationReport(migration);
      
      expect(report).toContain('No changes detected between schemas');
    });

    it('includes warnings for risky changes', () => {
      const migration = diffIRDiagrams(oldDiagram, newDiagram);
      const report = formatMigrationReport(migration);
      
      expect(report).toContain('⚠️'); // warning emoji
    });
  });

  describe('edge cases', () => {
    it('handles empty diagrams', () => {
      const emptyDiagram: IRDiagram = { tables: [] };
      const migration = diffIRDiagrams(emptyDiagram, emptyDiagram);
      
      expect(migration.changes).toHaveLength(0);
      expect(migration.complexity).toBe('simple');
      expect(migration.breakingChanges).toBe(0);
    });

    it('handles one empty diagram', () => {
      const migration = diffIRDiagrams({ tables: [] }, oldDiagram);
      
      expect(migration.changes.length).toBeGreaterThan(0);
      expect(migration.changes.every(c => c.type === 'table_added')).toBe(true);
    });

    it('handles tables with no columns', () => {
      const emptyTableDiagram: IRDiagram = {
        tables: [{ name: 'Empty', columns: [] }],
      };
      
      const migration = diffIRDiagrams({ tables: [] }, emptyTableDiagram);
      
      expect(migration.changes).toHaveLength(1);
      expect(migration.changes[0].type).toBe('table_added');
    });

    it('handles very similar but not identical table names', () => {
      const similarDiagram: IRDiagram = {
        tables: [{
          name: 'UserTable', // similar to 'User' but not quite
          columns: oldDiagram.tables[0].columns,
        }],
      };
      
      const migration = diffIRDiagrams(oldDiagram, similarDiagram, { renameThreshold: 0.8 });
      
      // With high threshold, should be detected as remove + add, not rename
      expect(migration.changes.some(c => c.type === 'table_removed')).toBe(false); // includeDrops is false by default
      expect(migration.changes.some(c => c.type === 'table_added')).toBe(true);
    });
  });

  describe('snapshot tests', () => {
    it('matches expected migration plan structure', () => {
      const migration = diffIRDiagrams(
        { 
          tables: [{ 
            name: 'User', 
            columns: [
              { name: 'id', type: 'SERIAL', isPrimaryKey: true },
              { name: 'name', type: 'VARCHAR(100)' }
            ] 
          }] 
        },
        { 
          tables: [{ 
            name: 'User', 
            columns: [
              { name: 'id', type: 'SERIAL', isPrimaryKey: true },
              { name: 'name', type: 'VARCHAR(100)' },
              { name: 'email', type: 'VARCHAR(255)', isOptional: true }
            ] 
          }] 
        }
      );

      expect(migration).toMatchObject({
        complexity: 'simple',
        breakingChanges: 0,
        changes: [
          expect.objectContaining({
            type: 'column_added',
            table: 'User',
            column: 'email',
            risk: 'low',
          })
        ]
      });

      expect(migration.sql).toContain('ALTER TABLE "User" ADD COLUMN "email" VARCHAR(255);');
    });
  });
});