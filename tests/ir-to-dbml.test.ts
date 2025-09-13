import { describe, it, expect } from 'vitest';
import { irToDbml } from '../src/ir-to-dbml';
import type { IRDiagram } from '../src/ir';

describe('IR to DBML conversion', () => {
  it('should convert a simple IR diagram to DBML', () => {
    const ir: IRDiagram = {
      tables: [
        {
          name: 'users',
          columns: [
            { name: 'id', type: 'Int', isPrimaryKey: true, default: 'autoincrement()' },
            { name: 'email', type: 'String', isUnique: true },
            { name: 'name', type: 'String', isOptional: true },
          ],
        },
        {
          name: 'posts',
          columns: [
            { name: 'id', type: 'Int', isPrimaryKey: true, default: 'autoincrement()' },
            { name: 'title', type: 'String' },
            { name: 'user_id', type: 'Int', references: { table: 'users', column: 'id' } },
          ],
        },
      ],
    };

    const dbml = irToDbml(ir, { includeComments: true });

    expect(dbml).toContain('Table users {');
    expect(dbml).toContain('id int [pk, increment]');
    expect(dbml).toContain('email varchar [unique, not null]');
    expect(dbml).toContain('name varchar');
    expect(dbml).toContain('Table posts {');
    expect(dbml).toContain('title varchar [not null]');
    expect(dbml).toContain('user_id int [not null]');
    expect(dbml).toContain('Ref: posts.user_id > users.id');
  });

  it('should handle tables without relationships', () => {
    const ir: IRDiagram = {
      tables: [
        {
          name: 'settings',
          columns: [
            { name: 'key', type: 'String', isPrimaryKey: true },
            { name: 'value', type: 'String' },
          ],
        },
      ],
    };

    const dbml = irToDbml(ir);

    expect(dbml).toContain('Table settings {');
    expect(dbml).toContain('key varchar [pk]');
    expect(dbml).toContain('value varchar [not null]');
    expect(dbml).not.toContain('Ref:');
  });

  it('should map different column types correctly', () => {
    const ir: IRDiagram = {
      tables: [
        {
          name: 'test_types',
          columns: [
            { name: 'id', type: 'Int', isPrimaryKey: true },
            { name: 'created_at', type: 'DateTime' },
            { name: 'is_active', type: 'Boolean' },
            { name: 'price', type: 'Float' },
            { name: 'description', type: 'VARCHAR(500)' },
          ],
        },
      ],
    };

    const dbml = irToDbml(ir);

    expect(dbml).toContain('id int [pk]');
    expect(dbml).toContain('created_at timestamp [not null]');
    expect(dbml).toContain('is_active boolean [not null]');
    expect(dbml).toContain('price decimal [not null]');
    expect(dbml).toContain('description varchar [not null]');
  });
});