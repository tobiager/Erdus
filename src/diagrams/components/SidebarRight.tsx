import React, { useState } from 'react';
import { Plus, Trash2, Key, Shield, Eye, Hash } from 'lucide-react';
import { useDiagramStore } from '../store/diagramsStore';
import { ERColumn } from '../../types';

export default function SidebarRight() {
  const { 
    project,
    selectedTable,
    selectedColumn,
    addColumn,
    removeColumn,
    updateColumn,
    renameTable,
    setTableComment
  } = useDiagramStore();

  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('varchar(255)');

  if (!project || !selectedTable) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center text-neutral-500 dark:text-neutral-400">
          <Shield className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Selecciona una tabla para ver sus propiedades</p>
        </div>
      </div>
    );
  }

  const table = project.schemas[0]?.tables.find(t => t.id === selectedTable);
  if (!table) return null;

  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      const column: Partial<ERColumn> = {
        name: newColumnName.trim(),
        type: newColumnType,
        isOptional: true
      };
      addColumn(selectedTable, column);
      setNewColumnName('');
      setNewColumnType('varchar(255)');
    }
  };

  const handleUpdateColumn = (columnName: string, updates: Partial<ERColumn>) => {
    updateColumn(selectedTable, columnName, updates);
  };

  const handleRemoveColumn = (columnName: string) => {
    if (confirm(`¿Estás seguro de que quieres eliminar la columna "${columnName}"?`)) {
      removeColumn(selectedTable, columnName);
    }
  };

  const handleTableNameChange = (e: React.FocusEvent<HTMLInputElement>) => {
    const newName = e.target.value.trim();
    if (newName && newName !== table.name) {
      renameTable(selectedTable, newName);
    }
  };

  const handleTableCommentChange = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const comment = e.target.value.trim();
    setTableComment(selectedTable, comment);
  };

  const getColumnIcon = (column: ERColumn) => {
    if (column.isPrimaryKey) return <Key className="w-3 h-3 text-yellow-600" />;
    if (column.references) return <Hash className="w-3 h-3 text-blue-600" />;
    if (column.isUnique) return <Shield className="w-3 h-3 text-purple-600" />;
    if (!column.isOptional) return <Eye className="w-3 h-3 text-green-600" />;
    return null;
  };

  return (
    <div className="h-full flex flex-col p-4 overflow-auto">
      {/* Table Properties */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
          Propiedades de la Tabla
        </h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Nombre
            </label>
            <input
              type="text"
              defaultValue={table.name}
              onBlur={handleTableNameChange}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Comentario
            </label>
            <textarea
              defaultValue={table.comment || ''}
              onBlur={handleTableCommentChange}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Descripción de la tabla..."
            />
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Columnas ({table.columns.length})
          </h3>
        </div>

        {/* Add Column Form */}
        <div className="mb-4 p-3 border border-neutral-200 dark:border-neutral-700 rounded-md bg-neutral-50 dark:bg-neutral-800/50">
          <div className="space-y-2">
            <input
              type="text"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                  handleAddColumn();
                }
              }}
              placeholder="Nombre de la columna"
              className="w-full px-2 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <select
                value={newColumnType}
                onChange={(e) => setNewColumnType(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 px-2 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="varchar(255)">varchar(255)</option>
                <option value="text">text</option>
                <option value="int">int</option>
                <option value="serial">serial</option>
                <option value="boolean">boolean</option>
                <option value="timestamp">timestamp</option>
                <option value="decimal(10,2)">decimal(10,2)</option>
              </select>
              <button
                onClick={handleAddColumn}
                disabled={!newColumnName.trim()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-400 text-white rounded text-sm font-medium transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Columns List */}
        <div className="space-y-2">
          {table.columns.map((column) => (
            <div
              key={column.name}
              className={`p-3 border rounded-md transition-colors ${
                selectedColumn === column.name
                  ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getColumnIcon(column)}
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {column.name}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveColumn(column.name)}
                  className="p-1 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                  title="Eliminar columna"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                <code className="bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5 rounded text-xs">
                  {column.type}
                </code>
              </div>

              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={column.isPrimaryKey || false}
                    onChange={(e) => handleUpdateColumn(column.name, { isPrimaryKey: e.target.checked })}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded"
                  />
                  PK
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={!column.isOptional}
                    onChange={(e) => handleUpdateColumn(column.name, { isOptional: !e.target.checked })}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded"
                  />
                  NN
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={column.isUnique || false}
                    onChange={(e) => handleUpdateColumn(column.name, { isUnique: e.target.checked })}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded"
                  />
                  UQ
                </label>
              </div>

              {column.references && (
                <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                  FK → {column.references.table}.{column.references.column}
                </div>
              )}
            </div>
          ))}
        </div>

        {table.columns.length === 0 && (
          <div className="text-center py-8">
            <Hash className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No hay columnas en esta tabla
            </p>
          </div>
        )}
      </div>
    </div>
  );
}