import React, { useState } from 'react';
import { Download, Settings, Undo, Redo, Command } from 'lucide-react';
import { useDiagramStore } from '../store';
import { exportProject, downloadFile, ExportFormat } from '../services/exporters';

interface ToolbarProps {
  className?: string;
}

export default function Toolbar({ className = '' }: ToolbarProps) {
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

  const handleExport = (format: ExportFormat) => {
    if (!project) return;
    
    try {
      const result = exportProject(project, format);
      downloadFile(result);
      setShowExportMenu(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('Error al exportar: ' + (error as Error).message);
    }
  };

  const handleDialectChange = (dialect: 'default' | 'postgres' | 'mysql' | 'mssql' | 'sqlite') => {
    setDialect(dialect);
    setShowSettings(false);
  };

  if (!project) {
    return (
      <div className={`px-4 py-2 rounded-lg bg-neutral-800/80 backdrop-blur-sm border border-white/10 ${className}`}>
        <span className="text-neutral-400">No hay proyecto activo</span>
      </div>
    );
  }

  return (
    <div className={`px-4 py-2 rounded-lg bg-neutral-800/80 backdrop-blur-sm border border-white/10 flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-4">
        {/* Project info */}
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-white">
            {project.name}
          </h1>
          <span className="px-2 py-1 text-xs bg-neutral-700 text-neutral-300 rounded">
            {project.settings.dialect}
          </span>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className="p-2 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Deshacer (Ctrl/Cmd+Z)"
          >
            <Undo className="w-4 h-4 text-neutral-300" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            className="p-2 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Rehacer (Ctrl/Cmd+Shift+Z)"
          >
            <Redo className="w-4 h-4 text-neutral-300" />
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
            <div className="absolute right-0 mt-1 w-48 bg-neutral-800 border border-white/20 rounded-md shadow-lg z-50">
              <div className="py-1">
                <div className="px-3 py-1 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Base de datos
                </div>
                <button
                  onClick={() => handleExport('postgres')}
                  className="block w-full text-left px-3 py-2 text-sm text-neutral-200 hover:bg-white/10"
                >
                  PostgreSQL DDL
                </button>
                <button
                  onClick={() => handleExport('mysql')}
                  className="block w-full text-left px-3 py-2 text-sm text-neutral-200 hover:bg-white/10"
                >
                  MySQL DDL
                </button>
                <button
                  onClick={() => handleExport('mssql')}
                  className="block w-full text-left px-3 py-2 text-sm text-neutral-200 hover:bg-white/10"
                >
                  SQL Server DDL
                </button>
                <button
                  onClick={() => handleExport('sqlite')}
                  className="block w-full text-left px-3 py-2 text-sm text-neutral-200 hover:bg-white/10"
                >
                  SQLite DDL
                </button>
                <button
                  onClick={() => handleExport('prisma')}
                  className="block w-full text-left px-3 py-2 text-sm text-neutral-200 hover:bg-white/10"
                >
                  Prisma Schema
                </button>
                <button
                  onClick={() => handleExport('typeorm')}
                  className="block w-full text-left px-3 py-2 text-sm text-neutral-200 hover:bg-white/10"
                >
                  TypeORM Entities
                </button>
                
                <div className="border-t border-white/20 my-1"></div>
                <div className="px-3 py-1 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Diagramas
                </div>
                <button
                  onClick={() => handleExport('dbml')}
                  className="block w-full text-left px-3 py-2 text-sm text-neutral-200 hover:bg-white/10"
                >
                  DBML
                </button>
                <button
                  onClick={() => handleExport('mermaid')}
                  className="block w-full text-left px-3 py-2 text-sm text-neutral-200 hover:bg-white/10"
                >
                  Mermaid
                </button>
                
                <div className="border-t border-white/20 my-1"></div>
                <div className="px-3 py-1 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Imágenes
                </div>
                <button
                  onClick={() => alert('PNG export coming soon!')}
                  className="block w-full text-left px-3 py-2 text-sm text-neutral-200 hover:bg-white/10"
                >
                  PNG
                </button>
                <button
                  onClick={() => alert('SVG export coming soon!')}
                  className="block w-full text-left px-3 py-2 text-sm text-neutral-200 hover:bg-white/10"
                >
                  SVG
                </button>
                <button
                  onClick={() => alert('PDF export coming soon!')}
                  className="block w-full text-left px-3 py-2 text-sm text-neutral-200 hover:bg-white/10"
                >
                  PDF
                </button>
                
                <div className="border-t border-white/20 my-1"></div>
                <button
                  onClick={() => handleExport('json')}
                  className="block w-full text-left px-3 py-2 text-sm text-neutral-200 hover:bg-white/10"
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
            className="p-2 rounded-md hover:bg-white/10 transition-colors"
            title="Configuración"
          >
            <Settings className="w-4 h-4 text-neutral-300" />
          </button>
          
          {showSettings && (
            <div className="absolute right-0 mt-1 w-64 bg-neutral-800 border border-white/20 rounded-md shadow-lg z-50">
              <div className="p-4">
                <h3 className="text-sm font-medium text-white mb-3">
                  Configuración del proyecto
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Dialecto de base de datos
                    </label>
                    <select
                      value={project.settings.dialect}
                      onChange={(e) => handleDialectChange(e.target.value as any)}
                      className="w-full px-2 py-1 text-sm border border-white/20 rounded focus:ring-blue-500 focus:border-blue-500 bg-neutral-700 text-neutral-100"
                    >
                      <option value="default">Default (Erdus)</option>
                      <option value="postgres">PostgreSQL</option>
                      <option value="mysql">MySQL/MariaDB</option>
                      <option value="mssql">SQL Server</option>
                      <option value="sqlite">SQLite</option>
                    </select>
                  </div>
                  
                  <div className="pt-2 border-t border-white/20">
                    <div className="text-xs text-neutral-400">
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