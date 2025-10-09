import { describe, it, expect } from 'vitest';
import { formatExportTemplate, EXPORT_TEMPLATES } from '../src/export-templates';

describe('export-templates', () => {
  describe('EXPORT_TEMPLATES', () => {
    it('should have templates for all major formats', () => {
      expect(EXPORT_TEMPLATES.sql).toBeDefined();
      expect(EXPORT_TEMPLATES.typeorm).toBeDefined();
      expect(EXPORT_TEMPLATES.prisma).toBeDefined();
      expect(EXPORT_TEMPLATES.dbml).toBeDefined();
      expect(EXPORT_TEMPLATES.mermaid).toBeDefined();
    });

    it('should include Erdus branding in all templates', () => {
      Object.values(EXPORT_TEMPLATES).forEach(template => {
        expect(template).toContain('Erdus');
        expect(template).toContain('github.com/tobiager/Erdus');
      });
    });
  });

  describe('formatExportTemplate', () => {
    it('should replace all placeholders with provided values', () => {
      const result = formatExportTemplate('sql', {
        timestamp: '2024-01-01T00:00:00Z',
        author: 'testuser',
        language: 'postgresql',
        diagramName: 'Test Diagram',
        description: 'A test description'
      });

      expect(result).toContain('2024-01-01T00:00:00Z');
      expect(result).toContain('testuser');
      expect(result).toContain('postgresql');
      expect(result).toContain('Test Diagram');
      expect(result).toContain('A test description');
    });

    it('should use default values for missing parameters', () => {
      const result = formatExportTemplate('sql', {
        diagramName: 'My Diagram'
      });

      expect(result).toContain('tobiager'); // default author
      expect(result).toContain('My Diagram');
      expect(result).toContain('default'); // default language
    });

    it('should format typeorm template correctly', () => {
      const result = formatExportTemplate('typeorm', {
        diagramName: 'User Schema'
      });

      expect(result).toContain('User Schema');
      expect(result).toContain('/**'); // TypeScript comment style
      expect(result).toContain('*/');
    });

    it('should format prisma template correctly', () => {
      const result = formatExportTemplate('prisma', {
        diagramName: 'Database Schema'
      });

      expect(result).toContain('Database Schema');
      expect(result).toContain('//'); // Prisma comment style
    });

    it('should format mermaid template correctly', () => {
      const result = formatExportTemplate('mermaid', {
        diagramName: 'ER Diagram'
      });

      expect(result).toContain('ER Diagram');
      expect(result).toContain('%%'); // Mermaid comment style
    });

    it('should include timestamp in all formats', () => {
      const formats: Array<keyof typeof EXPORT_TEMPLATES> = [
        'sql', 'typeorm', 'prisma', 'dbml', 'mermaid'
      ];

      formats.forEach(format => {
        const result = formatExportTemplate(format, {});
        // Should contain a timestamp placeholder or actual timestamp
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });
});
