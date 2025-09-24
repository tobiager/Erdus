import React from 'react';
import { ArrowLeft, Plus, Save, Database, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDiagramStore } from '../store/diagramsStore';

export default function SidebarLeft() {
  const navigate = useNavigate();
  const { 
    project, 
    addTable, 
    save,
    selectTable,
    selectedTable 
  } = useDiagramStore();

  if (!project) return null;

  const handleBackToHub = () => {
    navigate('/diagrams');
  };

  const handleAddTable = () => {
    addTable();
  };

  const handleSave = () => {
    save();
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-4 border-b border-neutral-200 dark:border-neutral-700 mb-4">
        <button
          onClick={handleBackToHub}
          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
          title="Volver al hub"
        >
          <ArrowLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
        </button>
        <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 truncate flex-1">
          {project.name}
        </h2>
      </div>

      {/* Actions */}
      <div className="space-y-2 mb-4">
        <button
          onClick={handleAddTable}
          className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Tabla
        </button>
        
        <button
          onClick={handleSave}
          className="w-full flex items-center gap-2 px-3 py-2 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-md text-sm font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          Guardar
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar tablas..."
            className="w-full pl-10 pr-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tables List */}
      <div className="flex-1 overflow-auto">
        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Tablas ({project.schemas[0]?.tables.length || 0})
        </h3>
        
        <div className="space-y-1">
          {project.schemas[0]?.tables.map((table) => (
            <button
              key={table.id}
              onClick={() => selectTable(table.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                selectedTable === table.id
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              <Database className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{table.name}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-auto">
                {table.columns.length}
              </span>
            </button>
          ))}
        </div>

        {project.schemas[0]?.tables.length === 0 && (
          <div className="text-center py-8">
            <Database className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
              No hay tablas en este esquema
            </p>
            <button
              onClick={handleAddTable}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Crear la primera tabla
            </button>
          </div>
        )}
      </div>

      {/* Project Info */}
      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <div className="text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
          <div className="flex justify-between">
            <span>Dialecto:</span>
            <span className="capitalize">{project.settings.dialect}</span>
          </div>
          <div className="flex justify-between">
            <span>Tablas:</span>
            <span>{project.schemas[0]?.tables.length || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Actualizado:</span>
            <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}