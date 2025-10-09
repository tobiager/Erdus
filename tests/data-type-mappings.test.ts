import { describe, it, expect } from 'vitest';
import { getDataTypesForLanguage, getDataTypeInfo } from '../src/data-type-mappings';

describe('data-type-mappings', () => {
  describe('getDataTypesForLanguage', () => {
    it('should return data types for mysql', () => {
      const types = getDataTypesForLanguage('mysql');
      
      expect(types).toContain('INT');
      expect(types).toContain('VARCHAR');
      expect(types).toContain('DATE');
      expect(types).toContain('JSON');
      expect(types).toContain('GEOMETRY');
      expect(types.length).toBeGreaterThan(10);
    });

    it('should return data types for postgresql', () => {
      const types = getDataTypesForLanguage('postgresql');
      
      expect(types).toContain('INTEGER');
      expect(types).toContain('VARCHAR');
      expect(types).toContain('TIMESTAMP');
      expect(types).toContain('JSON');
      expect(types).toContain('JSONB');
      expect(types).toContain('UUID');
      expect(types).toContain('ARRAY');
    });

    it('should return default types for unknown language', () => {
      const types = getDataTypesForLanguage('unknown');
      
      expect(types).toContain('INT');
      expect(types).toContain('VARCHAR');
      expect(types).toContain('TEXT');
      expect(types).toContain('DATE');
    });

    it('should return sqlite types', () => {
      const types = getDataTypesForLanguage('sqlite');
      
      expect(types).toContain('INTEGER');
      expect(types).toContain('TEXT');
      expect(types).toContain('REAL');
      expect(types).toContain('BLOB');
    });
  });

  describe('getDataTypeInfo', () => {
    it('should return info for mysql INT', () => {
      const info = getDataTypeInfo('mysql', 'INT');
      
      expect(info).toBeDefined();
      expect(info?.description).toBe('Standard integer');
      expect(info?.range).toBe('4 bytes');
    });

    it('should return info for postgresql UUID', () => {
      const info = getDataTypeInfo('postgresql', 'UUID');
      
      expect(info).toBeDefined();
      expect(info?.description).toBe('Universally unique identifier');
    });

    it('should return info for mysql VARCHAR with length support', () => {
      const info = getDataTypeInfo('mysql', 'VARCHAR');
      
      expect(info).toBeDefined();
      expect(info?.length).toBe(true);
      expect(info?.maxLength).toBe(65535);
    });

    it('should return info for mysql DECIMAL with precision/scale', () => {
      const info = getDataTypeInfo('mysql', 'DECIMAL');
      
      expect(info).toBeDefined();
      expect(info?.precision).toBe(true);
      expect(info?.scale).toBe(true);
    });

    it('should return undefined for non-existent type', () => {
      const info = getDataTypeInfo('mysql', 'NONEXISTENT');
      
      expect(info).toBeUndefined();
    });

    it('should fall back to default for unknown language', () => {
      const info = getDataTypeInfo('unknown', 'VARCHAR');
      
      expect(info).toBeDefined();
      expect(info?.length).toBe(true);
    });
  });
});
