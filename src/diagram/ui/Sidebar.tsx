import React, { useState } from 'react';
import { Plus, Search, Save, FolderOpen, Upload, Database } from 'lucide-react';
import { useDiagramStore } from '../store';
import { autoSave } from '../services/autosave';

export default function Sidebar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [selectedDialect, setSelectedDialect] = useState<'default' | 'postgres' | 'mysql' | 'mssql' | 'sqlite'>('default');
  const [selectedTemplate, setSelectedTemplate] = useState<'empty' | 'crud' | 'ventas'>('empty');

  const { 
    project, 
    createProject, 
    addTable,
    reset
  } = useDiagramStore();

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim()) {
      createProject(projectName.trim(), selectedDialect, selectedTemplate);
      setIsCreatingProject(false);
      setProjectName('');
    }
  };

  const handleNewTable = () => {
    if (project) {
      addTable();
    }
  };

  const handleSave = async () => {
    if (project) {
      await autoSave.saveProject(project);
    }
  };

  const handleNewProject = () => {
    if (project) {
      const confirm = window.confirm('¿Crear un nuevo proyecto? Los cambios no guardados se perderán.');
      if (!confirm) return;
    }
    reset();
    setIsCreatingProject(true);
  };

  const filteredTables = project?.schemas[0]?.tables.filter(table => 
    table.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isCreatingProject || !project) {
    return (
      <div className="h-full p-4">
        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
          Nuevo Diagrama
        </h2>
        
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nombre del proyecto
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Mi diagrama ER"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Dialecto de base de datos
            </label>
            <select
              value={selectedDialect}
              onChange={(e) => setSelectedDialect(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100"
            >
              <option value="default">Default (Erdus)</option>
              <option value="postgres">PostgreSQL</option>
              <option value="mysql">MySQL/MariaDB</option>
              <option value="mssql">SQL Server</option>
              <option value="sqlite">SQLite</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Plantilla
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100"
            >
              <option value="empty">Vacío</option>
              <option value="crud">CRUD básico</option>
              <option value="ventas">Sistema de ventas</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Crear
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingProject(false)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {project.name}
          </h2>
          <div className="flex gap-1">
            <button
              onClick={handleSave}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
              title="Guardar (Ctrl/Cmd+S)"
            >
              <Save className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
            <button
              onClick={handleNewProject}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
              title="Nuevo proyecto"
            >
              <FolderOpen className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <button
            onClick={handleNewTable}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva tabla (N)
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center gap-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-md text-sm transition-colors">
              <FolderOpen className="w-4 h-4" />
              Cargar
            </button>
            <button className="flex items-center justify-center gap-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-md text-sm transition-colors">
              <Upload className="w-4 h-4" />
              Importar
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar tablas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Tables list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Tablas ({filteredTables.length})
          </h3>
          
          <div className="space-y-1">
            {filteredTables.map((table) => (
              <div
                key={table.id}
                className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md cursor-pointer transition-colors"
                onClick={() => {
                  useDiagramStore.getState().selectTable(table.id);
                }}
              >
                <Database className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {table.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {table.columns.length} columnas
                  </div>
                </div>
              </div>
            ))}
            
            {filteredTables.length === 0 && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay tablas</p>
                {searchQuery && (
                  <p className="text-xs mt-1">Ninguna tabla coincide con "{searchQuery}"</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project info */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <div>Dialecto: {project.settings.dialect}</div>
          <div>Creado: {new Date(project.createdAt).toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  );
}