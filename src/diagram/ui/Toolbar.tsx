import React, { useState } from 'react';
import { Download, Settings, Undo, Redo, MoreHorizontal, Palette, Save, Sun, Moon, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDiagramStore } from '../store';
import { exportProject, downloadFile, ExportFormat } from '../services/exporters';

interface ToolbarProps {
  className?: string;
}

export default function Toolbar({ className = '' }: ToolbarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const { i18n } = useTranslation();

  const { 
    project,
    selectedTable,
    tableColors,
    setDialect,
    setTableColor,
    undo,
    redo,
    canUndo,
    canRedo,
    save
  } = useDiagramStore();

  const tableColors_preset = [
    '#64748b', '#ef4444', '#f97316', '#eab308', 
    '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', 
    '#ec4899', '#f43f5e'
  ];

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'es' : 'en';
    i18n.changeLanguage(newLang);
  };

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
    setShowMoreMenu(false);
  };

  const handleColorChange = (color: string) => {
    if (selectedTable) {
      setTableColor(selectedTable, color);
      setShowColorPicker(false);
    }
  };

  const handleSave = async () => {
    try {
      await save();
      setShowMoreMenu(false);
    } catch (error) {
      console.error('Save error:', error);
      alert('Error al guardar: ' + (error as Error).message);
    }
  };

  if (!project) {
    return null;
  }

  return (
    <div className={`px-3 py-2 rounded-lg bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm border border-neutral-200 dark:border-white/10 flex items-center gap-2 ${className}`}>
      {/* Project name */}
      <h1 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mr-2">
        {project.name}
      </h1>
      
      {/* Dialect badge */}
      <span className="px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded uppercase font-mono">
        {project.settings.dialect}
      </span>

      {/* Quick actions */}
      <div className="flex items-center gap-1 ml-2">
        <button
          onClick={undo}
          disabled={!canUndo()}
          className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Deshacer (Ctrl/Cmd+Z)"
        >
          <Undo className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
        </button>
        
        <button
          onClick={redo}
          disabled={!canRedo()}
          className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Rehacer (Ctrl/Cmd+Shift+Z)"
        >
          <Redo className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
        </button>

        {/* Color picker for selected table */}
        {selectedTable && (
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
              title="Color de tabla"
            >
              <Palette className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
            </button>

            {showColorPicker && (
              <div className="absolute top-full mt-1 left-0 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/20 rounded-md shadow-lg z-50 p-2">
                <div className="grid grid-cols-5 gap-1">
                  {tableColors_preset.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className="w-6 h-6 rounded border border-neutral-300 dark:border-neutral-600 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {showColorPicker && (
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowColorPicker(false)}
              />
            )}
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-neutral-200 dark:bg-white/20 mx-2" />

      {/* Export button */}
      <div className="relative">
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="flex items-center gap-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors"
        >
          <Download className="w-3 h-3" />
          Exportar
        </button>
        
        {showExportMenu && (
          <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/20 rounded-md shadow-lg z-50">
            <div className="py-1">
              <button
                onClick={() => handleExport('postgres')}
                className="block w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10"
              >
                PostgreSQL
              </button>
              <button
                onClick={() => handleExport('mysql')}
                className="block w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10"
              >
                MySQL
              </button>
              <button
                onClick={() => handleExport('prisma')}
                className="block w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10"
              >
                Prisma
              </button>
              <div className="border-t border-neutral-200 dark:border-white/20 my-1"></div>
              <button
                onClick={() => handleExport('json')}
                className="block w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10"
              >
                Erdus JSON
              </button>
            </div>
          </div>
        )}
        
        {showExportMenu && (
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowExportMenu(false)}
          />
        )}
      </div>

      {/* More menu */}
      <div className="relative">
        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
          title="Más opciones"
        >
          <MoreHorizontal className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
        </button>
        
        {showMoreMenu && (
          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/20 rounded-md shadow-lg z-50">
            <div className="py-1">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10"
              >
                <Save className="w-3 h-3" />
                Guardar proyecto
              </button>
              
              <div className="border-t border-neutral-200 dark:border-white/20 my-1"></div>
              <div className="px-3 py-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Cambiar dialecto
              </div>
              
              <button
                onClick={() => handleDialectChange('default')}
                className="block w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10"
              >
                Default (Erdus)
              </button>
              <button
                onClick={() => handleDialectChange('postgres')}
                className="block w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10"
              >
                PostgreSQL
              </button>
              <button
                onClick={() => handleDialectChange('mysql')}
                className="block w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10"
              >
                MySQL/MariaDB
              </button>
              <button
                onClick={() => handleDialectChange('mssql')}
                className="block w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10"
              >
                SQL Server
              </button>
              <button
                onClick={() => handleDialectChange('sqlite')}
                className="block w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10"
              >
                SQLite
              </button>
              
              <div className="border-t border-neutral-200 dark:border-white/20 my-1"></div>
              
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10"
              >
                <Sun className="w-3 h-3 dark:hidden" />
                <Moon className="w-3 h-3 hidden dark:block" />
                <span className="dark:hidden">Modo oscuro</span>
                <span className="hidden dark:block">Modo claro</span>
              </button>
              
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10"
              >
                <Globe className="w-3 h-3" />
                {i18n.language === 'en' ? 'Español' : 'English'}
              </button>
            </div>
          </div>
        )}
        
        {showMoreMenu && (
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowMoreMenu(false)}
          />
        )}
      </div>
    </div>
  );
}