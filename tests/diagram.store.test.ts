import { describe, it, expect, beforeEach } from 'vitest';
import { useDiagramStore } from '../src/diagram/store';

describe('Diagram Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useDiagramStore.getState().reset();
  });

  it('should create a project with correct settings', () => {
    const store = useDiagramStore.getState();
    
    store.createProject('Test Project', 'postgres', 'empty');
    
    const project = store.project;
    expect(project).not.toBeNull();
    expect(project?.name).toBe('Test Project');
    expect(project?.settings.dialect).toBe('postgres');
    expect(project?.schemas).toHaveLength(1);
    expect(project?.schemas[0].tables).toHaveLength(0); // empty template
  });

  it('should create project with CRUD template', () => {
    const store = useDiagramStore.getState();
    
    store.createProject('CRUD Project', 'postgres', 'crud');
    
    const project = store.project;
    expect(project?.schemas[0].tables).toHaveLength(2); // users and posts
    
    const usersTable = project?.schemas[0].tables.find(t => t.name === 'users');
    const postsTable = project?.schemas[0].tables.find(t => t.name === 'posts');
    
    expect(usersTable).toBeDefined();
    expect(postsTable).toBeDefined();
    expect(usersTable?.columns).toHaveLength(5);
    expect(postsTable?.columns).toHaveLength(6);
    
    // Check FK relationship
    const userIdColumn = postsTable?.columns.find(c => c.name === 'user_id');
    expect(userIdColumn?.references).toBeDefined();
    expect(userIdColumn?.references?.table).toBe('users');
    expect(userIdColumn?.references?.column).toBe('id');
  });

  it('should add a new table', () => {
    const store = useDiagramStore.getState();
    
    store.createProject('Test', 'postgres', 'empty');
    store.addTable('customers');
    
    const project = store.project;
    expect(project?.schemas[0].tables).toHaveLength(1);
    expect(project?.schemas[0].tables[0].name).toBe('customers');
    expect(project?.schemas[0].tables[0].columns).toHaveLength(1); // default id column
    expect(project?.schemas[0].tables[0].columns[0].name).toBe('id');
    expect(project?.schemas[0].tables[0].columns[0].isPrimaryKey).toBe(true);
  });

  it('should rename a table', () => {
    const store = useDiagramStore.getState();
    
    store.createProject('Test', 'postgres', 'empty');
    store.addTable('old_name');
    
    const tableId = store.project?.schemas[0].tables[0].id!;
    store.renameTable(tableId, 'new_name');
    
    expect(store.project?.schemas[0].tables[0].name).toBe('new_name');
  });

  it('should add and update columns', () => {
    const store = useDiagramStore.getState();
    
    store.createProject('Test', 'postgres', 'empty');
    store.addTable('products');
    
    const tableId = store.project?.schemas[0].tables[0].id!;
    
    // Add column
    store.addColumn(tableId, { name: 'price', type: 'decimal', isOptional: false });
    
    expect(store.project?.schemas[0].tables[0].columns).toHaveLength(2);
    
    const priceColumn = store.project?.schemas[0].tables[0].columns.find(c => c.name === 'price');
    expect(priceColumn).toBeDefined();
    expect(priceColumn?.type).toBe('decimal');
    expect(priceColumn?.isOptional).toBe(false);
    
    // Update column
    store.updateColumn(tableId, 'price', { type: 'numeric', default: '0' });
    
    const updatedColumn = store.project?.schemas[0].tables[0].columns.find(c => c.name === 'price');
    expect(updatedColumn?.type).toBe('numeric');
    expect(updatedColumn?.default).toBe('0');
  });

  it('should create foreign key relationships', () => {
    const store = useDiagramStore.getState();
    
    store.createProject('Test', 'postgres', 'empty');
    store.addTable('users');
    store.addTable('posts');
    
    const tables = store.project?.schemas[0].tables!;
    const usersTable = tables.find(t => t.name === 'users')!;
    const postsTable = tables.find(t => t.name === 'posts')!;
    
    // Create FK relationship
    store.createForeignKey(postsTable.id, usersTable.id);
    
    const updatedPostsTable = store.project?.schemas[0].tables.find(t => t.id === postsTable.id);
    const fkColumn = updatedPostsTable?.columns.find(c => c.name === 'users_id');
    
    expect(fkColumn).toBeDefined();
    expect(fkColumn?.references?.table).toBe('users');
    expect(fkColumn?.references?.column).toBe('id');
    expect(fkColumn?.isOptional).toBe(false);
  });

  it('should change dialect and maintain data', () => {
    const store = useDiagramStore.getState();
    
    store.createProject('Test', 'postgres', 'crud');
    const originalTables = store.project?.schemas[0].tables.length;
    
    store.setDialect('mysql');
    
    expect(store.project?.settings.dialect).toBe('mysql');
    expect(store.project?.schemas[0].tables.length).toBe(originalTables);
  });

  it('should support undo/redo operations', () => {
    const store = useDiagramStore.getState();
    
    store.createProject('Test', 'postgres', 'empty');
    const initialState = store.project?.schemas[0].tables.length;
    
    // Add table
    store.addTable('test_table');
    expect(store.project?.schemas[0].tables.length).toBe(initialState! + 1);
    expect(store.canUndo()).toBe(true);
    expect(store.canRedo()).toBe(false);
    
    // Undo
    store.undo();
    expect(store.project?.schemas[0].tables.length).toBe(initialState);
    expect(store.canUndo()).toBe(true); // can undo project creation
    expect(store.canRedo()).toBe(true);
    
    // Redo
    store.redo();
    expect(store.project?.schemas[0].tables.length).toBe(initialState! + 1);
    expect(store.canRedo()).toBe(false);
  });
});