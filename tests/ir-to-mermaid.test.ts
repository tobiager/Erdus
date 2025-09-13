import { describe, it, expect } from 'vitest';
import { irToMermaid } from '../src/ir-to-mermaid';
import type { IRDiagram } from '../src/ir';

describe('IR to Mermaid conversion', () => {
  it('should convert a simple IR diagram to Mermaid ER', () => {
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

    const mermaid = irToMermaid(ir, { includeAttributes: true });

    expect(mermaid).toContain('erDiagram');
    expect(mermaid).toContain('users {');
    expect(mermaid).toContain('int id "PK, AUTO_INCREMENT"');
    expect(mermaid).toContain('varchar email "UK, NOT NULL"');
    expect(mermaid).toContain('varchar name');
    expect(mermaid).toContain('posts {');
    expect(mermaid).toContain('varchar title "NOT NULL"');
    expect(mermaid).toContain('int user_id "FK, NOT NULL"');
    expect(mermaid).toContain('users ||--o{ posts : "has_user_id"');
  });

  it('should handle entity names with special characters', () => {
    const ir: IRDiagram = {
      tables: [
        {
          name: 'user-profiles',
          columns: [
            { name: 'id', type: 'Int', isPrimaryKey: true },
          ],
        },
      ],
    };

    const mermaid = irToMermaid(ir);

    expect(mermaid).toContain('user_profiles {');
  });

  it('should work without attributes when disabled', () => {
    const ir: IRDiagram = {
      tables: [
        {
          name: 'users',
          columns: [
            { name: 'id', type: 'Int', isPrimaryKey: true },
            { name: 'name', type: 'String' },
          ],
        },
      ],
    };

    const mermaid = irToMermaid(ir, { includeAttributes: false });

    expect(mermaid).toContain('erDiagram');
    expect(mermaid).toContain('users {');
    expect(mermaid).toContain('}');
    expect(mermaid).not.toContain('int id');
    expect(mermaid).not.toContain('varchar name');
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
            { name: 'price', type: 'DECIMAL(10,2)' },
            { name: 'description', type: 'TEXT' },
          ],
        },
      ],
    };

    const mermaid = irToMermaid(ir);

    expect(mermaid).toContain('int id "PK"');
    expect(mermaid).toContain('timestamp created_at "NOT NULL"');
    expect(mermaid).toContain('boolean is_active "NOT NULL"');
    expect(mermaid).toContain('decimal price "NOT NULL"');
    expect(mermaid).toContain('varchar description "NOT NULL"');
  });
});