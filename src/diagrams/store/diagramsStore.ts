import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { ERProject, ERTable, ERColumn, Dialect } from '../../types';
import { diagramsService } from '../services/diagramsService';

interface HistoryState {
  project: ERProject | null;
  selectedTable: string | null;
  selectedColumn: string | null;
}

interface DiagramState {
  // Current state
  project: ERProject | null;
  selectedTable: string | null;
  selectedColumn: string | null;
  
  // History for undo/redo
  history: HistoryState[];
  historyIndex: number;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  sidebarCollapsed: boolean;
  propertiesCollapsed: boolean;
  recentProjects: ERProject[];
  
  // Table colors
  tableColors: Record<string, string>;
  
  // Actions
  createProject: (name: string, dialect: Dialect, template?: string) => string;
  loadProject: (project: ERProject) => void;
  loadProjectById: (id: string) => Promise<void>;
  setDialect: (dialect: Dialect) => void;
  
  // Table operations
  addTable: (name?: string, position?: { x: number; y: number }) => void;
  removeTable: (tableId: string) => void;
  renameTable: (tableId: string, newName: string) => void;
  setTablePosition: (tableId: string, position: { x: number; y: number }) => void;
  setTableComment: (tableId: string, comment: string) => void;
  
  // Column operations
  addColumn: (tableId: string, column?: Partial<ERColumn>) => void;
  removeColumn: (tableId: string, columnName: string) => void;
  updateColumn: (tableId: string, columnName: string, updates: Partial<ERColumn>) => void;
  
  // FK operations
  createForeignKey: (sourceTableId: string, targetTableId: string, columnName?: string) => void;
  removeForeignKey: (tableId: string, columnName: string) => void;
  
  // Selection
  selectTable: (tableId: string | null) => void;
  selectColumn: (tableId: string | null, columnName: string | null) => void;
  
  // History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Persistence
  save: () => Promise<void>;
  
  // Validation
  validateColumn: (tableId: string, columnName: string) => { valid: boolean; warnings?: string[] };
  
  // Clear state
  reset: () => void;
  
  // UI state
  toggleSidebar: () => void;
  toggleProperties: () => void;
  loadRecentProjects: () => Promise<void>;
  
  // Table colors
  setTableColor: (tableId: string, color: string) => void;
}

const createEmptyProject = (name: string, dialect: Dialect): ERProject => ({
  id: nanoid(),
  name,
  settings: {
    dialect,
    createdAt: new Date().toISOString(),
    repoUrl: 'https://github.com/tobiager/erdus',
    demoUrl: 'https://erdus.vercel.app'
  },
  schemas: [{
    name: 'public',
    tables: []
  }],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

const createEmptyTable = (name: string, position?: { x: number; y: number }): ERTable => ({
  id: nanoid(),
  name,
  columns: [{
    name: 'id',
    type: 'serial',
    isPrimaryKey: true,
    isOptional: false
  }],
  position: position || { x: 100, y: 100 }
});

// Safe localStorage access for SSR compatibility
const getStorageValue = (key: string, defaultValue: string) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem(key) || defaultValue;
  }
  return defaultValue;
};

const setStorageValue = (key: string, value: string) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(key, value);
  }
};

