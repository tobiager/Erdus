import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { ERProject, ERTable, ERColumn, Dialect, ERSchema } from '../types';
import { autoSave } from './services/autosave';
import { validateTypeForDialect } from './services/typeCatalog';

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
  
  // Actions
  createProject: (name: string, dialect: Dialect, template?: string) => void;
  loadProject: (project: ERProject) => void;
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
  position: position || { x: 100, y: 100 },
  primaryKey: ['id']
});

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

    // Helper function to save current state to history
    saveToHistory: () => {
      const { project, selectedTable, selectedColumn, history, historyIndex } = get();
      
      const newHistoryState: HistoryState = {
        project: project ? JSON.parse(JSON.stringify(project)) : null,
        selectedTable,
        selectedColumn
      };
      
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newHistoryState);
      
      // Keep only last 50 states
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      
      set({
        history: newHistory,
        historyIndex: newHistory.length - 1
      });
    },

    createProject: (name: string, dialect: Dialect, template?: string) => {
      const project = createEmptyProject(name, dialect);
      
      // Add template tables if specified
      if (template === 'crud') {
        const usersTable = createEmptyTable('users', { x: 100, y: 100 });
        usersTable.columns = [
          { name: 'id', type: 'serial', isPrimaryKey: true, isOptional: false },
          { name: 'email', type: 'varchar', isOptional: false, isUnique: true },
          { name: 'password_hash', type: 'varchar', isOptional: false },
          { name: 'created_at', type: 'timestamp', isOptional: false, default: 'now()' },
          { name: 'updated_at', type: 'timestamp', isOptional: false, default: 'now()' }
        ];
        
        const postsTable = createEmptyTable('posts', { x: 400, y: 100 });
        postsTable.columns = [
          { name: 'id', type: 'serial', isPrimaryKey: true, isOptional: false },
          { name: 'user_id', type: 'integer', isOptional: false, references: { table: 'users', column: 'id', onDelete: 'cascade' } },
          { name: 'title', type: 'varchar', isOptional: false },
          { name: 'content', type: 'text', isOptional: true },
          { name: 'created_at', type: 'timestamp', isOptional: false, default: 'now()' },
          { name: 'updated_at', type: 'timestamp', isOptional: false, default: 'now()' }
        ];
        
        project.schemas[0].tables = [usersTable, postsTable];
      } else if (template === 'ventas') {
        // Sales template
        const customersTable = createEmptyTable('customers', { x: 100, y: 100 });
        const ordersTable = createEmptyTable('orders', { x: 400, y: 100 });
        const productsTable = createEmptyTable('products', { x: 100, y: 300 });
        const orderItemsTable = createEmptyTable('order_items', { x: 400, y: 300 });
        
        project.schemas[0].tables = [customersTable, ordersTable, productsTable, orderItemsTable];
      }
      
      set({ project });
      get().saveToHistory();
      autoSave.scheduleAutoSave(project);
    },

    loadProject: (project: ERProject) => {
      set({ project, selectedTable: null, selectedColumn: null });
      get().saveToHistory();
    },

    setDialect: (dialect: Dialect) => {
      const { project } = get();
      if (!project) return;
      
      const updatedProject = {
        ...project,
        settings: { ...project.settings, dialect },
        updatedAt: new Date().toISOString()
      };
      
      set({ project: updatedProject });
      get().saveToHistory();
      autoSave.scheduleAutoSave(updatedProject);
    },

    addTable: (name?: string, position?: { x: number; y: number }) => {
      const { project } = get();
      if (!project || project.schemas.length === 0) return;
      
      const tableName = name || `table_${project.schemas[0].tables.length + 1}`;
      const newTable = createEmptyTable(tableName, position);
      
      const updatedProject = {
        ...project,
        schemas: project.schemas.map(schema => ({
          ...schema,
          tables: [...schema.tables, newTable]
        })),
        updatedAt: new Date().toISOString()
      };
      
      set({ project: updatedProject, selectedTable: newTable.id });
      get().saveToHistory();
      autoSave.scheduleAutoSave(updatedProject);
    },

    removeTable: (tableId: string) => {
      const { project } = get();
      if (!project) return;
      
      const updatedProject = {
        ...project,
        schemas: project.schemas.map(schema => ({
          ...schema,
          tables: schema.tables.filter(table => table.id !== tableId)
        })),
        updatedAt: new Date().toISOString()
      };
      
      set({ 
        project: updatedProject, 
        selectedTable: null,
        selectedColumn: null
      });
      get().saveToHistory();
      autoSave.scheduleAutoSave(updatedProject);
    },

    renameTable: (tableId: string, newName: string) => {
      const { project } = get();
      if (!project) return;
      
      const updatedProject = {
        ...project,
        schemas: project.schemas.map(schema => ({
          ...schema,
          tables: schema.tables.map(table => 
            table.id === tableId ? { ...table, name: newName } : table
          )
        })),
        updatedAt: new Date().toISOString()
      };
      
      set({ project: updatedProject });
      get().saveToHistory();
      autoSave.scheduleAutoSave(updatedProject);
    },

    setTablePosition: (tableId: string, position: { x: number; y: number }) => {
      const { project } = get();
      if (!project) return;
      
      const updatedProject = {
        ...project,
        schemas: project.schemas.map(schema => ({
          ...schema,
          tables: schema.tables.map(table => 
            table.id === tableId ? { ...table, position } : table
          )
        })),
        updatedAt: new Date().toISOString()
      };
      
      set({ project: updatedProject });
      // Don't save to history for position changes (too frequent)
      autoSave.scheduleAutoSave(updatedProject);
    },

    setTableComment: (tableId: string, comment: string) => {
      const { project } = get();
      if (!project) return;
      
      const updatedProject = {
        ...project,
        schemas: project.schemas.map(schema => ({
          ...schema,
          tables: schema.tables.map(table => 
            table.id === tableId ? { ...table, comment } : table
          )
        })),
        updatedAt: new Date().toISOString()
      };
      
      set({ project: updatedProject });
      get().saveToHistory();
      autoSave.scheduleAutoSave(updatedProject);
    },

    addColumn: (tableId: string, column?: Partial<ERColumn>) => {
      const { project } = get();
      if (!project) return;
      
      const defaultColumn: ERColumn = {
        name: `column_${Date.now()}`,
        type: 'varchar',
        isOptional: true,
        ...column
      };
      
      const updatedProject = {
        ...project,
        schemas: project.schemas.map(schema => ({
          ...schema,
          tables: schema.tables.map(table => 
            table.id === tableId 
              ? { ...table, columns: [...table.columns, defaultColumn] }
              : table
          )
        })),
        updatedAt: new Date().toISOString()
      };
      
      set({ project: updatedProject, selectedColumn: defaultColumn.name });
      get().saveToHistory();
      autoSave.scheduleAutoSave(updatedProject);
    },

    removeColumn: (tableId: string, columnName: string) => {
      const { project } = get();
      if (!project) return;
      
      const updatedProject = {
        ...project,
        schemas: project.schemas.map(schema => ({
          ...schema,
          tables: schema.tables.map(table => 
            table.id === tableId 
              ? { ...table, columns: table.columns.filter(col => col.name !== columnName) }
              : table
          )
        })),
        updatedAt: new Date().toISOString()
      };
      
      set({ 
        project: updatedProject,
        selectedColumn: null
      });
      get().saveToHistory();
      autoSave.scheduleAutoSave(updatedProject);
    },

    updateColumn: (tableId: string, columnName: string, updates: Partial<ERColumn>) => {
      const { project } = get();
      if (!project) return;
      
      const updatedProject = {
        ...project,
        schemas: project.schemas.map(schema => ({
          ...schema,
          tables: schema.tables.map(table => 
            table.id === tableId 
              ? {
                  ...table,
                  columns: table.columns.map(col => 
                    col.name === columnName 
                      ? { ...col, ...updates }
                      : col
                  )
                }
              : table
          )
        })),
        updatedAt: new Date().toISOString()
      };
      
      set({ project: updatedProject });
      get().saveToHistory();
      autoSave.scheduleAutoSave(updatedProject);
    },

    createForeignKey: (sourceTableId: string, targetTableId: string, columnName?: string) => {
      const { project } = get();
      if (!project) return;
      
      // Find target table to get its primary key
      const targetTable = project.schemas[0]?.tables.find(t => t.id === targetTableId);
      if (!targetTable) return;
      
      const targetPK = targetTable.columns.find(c => c.isPrimaryKey);
      if (!targetPK) return;
      
      const fkColumnName = columnName || `${targetTable.name}_id`;
      
      const updatedProject = {
        ...project,
        schemas: project.schemas.map(schema => ({
          ...schema,
          tables: schema.tables.map(table => {
            if (table.id === sourceTableId) {
              // Check if column already exists
              const existingColumn = table.columns.find(c => c.name === fkColumnName);
              if (existingColumn) {
                // Update existing column to be FK
                return {
                  ...table,
                  columns: table.columns.map(col =>
                    col.name === fkColumnName
                      ? {
                          ...col,
                          references: {
                            table: targetTable.name,
                            column: targetPK.name,
                            onDelete: 'no action',
                            onUpdate: 'no action'
                          }
                        }
                      : col
                  )
                };
              } else {
                // Add new FK column
                const fkColumn: ERColumn = {
                  name: fkColumnName,
                  type: targetPK.type,
                  isOptional: false,
                  references: {
                    table: targetTable.name,
                    column: targetPK.name,
                    onDelete: 'no action',
                    onUpdate: 'no action'
                  }
                };
                return {
                  ...table,
                  columns: [...table.columns, fkColumn]
                };
              }
            }
            return table;
          })
        })),
        updatedAt: new Date().toISOString()
      };
      
      set({ project: updatedProject });
      get().saveToHistory();
      autoSave.scheduleAutoSave(updatedProject);
    },

    removeForeignKey: (tableId: string, columnName: string) => {
      const { project } = get();
      if (!project) return;
      
      const updatedProject = {
        ...project,
        schemas: project.schemas.map(schema => ({
          ...schema,
          tables: schema.tables.map(table => 
            table.id === tableId 
              ? {
                  ...table,
                  columns: table.columns.map(col => 
                    col.name === columnName 
                      ? { ...col, references: undefined }
                      : col
                  )
                }
              : table
          )
        })),
        updatedAt: new Date().toISOString()
      };
      
      set({ project: updatedProject });
      get().saveToHistory();
      autoSave.scheduleAutoSave(updatedProject);
    },

    selectTable: (tableId: string | null) => {
      set({ selectedTable: tableId, selectedColumn: null });
    },

    selectColumn: (tableId: string | null, columnName: string | null) => {
      set({ selectedTable: tableId, selectedColumn: columnName });
    },

    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        const state = history[newIndex];
        set({
          ...state,
          historyIndex: newIndex
        });
        
        if (state.project) {
          autoSave.scheduleAutoSave(state.project);
        }
      }
    },

    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        const state = history[newIndex];
        set({
          ...state,
          historyIndex: newIndex
        });
        
        if (state.project) {
          autoSave.scheduleAutoSave(state.project);
        }
      }
    },

    canUndo: () => {
      const { historyIndex } = get();
      return historyIndex > 0;
    },

    canRedo: () => {
      const { history, historyIndex } = get();
      return historyIndex < history.length - 1;
    },

    save: async () => {
      const { project } = get();
      if (project) {
        await autoSave.saveProject(project);
      }
    },

    validateColumn: (tableId: string, columnName: string) => {
      const { project } = get();
      if (!project) return { valid: false };
      
      const table = project.schemas[0]?.tables.find(t => t.id === tableId);
      const column = table?.columns.find(c => c.name === columnName);
      
      if (!table || !column) return { valid: false };
      
      return validateTypeForDialect(column.type, project.settings.dialect);
    },

    reset: () => {
      set({
        project: null,
        selectedTable: null,
        selectedColumn: null,
        history: [],
        historyIndex: -1,
        isLoading: false,
        error: null
      });
      autoSave.cancel();
    }
  }))
);

// Subscribe to changes for autosave
useDiagramStore.subscribe(
  (state) => state.project,
  (project) => {
    if (project) {
      autoSave.scheduleAutoSave(project);
    }
  }
);