import React, { useState } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { useDiagramStore } from '../store';
import { getTypesForDialect } from '../services/typeCatalog';

export default function Properties() {
  const { 
    project,
    selectedTable,
    selectedColumn,
    renameTable,
    setTableComment,
    updateColumn,
    addColumn,
    removeColumn,
    validateColumn
  } = useDiagramStore();

  const [editingTableName, setEditingTableName] = useState(false);
  const [tempTableName, setTempTableName] = useState('');

  if (!project) {
    return (
      <div className="h-full p-4 flex items-center justify-center text-slate-500 dark:text-slate-400">
        No hay proyecto activo
      </div>
    );
  }

  const currentTable = selectedTable ? 
    project.schemas[0]?.tables.find(t => t.id === selectedTable) : 
    null;

  const currentColumn = currentTable && selectedColumn ?
    currentTable.columns.find(c => c.name === selectedColumn) :
    null;

  const availableTypes = getTypesForDialect(project.settings.dialect);

  const handleTableNameEdit = () => {
    if (!currentTable) return;
    setTempTableName(currentTable.name);
    setEditingTableName(true);
  };

  const handleTableNameSave = () => {
    if (!currentTable || !tempTableName.trim()) {
      setEditingTableName(false);
      return;
    }
    renameTable(currentTable.id, tempTableName.trim());
    setEditingTableName(false);
  };

  const handleTableNameCancel = () => {
    setEditingTableName(false);
    setTempTableName('');
  };

  const handleColumnUpdate = (field: string, value: any) => {
    if (!currentTable || !selectedColumn) return;
    updateColumn(currentTable.id, selectedColumn, { [field]: value });
  };

  const handleAddColumn = () => {
    if (!currentTable) return;
    addColumn(currentTable.id, {
      name: `column_${currentTable.columns.length + 1}`,
      type: 'varchar',
      isOptional: true
    });
  };

  const handleRemoveColumn = () => {
    if (!currentTable || !selectedColumn) return;
    const confirm = window.confirm(`¿Eliminar la columna "${selectedColumn}"?`);
    if (confirm) {
      removeColumn(currentTable.id, selectedColumn);
    }
  };

  // Column validation
  const columnValidation = currentTable && selectedColumn ? 
    validateColumn(currentTable.id, selectedColumn) : 
    null;

  if (!selectedTable && !selectedColumn) {
    return (
      <div className="h-full p-4">
        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
          Propiedades
        </h2>
        <div className="text-center text-slate-500 dark:text-slate-400 mt-8">
          Selecciona una tabla o columna para editar sus propiedades
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Propiedades
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Table Properties */}
        {currentTable && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Tabla
            </h3>
            
            <div className="space-y-4">
              {/* Table name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre
                </label>
                {editingTableName ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tempTableName}
                      onChange={(e) => setTempTableName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleTableNameSave();
                        if (e.key === 'Escape') handleTableNameCancel();
                      }}
                      className="flex-1 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100"
                      autoFocus
                    />
                    <button
                      onClick={handleTableNameSave}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleTableNameCancel}
                      className="px-2 py-1 text-xs bg-slate-300 text-slate-700 rounded hover:bg-slate-400"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleTableNameEdit}
                    className="w-full text-left px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {currentTable.name}
                  </button>
                )}
              </div>

              {/* Table comment */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Comentario
                </label>
                <textarea
                  value={currentTable.comment || ''}
                  onChange={(e) => setTableComment(currentTable.id, e.target.value)}
                  placeholder="Descripción de la tabla..."
                  rows={3}
                  className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100 resize-none"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Posición
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={Math.round(currentTable.position?.x || 0)}
                    onChange={(e) => {
                      const x = parseInt(e.target.value) || 0;
                      useDiagramStore.getState().setTablePosition(currentTable.id, {
                        x,
                        y: currentTable.position?.y || 0
                      });
                    }}
                    className="flex-1 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="X"
                  />
                  <input
                    type="number"
                    value={Math.round(currentTable.position?.y || 0)}
                    onChange={(e) => {
                      const y = parseInt(e.target.value) || 0;
                      useDiagramStore.getState().setTablePosition(currentTable.id, {
                        x: currentTable.position?.x || 0,
                        y
                      });
                    }}
                    className="flex-1 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="Y"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Column Properties */}
        {currentColumn && currentTable && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Columna: {currentColumn.name}
              </h3>
              <button
                onClick={handleRemoveColumn}
                className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                title="Eliminar columna"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Column name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={currentColumn.name}
                  onChange={(e) => handleColumnUpdate('name', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>

              {/* Column type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tipo
                </label>
                <select
                  value={currentColumn.type}
                  onChange={(e) => handleColumnUpdate('type', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100"
                >
                  {availableTypes.map((type) => (
                    <option key={type.name} value={type.name}>
                      {type.name} - {type.description}
                    </option>
                  ))}
                </select>
                
                {/* Type validation warnings */}
                {columnValidation && !columnValidation.valid && (
                  <div className="mt-1 flex items-start gap-2 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="text-xs">
                      {columnValidation.suggestion && (
                        <div>Sugerencia: {columnValidation.suggestion}</div>
                      )}
                      {columnValidation.warnings?.map((warning, i) => (
                        <div key={i}>{warning}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Column constraints */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Restricciones
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={currentColumn.isPrimaryKey || false}
                    onChange={(e) => handleColumnUpdate('isPrimaryKey', e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Primary Key</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!currentColumn.isOptional}
                    onChange={(e) => handleColumnUpdate('isOptional', !e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Not Null</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={currentColumn.isUnique || false}
                    onChange={(e) => handleColumnUpdate('isUnique', e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Unique</span>
                </label>
              </div>

              {/* Default value */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Valor por defecto
                </label>
                <input
                  type="text"
                  value={currentColumn.default || ''}
                  onChange={(e) => handleColumnUpdate('default', e.target.value || undefined)}
                  placeholder="now(), 0, 'valor'..."
                  className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>

              {/* Check constraint */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Restricción CHECK
                </label>
                <input
                  type="text"
                  value={currentColumn.check || ''}
                  onChange={(e) => handleColumnUpdate('check', e.target.value || undefined)}
                  placeholder="value > 0, length(value) > 3..."
                  className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>

              {/* Foreign key info */}
              {currentColumn.references && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Referencia
                  </label>
                  <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded text-sm">
                    <div>Tabla: {currentColumn.references.table}</div>
                    <div>Columna: {currentColumn.references.column}</div>
                    <div>On Delete: {currentColumn.references.onDelete || 'no action'}</div>
                    <div>On Update: {currentColumn.references.onUpdate || 'no action'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add column button */}
        {currentTable && !selectedColumn && (
          <div className="p-4">
            <button
              onClick={handleAddColumn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Agregar columna (C)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}