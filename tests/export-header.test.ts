import { describe, it, expect } from 'vitest';
import { generateExportHeader, generateSqlHeader, generatePrismaHeader } from '../src/diagram/services/exportHeader';
import { ERProject } from '../src/types';

const mockProject: ERProject = {
  id: 'test-123',
  name: 'Test Project',
  settings: {
    dialect: 'postgres',
    createdAt: '2023-09-24T10:00:00.000Z',
    repoUrl: 'https://github.com/test/repo',
    demoUrl: 'https://test.demo.com'
  },
  schemas: [{
    name: 'public',
    tables: []
  }],
  createdAt: '2023-09-24T10:00:00.000Z',
  updatedAt: '2023-09-24T12:00:00.000Z'
};

describe('Export Header', () => {
  it('should generate SQL header with correct format', () => {
    const header = generateSqlHeader(mockProject);
    
    expect(header).toContain('-- Hecho por Erdus');
    expect(header).toContain('-- Repo: https://github.com/test/repo');
    expect(header).toContain('-- Demo: https://test.demo.com');
    expect(header).toContain('-- Proyecto: Test Project');
    expect(header).toContain('-- Exportado:');
    expect(header).toContain('============================================================');
  });

  it('should generate Prisma header with correct format', () => {
    const header = generatePrismaHeader(mockProject);
    
    expect(header).toContain('// Hecho por Erdus');
    expect(header).toContain('// Repo: https://github.com/test/repo');
    expect(header).toContain('// Demo: https://test.demo.com');
    expect(header).toContain('// Proyecto: Test Project');
    expect(header).toContain('// Exportado:');
  });

  it('should use default URLs when project URLs are not provided', () => {
    const projectWithoutUrls: ERProject = {
      ...mockProject,
      settings: {
        ...mockProject.settings,
        repoUrl: undefined,
        demoUrl: undefined
      }
    };

    const header = generateExportHeader({ project: projectWithoutUrls, format: 'sql' });
    
    expect(header).toContain('-- Repo: https://github.com/tobiager/erdus');
    expect(header).toContain('-- Demo: https://erdus.vercel.app');
  });

  it('should handle different comment prefixes', () => {
    const header = generateExportHeader({ 
      project: mockProject, 
      format: 'mermaid',
      commentPrefix: '%%'
    });
    
    expect(header).toContain('%% Hecho por Erdus');
    expect(header).toContain('%% Proyecto: Test Project');
  });

  it('should not generate header for JSON format', () => {
    const header = generateExportHeader({ project: mockProject, format: 'json' });
    expect(header).toBe('');
  });
});