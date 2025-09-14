import { describe, it, expect } from 'vitest';
import { generateSchemaMigration, getSchemaDiffSummary } from '../src/ir-diff';
import type { IRDiagram } from '../src/ir';

describe('Schema Migration/Diff', () => {
  it('should detect new tables', () => {
    const oldDiagram: IRDiagram = {
      tables: [{
        name: 'user',
        columns: [
          { name: 'id', type: 'SERIAL', isPrimaryKey: true },
          { name: 'name', type: 'VARCHAR(255)' }
        ]
      }]
    };

    const newDiagram: IRDiagram = {
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

    const migration = generateSchemaMigration(oldDiagram, newDiagram);

    expect(migration).toContain('CREATE TABLE post (');
    expect(migration).toContain('id INTEGER PRIMARY KEY');
    expect(migration).toContain('title VARCHAR(255) NOT NULL');
    expect(migration).toContain('user_id INTEGER NOT NULL');
    expect(migration).toContain('FOREIGN KEY (user_id) REFERENCES user(id)');

    const summary = getSchemaDiffSummary(oldDiagram, newDiagram);
    expect(summary).toContain('Tables to add: post');
  });

  it('should detect dropped tables', () => {
    const oldDiagram: IRDiagram = {
      tables: [
        {
          name: 'user',
          columns: [
            { name: 'id', type: 'SERIAL', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR(255)' }
          ]
        },
        {
          name: 'temp_table',
          columns: [
            { name: 'id', type: 'SERIAL', isPrimaryKey: true }
          ]
        }
      ]
    };

    const newDiagram: IRDiagram = {
      tables: [{
        name: 'user',
        columns: [
          { name: 'id', type: 'SERIAL', isPrimaryKey: true },
          { name: 'name', type: 'VARCHAR(255)' }
        ]
      }]
    };

    const migration = generateSchemaMigration(oldDiagram, newDiagram);

    expect(migration).toContain('DROP TABLE IF EXISTS temp_table CASCADE;');

    const summary = getSchemaDiffSummary(oldDiagram, newDiagram);
    expect(summary).toContain('Tables to drop: temp_table');
  });

  it('should detect column additions', () => {
    const oldDiagram: IRDiagram = {
      tables: [{
        name: 'user',
        columns: [
          { name: 'id', type: 'SERIAL', isPrimaryKey: true },
          { name: 'name', type: 'VARCHAR(255)' }
        ]
      }]
    };

    const newDiagram: IRDiagram = {
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

    const migration = generateSchemaMigration(oldDiagram, newDiagram);

    expect(migration).toContain('ALTER TABLE user ADD COLUMN email VARCHAR(255) NOT NULL UNIQUE;');
    expect(migration).toContain('ALTER TABLE user ADD COLUMN age INTEGER;');

    const summary = getSchemaDiffSummary(oldDiagram, newDiagram);
    expect(summary).toContain('Tables to modify: user');
    expect(summary).toContain('user: Add columns email, age');
  });

  it('should detect column removals', () => {
    const oldDiagram: IRDiagram = {
      tables: [{
        name: 'user',
        columns: [
          { name: 'id', type: 'SERIAL', isPrimaryKey: true },
          { name: 'name', type: 'VARCHAR(255)' },
          { name: 'old_field', type: 'VARCHAR(100)' }
        ]
      }]
    };

    const newDiagram: IRDiagram = {
      tables: [{
        name: 'user',
        columns: [
          { name: 'id', type: 'SERIAL', isPrimaryKey: true },
          { name: 'name', type: 'VARCHAR(255)' }
        ]
      }]
    };

    const migration = generateSchemaMigration(oldDiagram, newDiagram);

    expect(migration).toContain('ALTER TABLE user DROP COLUMN IF EXISTS old_field;');

    const summary = getSchemaDiffSummary(oldDiagram, newDiagram);
    expect(summary).toContain('user: Drop columns old_field');
  });

  it('should detect column modifications', () => {
    const oldDiagram: IRDiagram = {
      tables: [{
        name: 'user',
        columns: [
          { name: 'id', type: 'SERIAL', isPrimaryKey: true },
          { name: 'name', type: 'VARCHAR(100)' },
          { name: 'age', type: 'INTEGER' }
        ]
      }]
    };

    const newDiagram: IRDiagram = {
      tables: [{
        name: 'user',
        columns: [
          { name: 'id', type: 'SERIAL', isPrimaryKey: true },
          { name: 'name', type: 'VARCHAR(255)' },
          { name: 'age', type: 'INTEGER', isOptional: true, default: '0' }
        ]
      }]
    };

    const migration = generateSchemaMigration(oldDiagram, newDiagram);

    expect(migration).toContain('ALTER TABLE user ALTER COLUMN name TYPE VARCHAR(255);');
    expect(migration).toContain('ALTER TABLE user ALTER COLUMN age DROP NOT NULL;');
    expect(migration).toContain('ALTER TABLE user ALTER COLUMN age SET DEFAULT 0;');

    const summary = getSchemaDiffSummary(oldDiagram, newDiagram);
    expect(summary).toContain('user: Modify columns name, age');
  });

  it('should detect foreign key changes', () => {
    const oldDiagram: IRDiagram = {
      tables: [
        {
          name: 'post',
          columns: [
            { name: 'id', type: 'SERIAL', isPrimaryKey: true },
            { name: 'title', type: 'VARCHAR(255)' },
            { name: 'user_id', type: 'INTEGER' }
          ]
        }
      ]
    };

    const newDiagram: IRDiagram = {
      tables: [
        {
          name: 'post',
          columns: [
            { name: 'id', type: 'SERIAL', isPrimaryKey: true },
            { name: 'title', type: 'VARCHAR(255)' },
            { name: 'user_id', type: 'INTEGER', references: { table: 'user', column: 'id', onDelete: 'CASCADE' } }
          ]
        }
      ]
    };

    const migration = generateSchemaMigration(oldDiagram, newDiagram);

    expect(migration).toContain('ALTER TABLE post ADD CONSTRAINT post_user_id_fkey FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE;');
  });

  it('should handle no changes', () => {
    const diagram: IRDiagram = {
      tables: [{
        name: 'user',
        columns: [
          { name: 'id', type: 'SERIAL', isPrimaryKey: true },
          { name: 'name', type: 'VARCHAR(255)' }
        ]
      }]
    };

    const migration = generateSchemaMigration(diagram, diagram);
    expect(migration).toContain('BEGIN;');
    expect(migration).toContain('COMMIT;');
    expect(migration).not.toContain('CREATE TABLE');
    expect(migration).not.toContain('ALTER TABLE');
    expect(migration).not.toContain('DROP TABLE');

    const summary = getSchemaDiffSummary(diagram, diagram);
    expect(summary).toBe('No changes detected');
  });
});