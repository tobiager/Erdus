import { describe, it, expect } from 'vitest';
import { getTypesForDialect, validateTypeForDialect } from '../src/diagram/services/typeCatalog';

describe('Type Catalog', () => {
  it('should return correct types for default dialect', () => {
    const types = getTypesForDialect('default');
    
    expect(types.some(t => t.name === 'varchar')).toBe(true);
    expect(types.some(t => t.name === 'integer')).toBe(true);
    expect(types.some(t => t.name === 'timestamp')).toBe(true);
    expect(types.some(t => t.name === 'uuid')).toBe(true);
  });

  it('should return PostgreSQL-specific types', () => {
    const types = getTypesForDialect('postgres');
    
    expect(types.some(t => t.name === 'jsonb')).toBe(true);
    expect(types.some(t => t.name === 'timestamptz')).toBe(true);
    expect(types.some(t => t.name === 'array')).toBe(true);
    expect(types.some(t => t.name === 'bytea')).toBe(true);
  });

  it('should return MySQL-specific types', () => {
    const types = getTypesForDialect('mysql');
    
    expect(types.some(t => t.name === 'tinyint')).toBe(true);
    expect(types.some(t => t.name === 'mediumint')).toBe(true);
    expect(types.some(t => t.name === 'longtext')).toBe(true);
    expect(types.some(t => t.name === 'datetime')).toBe(true);
  });

  it('should return SQL Server-specific types', () => {
    const types = getTypesForDialect('mssql');
    
    expect(types.some(t => t.name === 'nvarchar')).toBe(true);
    expect(types.some(t => t.name === 'uniqueidentifier')).toBe(true);
    expect(types.some(t => t.name === 'datetimeoffset')).toBe(true);
    expect(types.some(t => t.name === 'bit')).toBe(true);
  });

  it('should return SQLite-specific types', () => {
    const types = getTypesForDialect('sqlite');
    
    expect(types).toHaveLength(5); // SQLite has only 5 storage classes
    expect(types.some(t => t.name === 'integer')).toBe(true);
    expect(types.some(t => t.name === 'real')).toBe(true);
    expect(types.some(t => t.name === 'text')).toBe(true);
    expect(types.some(t => t.name === 'blob')).toBe(true);
    expect(types.some(t => t.name === 'numeric')).toBe(true);
  });

  it('should validate supported types correctly', () => {
    const validation = validateTypeForDialect('varchar', 'postgres');
    
    expect(validation.valid).toBe(true);
    expect(validation.warnings).toBeUndefined();
  });

  it('should suggest alternatives for unsupported types', () => {
    const validation = validateTypeForDialect('json', 'sqlite');
    
    expect(validation.valid).toBe(false);
    expect(validation.suggestion).toBe('text');
  });

  it('should provide UUID alternatives', () => {
    const mysqlValidation = validateTypeForDialect('uuid', 'mysql');
    const sqliteValidation = validateTypeForDialect('uuid', 'sqlite');
    
    expect(mysqlValidation.valid).toBe(false);
    expect(mysqlValidation.suggestion).toBe('char(36)');
    
    expect(sqliteValidation.valid).toBe(false);
    expect(sqliteValidation.suggestion).toBe('text');
  });

  it('should provide serial alternatives', () => {
    const mysqlValidation = validateTypeForDialect('serial', 'mysql');
    const mssqlValidation = validateTypeForDialect('serial', 'mssql');
    const sqliteValidation = validateTypeForDialect('serial', 'sqlite');
    
    expect(mysqlValidation.suggestion).toBe('int AUTO_INCREMENT');
    expect(mssqlValidation.suggestion).toBe('int IDENTITY(1,1)');
    expect(sqliteValidation.suggestion).toBe('integer PRIMARY KEY AUTOINCREMENT');
  });

  it('should handle type categories correctly', () => {
    const types = getTypesForDialect('postgres');
    
    const numericTypes = types.filter(t => t.category === 'numeric');
    const textTypes = types.filter(t => t.category === 'text');
    const datetimeTypes = types.filter(t => t.category === 'datetime');
    
    expect(numericTypes.length).toBeGreaterThan(0);
    expect(textTypes.length).toBeGreaterThan(0);
    expect(datetimeTypes.length).toBeGreaterThan(0);
    
    expect(numericTypes.some(t => t.name === 'integer')).toBe(true);
    expect(textTypes.some(t => t.name === 'varchar')).toBe(true);
    expect(datetimeTypes.some(t => t.name === 'timestamp')).toBe(true);
  });
});