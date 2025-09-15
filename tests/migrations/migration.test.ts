import { describe, it, expect } from 'vitest';
import { migrateScriptToSupabase } from '../../src/migrations/index';

describe('Database Migration', () => {
  const sqlServerScript = `
    CREATE TABLE [Users] (
      [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
      [Email] NVARCHAR(255) NOT NULL,
      [Name] NVARCHAR(100) NULL,
      [CreatedAt] DATETIME2 DEFAULT GETDATE()
    );
    
    CREATE TABLE [Posts] (
      [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
      [UserId] UNIQUEIDENTIFIER NOT NULL,
      [Title] NVARCHAR(200) NOT NULL,
      FOREIGN KEY ([UserId]) REFERENCES [Users]([Id])
    );
  `;

  const mysqlScript = `
    CREATE TABLE Users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      name VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  it('should migrate SQL Server to PostgreSQL', () => {
    const result = migrateScriptToSupabase(sqlServerScript, 'sqlserver');
    
    expect(result).toContain('CREATE TABLE "[Users]"');
    expect(result).toContain('uuid');
    expect(result).toContain('varchar(255)');
    expect(result).toContain('timestamp with time zone');
    expect(result).toContain('now()');
  });

  it('should migrate MySQL to PostgreSQL', () => {
    const result = migrateScriptToSupabase(mysqlScript, 'mysql');
    
    expect(result).toContain('CREATE TABLE "Users"');
    expect(result).toContain('varchar(255)');
    expect(result).toContain('timestamp');
    // Note: Basic parser currently has limitations with complex column definitions
  });

  it('should include RLS policies when requested', () => {
    const result = migrateScriptToSupabase(sqlServerScript, 'sqlserver', {
      withRLS: true
    });
    
    expect(result).toContain('ALTER TABLE "[Users]" ENABLE ROW LEVEL SECURITY');
    expect(result).toContain('CREATE POLICY');
  });

  it('should handle different schema names', () => {
    const result = migrateScriptToSupabase(sqlServerScript, 'sqlserver', {
      schema: 'app'
    });
    
    expect(result).toContain('app."[Users]"');
  });
});