export const useDiagramStore = create<DiagramState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    project: null,
    selectedTable: null,
    selectedColumn: null,
    history: [],
    historyIndex: -1,
    isLoading: false,
    error: null,
    recentProjects: [],
    sidebarCollapsed: JSON.parse(getStorageValue('erdus-sidebar-collapsed', 'false')),
    propertiesCollapsed: JSON.parse(getStorageValue('erdus-properties-collapsed', 'false')),
    tableColors: JSON.parse(getStorageValue('erdus-table-colors', '{}')),

    // Project actions
    createProject: (name: string, dialect: Dialect, template = 'empty') => {
      const project = diagramsService.createProject(name, dialect, template);
      diagramsService.saveRecentProject(project);
      
      set({ project });
      return project.id;
    },

    loadProject: (project: ERProject) => {
      set({ project, selectedTable: null, selectedColumn: null, history: [], historyIndex: -1 });
    },

    loadProjectById: async (id: string) => {
      set({ isLoading: true });
      try {
        // For now, we don't have project persistence by ID in localStorage
        // This would require extending the service
        set({ error: 'Project loading by ID not yet implemented' });
      } catch (error) {
        set({ error: 'Failed to load project' });
      } finally {
        set({ isLoading: false });
      }
    },

    setDialect: (dialect: Dialect) => {
      const { project } = get();
      if (project) {
        const updatedProject = {
          ...project,
          settings: { ...project.settings, dialect },
          updatedAt: new Date().toISOString()
        };
        set({ project: updatedProject });
        diagramsService.saveRecentProject(updatedProject);
      }
    },

    // Table operations
    addTable: (name, position) => {
      const { project } = get();
      if (!project) return;

      const tableName = name || `table_${project.schemas[0].tables.length + 1}`;
      const newTable = createEmptyTable(tableName, position);
      
      const updatedProject = {
        ...project,
        schemas: [
          {
            ...project.schemas[0],
            tables: [...project.schemas[0].tables, newTable]
          }
        ],
        updatedAt: new Date().toISOString()
      };

      set({ project: updatedProject });
      diagramsService.saveRecentProject(updatedProject);
    },

    removeTable: (tableId: string) => {
      const { project } = get();
      if (!project) return;

      const updatedTables = project.schemas[0].tables.filter(table => table.id !== tableId);
      const updatedProject = {
        ...project,
        schemas: [{ ...project.schemas[0], tables: updatedTables }],
        updatedAt: new Date().toISOString()
      };

      set({ 
        project: updatedProject,
        selectedTable: get().selectedTable === tableId ? null : get().selectedTable
      });
      diagramsService.saveRecentProject(updatedProject);
    },

    renameTable: (tableId: string, newName: string) => {
      const { project } = get();
      if (!project) return;

      const updatedTables = project.schemas[0].tables.map(table => 
        table.id === tableId ? { ...table, name: newName } : table
      );

      const updatedProject = {
        ...project,
        schemas: [{ ...project.schemas[0], tables: updatedTables }],
        updatedAt: new Date().toISOString()
      };

      set({ project: updatedProject });
      diagramsService.saveRecentProject(updatedProject);
    },

    setTablePosition: (tableId: string, position: { x: number; y: number }) => {
      const { project } = get();
      if (!project) return;

      const updatedTables = project.schemas[0].tables.map(table =>
        table.id === tableId ? { ...table, position } : table
      );

      const updatedProject = {
        ...project,
        schemas: [{ ...project.schemas[0], tables: updatedTables }],
        updatedAt: new Date().toISOString()
      };

      set({ project: updatedProject });
      // Note: Don't auto-save position changes to avoid too frequent saves
    },

    setTableComment: (tableId: string, comment: string) => {
      const { project } = get();
      if (!project) return;

      const updatedTables = project.schemas[0].tables.map(table =>
        table.id === tableId ? { ...table, comment } : table
      );

      const updatedProject = {
        ...project,
        schemas: [{ ...project.schemas[0], tables: updatedTables }],
        updatedAt: new Date().toISOString()
      };

      set({ project: updatedProject });
      diagramsService.saveRecentProject(updatedProject);
    },

    // Column operations
    addColumn: (tableId: string, column = {}) => {
      const { project } = get();
      if (!project) return;

      const defaultColumn: ERColumn = {
        name: 'new_column',
        type: 'varchar(255)',
        isOptional: true,
        ...column
      };

      const updatedTables = project.schemas[0].tables.map(table =>
        table.id === tableId 
          ? { ...table, columns: [...table.columns, defaultColumn] }
          : table
      );

      const updatedProject = {
        ...project,
        schemas: [{ ...project.schemas[0], tables: updatedTables }],
        updatedAt: new Date().toISOString()
      };

      set({ project: updatedProject });
      diagramsService.saveRecentProject(updatedProject);
    },

    removeColumn: (tableId: string, columnName: string) => {
      const { project } = get();
      if (!project) return;

      const updatedTables = project.schemas[0].tables.map(table =>
        table.id === tableId
          ? { ...table, columns: table.columns.filter(col => col.name !== columnName) }
          : table
      );

      const updatedProject = {
        ...project,
        schemas: [{ ...project.schemas[0], tables: updatedTables }],
        updatedAt: new Date().toISOString()
      };

      set({ project: updatedProject });
      diagramsService.saveRecentProject(updatedProject);
    },

    updateColumn: (tableId: string, columnName: string, updates: Partial<ERColumn>) => {
      const { project } = get();
      if (!project) return;

      const updatedTables = project.schemas[0].tables.map(table =>
        table.id === tableId
          ? {
              ...table,
              columns: table.columns.map(col =>
                col.name === columnName ? { ...col, ...updates } : col
              )
            }
          : table
      );

      const updatedProject = {
        ...project,
        schemas: [{ ...project.schemas[0], tables: updatedTables }],
        updatedAt: new Date().toISOString()
      };

      set({ project: updatedProject });
      diagramsService.saveRecentProject(updatedProject);
    },

    // FK operations
    createForeignKey: (sourceTableId: string, targetTableId: string, columnName?: string) => {
      const { project } = get();
      if (!project) return;

      const targetTable = project.schemas[0].tables.find(t => t.id === targetTableId);
      if (!targetTable) return;

      const targetPK = targetTable.columns.find(c => c.isPrimaryKey);
      if (!targetPK) return;

      const fkColumnName = columnName || `${targetTable.name}_id`;
      const fkColumn: ERColumn = {
        name: fkColumnName,
        type: targetPK.type,
        isOptional: false,
        references: {
          table: targetTable.name,
          column: targetPK.name,
          onDelete: 'cascade',
          onUpdate: 'cascade'
        }
      };

      get().addColumn(sourceTableId, fkColumn);
    },

    removeForeignKey: (tableId: string, columnName: string) => {
      const { project } = get();
      if (!project) return;

      const updatedTables = project.schemas[0].tables.map(table =>
        table.id === tableId
          ? {
              ...table,
              columns: table.columns.map(col =>
                col.name === columnName ? { ...col, references: undefined } : col
              )
            }
          : table
      );

      const updatedProject = {
        ...project,
        schemas: [{ ...project.schemas[0], tables: updatedTables }],
        updatedAt: new Date().toISOString()
      };

      set({ project: updatedProject });
      diagramsService.saveRecentProject(updatedProject);
    },

    // Selection
    selectTable: (tableId: string | null) => {
      set({ selectedTable: tableId, selectedColumn: null });
    },

    selectColumn: (tableId: string | null, columnName: string | null) => {
      set({ selectedTable: tableId, selectedColumn: columnName });
    },

    // History (simplified for now)
    undo: () => {
      // TODO: Implement proper undo functionality
      console.log('Undo functionality to be implemented');
    },

    redo: () => {
      // TODO: Implement proper redo functionality
      console.log('Redo functionality to be implemented');
    },

    canUndo: () => false,
    canRedo: () => false,

    // Validation
    validateColumn: (tableId: string, columnName: string) => {
      // Simplified validation for now
      return { valid: true };
    },

    // Persistence
    save: async () => {
      const { project } = get();
      if (project) {
        diagramsService.saveRecentProject(project);
      }
    },

    // Clear state
    reset: () => {
      set({
        project: null,
        selectedTable: null,
        selectedColumn: null,
        history: [],
        historyIndex: -1,
        error: null
      });
    },

    // UI state
    toggleSidebar: () => {
      const collapsed = !get().sidebarCollapsed;
      set({ sidebarCollapsed: collapsed });
      setStorageValue('erdus-sidebar-collapsed', JSON.stringify(collapsed));
    },

    toggleProperties: () => {
      const collapsed = !get().propertiesCollapsed;
      set({ propertiesCollapsed: collapsed });
      setStorageValue('erdus-properties-collapsed', JSON.stringify(collapsed));
    },

    loadRecentProjects: async () => {
      set({ isLoading: true });
      try {
        const projectsMetadata = diagramsService.getRecentProjects();
        // Convert metadata to ERProject format for compatibility
        const projects: ERProject[] = projectsMetadata.map(meta => ({
          id: meta.id,
          name: meta.name,
          description: meta.description || '',
          createdAt: meta.lastModified,
          updatedAt: meta.lastModified,
          version: '1.0.0',
          settings: {
            dialect: meta.dialect as Dialect,
            createdAt: meta.lastModified,
          },
          schemas: [{
            id: nanoid(),
            name: 'public',
            tables: [],
            views: [],
            enums: []
          }],
        }));
        set({ recentProjects: projects });
      } catch (error) {
        set({ error: 'Failed to load recent projects' });
      } finally {
        set({ isLoading: false });
      }
    },

    // Table colors
    setTableColor: (tableId: string, color: string) => {
      const colors = { ...get().tableColors, [tableId]: color };
      set({ tableColors: colors });
      setStorageValue('erdus-table-colors', JSON.stringify(colors));
    }
  }))
);