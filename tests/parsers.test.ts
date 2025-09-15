import { describe, it, expect } from 'vitest';
import { parsePostgreSQL, generatePostgreSQL } from '../src/parsers/postgresql';
import { parseMySQL, generateMySQL } from '../src/parsers/mysql';
import { parseSQLite, generateSQLite } from '../src/parsers/sqlite';

describe('Database Parsers', () => {
  describe('PostgreSQL Parser', () => {
    it('should parse simple CREATE TABLE statement', () => {
      const sql = `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `;

      const result = parsePostgreSQL(sql);
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should parse foreign key constraints', () => {
      const sql = `
        CREATE TABLE posts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          title VARCHAR(255) NOT NULL
        );
      `;

      const result = parsePostgreSQL(sql);
      expect(result.success).toBe(true);
    });

    it('should handle ALTER TABLE statements', () => {
      const sql = `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255)
        );
        
        ALTER TABLE users ADD CONSTRAINT fk_user_profile 
        FOREIGN KEY (profile_id) REFERENCES profiles(id);
      `;

      const result = parsePostgreSQL(sql);
      expect(result.success).toBe(true);
    });
  });

  describe('MySQL Parser', () => {
    it('should parse MySQL-specific syntax', () => {
      const sql = `
        CREATE TABLE \`users\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`name\` VARCHAR(255) NOT NULL,
          \`status\` ENUM('active', 'inactive') DEFAULT 'active'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;

      const result = parseMySQL(sql);
      expect(result.success).toBe(true);
    });

    it('should handle foreign keys in table definition', () => {
      const sql = `
        CREATE TABLE posts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          title VARCHAR(255),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `;

      const result = parseMySQL(sql);
      expect(result.success).toBe(true);
    });
  });

  describe('SQLite Parser', () => {
    it('should parse SQLite syntax', () => {
      const sql = `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE
        );
      `;

      const result = parseSQLite(sql);
      expect(result.success).toBe(true);
    });

    it('should handle WITHOUT ROWID tables', () => {
      const sql = `
        CREATE TABLE settings (
          key TEXT PRIMARY KEY,
          value TEXT
        ) WITHOUT ROWID;
      `;

      const result = parseSQLite(sql);
      expect(result.success).toBe(true);
    });
  });
});

describe('Database Generators', () => {
  const sampleIR = {
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
              column: 'id',
              onDelete: 'CASCADE'
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

  describe('PostgreSQL Generator', () => {
    it('should generate valid PostgreSQL DDL', () => {
      const sql = generatePostgreSQL(sampleIR);
      
      expect(sql).toContain('CREATE TABLE "users"');
      expect(sql).toContain('SERIAL');
      expect(sql).toContain('FOREIGN KEY');
      expect(sql).toContain('REFERENCES');
    });

    it('should include comments when requested', () => {
      const sql = generatePostgreSQL(sampleIR, { includeComments: true });
      
      expect(sql).toContain('-- Generated PostgreSQL schema');
      expect(sql).toContain('-- Table:');
    });
  });

  describe('MySQL Generator', () => {
    it('should generate valid MySQL DDL', () => {
      const sql = generateMySQL(sampleIR);
      
      expect(sql).toContain('CREATE TABLE `users`');
      expect(sql).toContain('AUTO_INCREMENT');
      expect(sql).toContain('ENGINE=InnoDB');
      expect(sql).toContain('CHARSET=utf8mb4');
    });
  });

  describe('SQLite Generator', () => {
    it('should generate valid SQLite DDL', () => {
      const sql = generateSQLite(sampleIR);
      
      expect(sql).toContain('CREATE TABLE "users"');
      expect(sql).toContain('AUTOINCREMENT');
      expect(sql).toContain('PRAGMA foreign_keys = ON');
    });
  });
});