import React, { useState } from 'react';
import { Download, Settings, Undo, Redo, Command } from 'lucide-react';
import { useDiagramStore } from '../store';

export default function Toolbar() {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { 
    project,
    setDialect,
    undo,
    redo,
    canUndo,
    canRedo
  } = useDiagramStore();

  const handleExport = (format: string) => {
    // TODO: Implement export functionality
    console.log('Export to:', format);
    setShowExportMenu(false);
  };

  const handleDialectChange = (dialect: 'default' | 'postgres' | 'mysql' | 'mssql' | 'sqlite') => {
    setDialect(dialect);
    setShowSettings(false);
  };

  if (!project) {
    return (
      <div className="h-full px-4 flex items-center text-slate-500 dark:text-slate-400">
        No hay proyecto activo
      </div>
    );
  }

  return (
    <div className="h-full px-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Project info */}
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {project.name}
          </h1>
          <span className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
            {project.settings.dialect}
          </span>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Deshacer (Ctrl/Cmd+Z)"
          >
            <Undo className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Rehacer (Ctrl/Cmd+Shift+Z)"
          >
            <Redo className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Export menu */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          
          {showExportMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-50">
              <div className="py-1">
                <div className="px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Base de datos
                </div>
                <button
                  onClick={() => handleExport('sql')}
                  className="block w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  SQL DDL
                </button>
                <button
                  onClick={() => handleExport('prisma')}
                  className="block w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Prisma Schema
                </button>
                <button
                  onClick={() => handleExport('typeorm')}
                  className="block w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  TypeORM Entities
                </button>
                
                <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
                <div className="px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Diagramas
                </div>
                <button
                  onClick={() => handleExport('dbml')}
                  className="block w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  DBML
                </button>
                <button
                  onClick={() => handleExport('mermaid')}
                  className="block w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Mermaid
                </button>
                
                <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
                <div className="px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Imágenes
                </div>
                <button
                  onClick={() => handleExport('png')}
                  className="block w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  PNG
                </button>
                <button
                  onClick={() => handleExport('svg')}
                  className="block w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  SVG
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="block w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  PDF
                </button>
                
                <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
                <button
                  onClick={() => handleExport('json')}
                  className="block w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Erdus JSON
                </button>
              </div>
            </div>
          )}
          
          {/* Backdrop */}
          {showExportMenu && (
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setShowExportMenu(false)}
            />
          )}
        </div>

        {/* Settings menu */}
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Configuración"
          >
            <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
          
          {showSettings && (
            <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-50">
              <div className="p-4">
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                  Configuración del proyecto
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Dialecto de base de datos
                    </label>
                    <select
                      value={project.settings.dialect}
                      onChange={(e) => handleDialectChange(e.target.value as any)}
                      className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    >
                      <option value="default">Default (Erdus)</option>
                      <option value="postgres">PostgreSQL</option>
                      <option value="mysql">MySQL/MariaDB</option>
                      <option value="mssql">SQL Server</option>
                      <option value="sqlite">SQLite</option>
                    </select>
                  </div>
                  
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      <div>Creado: {new Date(project.createdAt).toLocaleDateString()}</div>
                      <div>Modificado: {new Date(project.updatedAt).toLocaleDateString()}</div>
                      <div>Tablas: {project.schemas[0]?.tables.length || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Backdrop */}
          {showSettings && (
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setShowSettings(false)}
            />
          )}
        </div>

        {/* Command palette hint */}
        <div className="hidden md:flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <Command className="w-3 h-3" />
          <span>Ctrl+K</span>
        </div>
      </div>
    </div>
  );
}