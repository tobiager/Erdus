import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { ERProject, ERTable, ERColumn, Dialect, ERSchema } from '../../types';
import { autoSave } from '../../diagram/services/autosave';
import { validateTypeForDialect } from '../../diagram/services/typeCatalog';

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
      const project = createEmptyProject(name, dialect);
      
      // Add template tables if requested
      if (template === 'crud') {
        const usersTable: ERTable = {
          id: nanoid(),
          name: 'users',
          columns: [
            { name: 'id', type: 'serial', isPrimaryKey: true, isOptional: false },
            { name: 'name', type: 'varchar(255)', isOptional: false },
            { name: 'email', type: 'varchar(255)', isOptional: false, isUnique: true },
            { name: 'created_at', type: 'timestamp', isOptional: false, default: 'now()' }
          ],
          position: { x: 100, y: 100 }
        };
        
        const postsTable: ERTable = {
          id: nanoid(),
          name: 'posts',
          columns: [
            { name: 'id', type: 'serial', isPrimaryKey: true, isOptional: false },
            { name: 'title', type: 'varchar(255)', isOptional: false },
            { name: 'content', type: 'text', isOptional: true },
            { name: 'user_id', type: 'int', isOptional: false, references: { table: 'users', column: 'id', onDelete: 'cascade' } },
            { name: 'created_at', type: 'timestamp', isOptional: false, default: 'now()' }
          ],
          position: { x: 400, y: 100 }
        };
        
        project.schemas[0].tables = [usersTable, postsTable];
      } else if (template === 'ventas') {
        // Add sales template tables
        const customersTable: ERTable = {
          id: nanoid(),
          name: 'customers',
          columns: [
            { name: 'id', type: 'serial', isPrimaryKey: true, isOptional: false },
            { name: 'name', type: 'varchar(255)', isOptional: false },
            { name: 'email', type: 'varchar(255)', isOptional: false, isUnique: true },
            { name: 'phone', type: 'varchar(50)', isOptional: true },
            { name: 'created_at', type: 'timestamp', isOptional: false, default: 'now()' }
          ],
          position: { x: 100, y: 100 }
        };
        
        const productsTable: ERTable = {
          id: nanoid(),
          name: 'products',
          columns: [
            { name: 'id', type: 'serial', isPrimaryKey: true, isOptional: false },
            { name: 'name', type: 'varchar(255)', isOptional: false },
            { name: 'price', type: 'decimal(10,2)', isOptional: false },
            { name: 'stock', type: 'int', isOptional: false, default: '0' },
            { name: 'created_at', type: 'timestamp', isOptional: false, default: 'now()' }
          ],
          position: { x: 400, y: 100 }
        };
        
        const ordersTable: ERTable = {
          id: nanoid(),
          name: 'orders',
          columns: [
            { name: 'id', type: 'serial', isPrimaryKey: true, isOptional: false },
            { name: 'customer_id', type: 'int', isOptional: false, references: { table: 'customers', column: 'id', onDelete: 'cascade' } },
            { name: 'total', type: 'decimal(10,2)', isOptional: false },
            { name: 'status', type: 'varchar(50)', isOptional: false, default: "'pending'" },
            { name: 'created_at', type: 'timestamp', isOptional: false, default: 'now()' }
          ],
          position: { x: 100, y: 300 }
        };
        
        project.schemas[0].tables = [customersTable, productsTable, ordersTable];
      }

      set({ project });
      autoSave.saveProject(project);
      return project.id;
    },

    loadProject: (project: ERProject) => {
      set({ project, selectedTable: null, selectedColumn: null, history: [], historyIndex: -1 });
    },

    loadProjectById: async (id: string) => {
      set({ isLoading: true });
      try {
        const project = await autoSave.loadProject(id);
        if (project) {
          set({ project, selectedTable: null, selectedColumn: null, history: [], historyIndex: -1 });
        }
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
        autoSave.saveProject(updatedProject);
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
      autoSave.saveProject(updatedProject);
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
      autoSave.saveProject(updatedProject);
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
      autoSave.saveProject(updatedProject);
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
      autoSave.saveProject(updatedProject);
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
      autoSave.saveProject(updatedProject);
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
      autoSave.saveProject(updatedProject);
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
      autoSave.saveProject(updatedProject);
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
      autoSave.saveProject(updatedProject);
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

    // Persistence
    save: async () => {
      const { project } = get();
      if (project) {
        await autoSave.saveProject(project);
      }
    },

    // Validation
    validateColumn: (tableId: string, columnName: string) => {
      const { project } = get();
      if (!project) return { valid: true };

      const table = project.schemas[0].tables.find(t => t.id === tableId);
      if (!table) return { valid: true };

      const column = table.columns.find(c => c.name === columnName);
      if (!column) return { valid: true };

      return validateTypeForDialect(column.type, project.settings.dialect);
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
        const projects = await autoSave.loadRecentProjects();
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