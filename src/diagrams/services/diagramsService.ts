import { ERProject, Dialect } from '../../types';
import { nanoid } from 'nanoid';

const RECENT_PROJECTS_KEY = 'erdus-recent-projects';
const MAX_RECENT_PROJECTS = 12;

export interface ProjectMetadata {
  id: string;
  name: string;
  dialect: string;
  tableCount: number;
  lastModified: string;
  description?: string;
}

class DiagramsService {
  private getStorage(): Storage | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    return null;
  }

  private safeJSONParse<T>(value: string | null, defaultValue: T): T {
    if (!value) return defaultValue;
    try {
      return JSON.parse(value);
    } catch {
      return defaultValue;
    }
  }

  getRecentProjects(): ProjectMetadata[] {
    const storage = this.getStorage();
    if (!storage) return [];

    const projects = this.safeJSONParse<ProjectMetadata[]>(
      storage.getItem(RECENT_PROJECTS_KEY),
      []
    );

    return projects
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
      .slice(0, MAX_RECENT_PROJECTS);
  }

  saveRecentProject(project: ERProject): void {
    const storage = this.getStorage();
    if (!storage) return;

    const metadata: ProjectMetadata = {
      id: project.id,
      name: project.name,
      dialect: project.settings.dialect,
      tableCount: project.schemas[0]?.tables.length || 0,
      lastModified: project.updatedAt,
      description: project.description,
    };

    const existingProjects = this.getRecentProjects();
    const filteredProjects = existingProjects.filter(p => p.id !== project.id);
    const updatedProjects = [metadata, ...filteredProjects].slice(0, MAX_RECENT_PROJECTS);

    storage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(updatedProjects));
  }

  removeRecentProject(projectId: string): void {
    const storage = this.getStorage();
    if (!storage) return;

    const existingProjects = this.getRecentProjects();
    const filteredProjects = existingProjects.filter(p => p.id !== projectId);
    
    storage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(filteredProjects));
  }

  clearRecentProjects(): void {
    const storage = this.getStorage();
    if (!storage) return;

    storage.removeItem(RECENT_PROJECTS_KEY);
  }

  createProject(
    name: string, 
    dialect: Dialect, 
    template: 'empty' = 'empty'
  ): ERProject {
    const now = new Date().toISOString();
    const projectId = nanoid();

    const project: ERProject = {
      id: projectId,
      name: name.trim(),
      description: '',
      createdAt: now,
      updatedAt: now,
      version: '1.0.0',
      settings: {
        dialect,
        createdAt: now,
        repoUrl: 'https://github.com/tobiager/erdus',
        demoUrl: 'https://erdus.vercel.app',
      },
      schemas: [
        {
          id: nanoid(),
          name: 'public',
          tables: template === 'empty' ? [] : this.getTemplateData(template),
          views: [],
          enums: [],
        },
      ],
    };

    return project;
  }

  private getTemplateData(template: string) {
    switch (template) {
      case 'crud':
        return [
          {
            id: nanoid(),
            name: 'users',
            position: { x: 100, y: 100 },
            columns: [
              { 
                id: nanoid(), 
                name: 'id', 
                type: 'int', 
                isPrimaryKey: true, 
                isOptional: false,
                default: 'autoincrement()'
              },
              { 
                id: nanoid(), 
                name: 'name', 
                type: 'varchar(100)', 
                isPrimaryKey: false, 
                isOptional: false 
              },
              { 
                id: nanoid(), 
                name: 'email', 
                type: 'varchar(255)', 
                isPrimaryKey: false, 
                isOptional: false,
                isUnique: true
              },
            ],
            primaryKey: ['id'],
          },
          {
            id: nanoid(),
            name: 'posts',
            position: { x: 400, y: 100 },
            columns: [
              { 
                id: nanoid(), 
                name: 'id', 
                type: 'int', 
                isPrimaryKey: true, 
                isOptional: false,
                default: 'autoincrement()'
              },
              { 
                id: nanoid(), 
                name: 'title', 
                type: 'varchar(200)', 
                isPrimaryKey: false, 
                isOptional: false 
              },
              { 
                id: nanoid(), 
                name: 'content', 
                type: 'text', 
                isPrimaryKey: false, 
                isOptional: true 
              },
              { 
                id: nanoid(), 
                name: 'user_id', 
                type: 'int', 
                isPrimaryKey: false, 
                isOptional: false,
                references: { table: 'users', column: 'id', onDelete: 'CASCADE' }
              },
            ],
            primaryKey: ['id'],
          },
        ];
      default:
        return [];
    }
  }

  importFromFile(file: File): Promise<ERProject> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const extension = file.name.split('.').pop()?.toLowerCase();
          
          switch (extension) {
            case 'json':
              // Try to parse as Erdus project or other JSON format
              const data = JSON.parse(content);
              if (this.isErdusProject(data)) {
                resolve(data);
              } else {
                reject(new Error('Invalid Erdus project format'));
              }
              break;
            case 'sql':
              // TODO: Implement SQL parsing
              reject(new Error('SQL import not yet implemented'));
              break;
            case 'dbml':
              // TODO: Implement DBML parsing
              reject(new Error('DBML import not yet implemented'));
              break;
            default:
              reject(new Error('Unsupported file format'));
          }
        } catch (error) {
          reject(new Error('Failed to parse file: ' + (error as Error).message));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private isErdusProject(data: any): data is ERProject {
    return (
      typeof data === 'object' &&
      typeof data.id === 'string' &&
      typeof data.name === 'string' &&
      Array.isArray(data.schemas) &&
      typeof data.settings === 'object' &&
      typeof data.settings.dialect === 'string'
    );
  }
}

export const diagramsService = new DiagramsService();