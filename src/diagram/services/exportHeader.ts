import { ERProject } from '../../types';

export interface ExportHeaderOptions {
  project: ERProject;
  format: 'sql' | 'prisma' | 'typeorm' | 'dbml' | 'mermaid' | 'json';
  commentPrefix?: string;
  multiline?: boolean;
}

export function generateExportHeader(options: ExportHeaderOptions): string {
  const { project, format, commentPrefix, multiline = false } = options;
  
  // Determine comment prefix based on format if not provided
  let prefix = commentPrefix;
  if (!prefix) {
    switch (format) {
      case 'sql':
        prefix = '--';
        break;
      case 'prisma':
      case 'typeorm':
      case 'dbml':
        prefix = '//';
        break;
      case 'mermaid':
        prefix = '%%';
        break;
      case 'json':
        return ''; // JSON doesn't support comments
      default:
        prefix = '--';
    }
  }

  const repoUrl = project.settings.repoUrl || 'https://github.com/tobiager/erdus';
  const demoUrl = project.settings.demoUrl || 'https://erdus.vercel.app';
  const exportedDate = new Date().toISOString();

  const lines = [
    'Hecho por Erdus',
    `Repo: ${repoUrl}`,
    `Demo: ${demoUrl}`,
    `Proyecto: ${project.name}`,
    `Exportado: ${exportedDate}`
  ];

  if (multiline) {
    const header = [
      `${prefix} ${new Array(60).fill('=').join('')}`,
      ...lines.map(line => `${prefix} ${line}`),
      `${prefix} ${new Array(60).fill('=').join('')}`,
      ''
    ].join('\n');
    return header;
  } else {
    return lines.map(line => `${prefix} ${line}`).join('\n') + '\n\n';
  }
}

// Convenience functions for specific formats
export function generateSqlHeader(project: ERProject): string {
  return generateExportHeader({ project, format: 'sql', multiline: true });
}

export function generatePrismaHeader(project: ERProject): string {
  return generateExportHeader({ project, format: 'prisma' });
}

export function generateTypeOrmHeader(project: ERProject): string {
  return generateExportHeader({ project, format: 'typeorm' });
}

export function generateDbmlHeader(project: ERProject): string {
  return generateExportHeader({ project, format: 'dbml' });
}

export function generateMermaidHeader(project: ERProject): string {
  return generateExportHeader({ project, format: 'mermaid' });
}