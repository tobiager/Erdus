import { describe, it, expect } from 'vitest';
import { toSQL, toDBML, toIR } from '../src/app/diagrams/services/exporters';
import { fromErdus, fromDBML } from '../src/app/diagrams/services/importers';
import { IRDiagram } from '../src/ir';

const sampleIR: IRDiagram = {
  tables: [
    {
      name: 'users',
      columns: [
        {
          name: 'id',
          type: 'INTEGER',
          isPrimaryKey: true,
          isOptional: false,
        },
        {
          name: 'email',
          type: 'VARCHAR(255)',
          isUnique: true,
          isOptional: false,
        },
        {
          name: 'name',
          type: 'VARCHAR(100)',
          isOptional: true,
        },
      ],
    },
    {
      name: 'posts',
      columns: [
        {
          name: 'id',
          type: 'INTEGER',
          isPrimaryKey: true,
          isOptional: false,
        },
        {
          name: 'title',
          type: 'VARCHAR(200)',
          isOptional: false,
        },
        {
          name: 'user_id',
          type: 'INTEGER',
          isOptional: false,
          references: {
            table: 'users',
            column: 'id',
            onDelete: 'CASCADE',
          },
        },
      ],
    },
  ],
};

describe('Diagram Export/Import', () => {
  describe('SQL Export', () => {
    it('should export to PostgreSQL DDL', () => {
      const sql = toSQL(sampleIR, 'postgres', 'Test Project');
      
      expect(sql).toContain('Generated with Erdus');
      expect(sql).toContain('Test Project');
      expect(sql).toContain('CREATE TABLE "users"');
      expect(sql).toContain('CREATE TABLE "posts"');
      expect(sql).toContain('"id" INTEGER NOT NULL PRIMARY KEY');
      expect(sql).toContain('ADD CONSTRAINT fk_posts_user_id');
      expect(sql).toContain('ON DELETE CASCADE');
    });

    it('should export to MySQL DDL', () => {
      const sql = toSQL(sampleIR, 'mysql');
      
      expect(sql).toContain('CREATE TABLE `users`');
      expect(sql).toContain('CREATE TABLE `posts`');
      expect(sql).toContain('`id` INT NOT NULL PRIMARY KEY');
    });

    it('should export to SQLite DDL', () => {
      const sql = toSQL(sampleIR, 'sqlite');
      
      expect(sql).toContain('CREATE TABLE "users"');
      expect(sql).toContain('CREATE TABLE "posts"');
      expect(sql).toContain('"email" TEXT(255) NOT NULL UNIQUE');
    });
  });

  describe('DBML Export/Import', () => {
    it('should export to DBML format', () => {
      const dbml = toDBML(sampleIR, 'Test Project');
      
      expect(dbml).toContain('Generated with Erdus');
      expect(dbml).toContain('Table users {');
      expect(dbml).toContain('Table posts {');
      expect(dbml).toContain('id INTEGER [pk, not null]');
      expect(dbml).toContain('email VARCHAR(255) [not null, unique]');
      expect(dbml).toContain('Ref: posts.user_id > users.id');
    });

    it('should import from DBML format', async () => {
      const dbmlContent = `
        Table users {
          id INTEGER [pk, not null]
          email VARCHAR(255) [unique, not null]
          name VARCHAR(100)
        }
        
        Table posts {
          id INTEGER [pk, not null]
          title VARCHAR(200) [not null]
          user_id INTEGER [not null]
        }
        
        Ref: posts.user_id > users.id
      `;

      const result = await fromDBML(dbmlContent);
      
      expect(result.ir.tables).toHaveLength(2);
      expect(result.ir.tables[0].name).toBe('users');
      expect(result.ir.tables[1].name).toBe('posts');
      
      const userIdCol = result.ir.tables[1].columns.find(c => c.name === 'user_id');
      expect(userIdCol?.references?.table).toBe('users');
      expect(userIdCol?.references?.column).toBe('id');
    });
  });

  describe('IR Round-trip', () => {
    it('should export and import IR without loss', async () => {
      const exported = toIR(sampleIR);
      const result = await fromErdus(exported);
      
      expect(result.ir).toEqual(sampleIR);
    });
  });

  describe('Type Mapping', () => {
    it('should map types correctly for different engines', () => {
      const testIR: IRDiagram = {
        tables: [
          {
            name: 'test',
            columns: [
              { name: 'varchar_col', type: 'VARCHAR(255)', isOptional: false },
              { name: 'int_col', type: 'INTEGER', isOptional: false },
              { name: 'bool_col', type: 'BOOLEAN', isOptional: false },
              { name: 'timestamp_col', type: 'TIMESTAMP', isOptional: false },
            ],
          },
        ],
      };

      const postgresSQL = toSQL(testIR, 'postgres');
      expect(postgresSQL).toContain('VARCHAR(255)');
      expect(postgresSQL).toContain('INTEGER');
      expect(postgresSQL).toContain('BOOLEAN');
      expect(postgresSQL).toContain('TIMESTAMP');

      const mysqlSQL = toSQL(testIR, 'mysql');
      expect(mysqlSQL).toContain('VARCHAR(255)');
      expect(mysqlSQL).toContain('INT');
      expect(mysqlSQL).toContain('BOOLEAN');
      expect(mysqlSQL).toContain('TIMESTAMP');

      const sqliteSQL = toSQL(testIR, 'sqlite');
      expect(sqliteSQL).toContain('"varchar_col" TEXT');
      expect(sqliteSQL).toContain('"int_col" INTEGER');
      expect(sqliteSQL).toContain('"bool_col" INTEGER');
      expect(sqliteSQL).toContain('"timestamp_col" TEXT');
    });
  });
});