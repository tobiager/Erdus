import { describe, it, expect } from 'vitest';
import { parseSQLServer } from '../src/migrations/ingest/parse-sqlserver';

describe('SQL Server Migration', () => {
  it('should parse basic CREATE TABLE statement', () => {
    const ddl = `
      CREATE TABLE Users (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Email NVARCHAR(255) NOT NULL UNIQUE,
        Name NVARCHAR(100) NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        IsActive BIT DEFAULT 1
      );
    `;

    const schema = parseSQLServer(ddl);
    
    expect(schema.tables).toHaveLength(1);
    
    const table = schema.tables[0];
    expect(table.name).toBe('Users');
    expect(table.columns).toHaveLength(5);
    
    const idColumn = table.columns.find(c => c.name === 'Id');
    expect(idColumn?.type).toBe('INT');
    expect(idColumn?.isPrimaryKey).toBe(true);
    expect(idColumn?.nullable).toBe(false);
    
    const emailColumn = table.columns.find(c => c.name === 'Email');
    expect(emailColumn?.type).toBe('NVARCHAR');
    expect(emailColumn?.isUnique).toBe(true);
    expect(emailColumn?.nullable).toBe(false);
    
    const createdAtColumn = table.columns.find(c => c.name === 'CreatedAt');
    expect(createdAtColumn?.defaultValue).toBe('now()'); // Should be mapped
  });

  it('should handle foreign key constraints', () => {
    const ddl = `
      CREATE TABLE Posts (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Title NVARCHAR(200) NOT NULL,
        UserId INT NOT NULL,
        CONSTRAINT FK_Posts_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
      );
    `;

    const schema = parseSQLServer(ddl);
    
    const table = schema.tables[0];
    const fkConstraint = table.constraints.find(c => c.type === 'foreign_key');
    
    expect(fkConstraint).toBeDefined();
    expect(fkConstraint?.columns).toEqual(['UserId']);
    expect(fkConstraint?.referencedTable).toBe('Users');
    expect(fkConstraint?.referencedColumns).toEqual(['Id']);
    expect(fkConstraint?.onDelete).toBe('CASCADE');
  });
});