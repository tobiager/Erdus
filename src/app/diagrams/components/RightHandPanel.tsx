import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, Key, Save } from 'lucide-react';
import { IRTable, IRColumn } from '../../../ir';
import { Engine, DATA_TYPES } from '../../../types';
import { useT } from '../services/i18n';
import clsx from 'clsx';

interface RightHandPanelProps {
  selectedTable: IRTable | null;
  engine: Engine;
  onClose: () => void;
  onUpdateTable: (table: IRTable) => Promise<void>;
  onDeleteTable: (tableName: string) => Promise<void>;
}

export default function RightHandPanel({
  selectedTable,
  engine,
  onClose,
  onUpdateTable,
  onDeleteTable,
}: RightHandPanelProps) {
  const { t } = useT();
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<IRColumn[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize state when table changes
  useEffect(() => {
    if (selectedTable) {
      setTableName(selectedTable.name);
      setColumns(JSON.parse(JSON.stringify(selectedTable.columns))); // Deep copy
      setHasChanges(false);
    }
  }, [selectedTable]);

  // Debounced autosave
  useEffect(() => {
    if (!hasChanges || !selectedTable) return;

    const timer = setTimeout(async () => {
      await handleSave();
    }, 400); // 400ms debounce as per spec

    return () => clearTimeout(timer);
  }, [hasChanges, tableName, columns]);

  const handleSave = useCallback(async () => {
    if (!selectedTable) return;

    setIsSaving(true);
    try {
      const updatedTable: IRTable = {
        ...selectedTable,
        name: tableName,
        columns: columns,
      };
      await onUpdateTable(updatedTable);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save table:', error);
    } finally {
      setIsSaving(false);
    }
  }, [selectedTable, tableName, columns, onUpdateTable]);

  const handleTableNameChange = (newName: string) => {
    setTableName(newName);
    setHasChanges(true);
  };

  const handleAddColumn = () => {
    const newColumn: IRColumn = {
      name: `column${columns.length + 1}`,
      type: DATA_TYPES[engine][0] || 'TEXT',
      isPrimaryKey: false,
      isOptional: true,
      isUnique: false,
    };
    setColumns([...columns, newColumn]);
    setHasChanges(true);
  };

  const handleDeleteColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleColumnChange = (index: number, field: keyof IRColumn, value: any) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], [field]: value };
    setColumns(newColumns);
    setHasChanges(true);
  };

  const handleTogglePrimaryKey = (index: number) => {
    const newColumns = [...columns];
    newColumns[index].isPrimaryKey = !newColumns[index].isPrimaryKey;
    setColumns(newColumns);
    setHasChanges(true);
  };

  const handleDeleteTable = async () => {
    if (!selectedTable) return;
    
    await onDeleteTable(selectedTable.name);
    onClose();
  };

  const validateColumnType = (type: string): boolean => {
    return DATA_TYPES[engine].includes(type);
  };

  if (!selectedTable) return null;

  return (
    <motion.div
      initial={{ x: 400 }}
      animate={{ x: 0 }}
      exit={{ x: 400 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-[400px] bg-slate-900 border-l border-slate-700 flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h3 className="text-white font-semibold flex items-center gap-2">
          {t('diagrams.tableProperties')}
          {isSaving && (
            <span className="text-xs text-green-500 flex items-center gap-1">
              <Save className="w-3 h-3" />
              {t('diagrams.saving')}
            </span>
          )}
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
          aria-label={t('diagrams.close')}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-6">
        {/* Table Name */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {t('diagrams.tableName')}
          </label>
          <input
            type="text"
            value={tableName}
            onChange={(e) => handleTableNameChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('diagrams.tableNamePlaceholder')}
          />
        </div>

        {/* Columns */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-slate-300">
              {t('diagrams.columns')}
            </label>
            <button
              onClick={handleAddColumn}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-3 h-3" />
              {t('diagrams.addColumn')}
            </button>
          </div>

          <div className="space-y-2">
            {columns.map((column, index) => (
              <div
                key={index}
                className="p-3 bg-slate-800 border border-slate-600 rounded-lg space-y-2"
              >
                {/* Column Name */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={column.name}
                    onChange={(e) => handleColumnChange(index, 'name', e.target.value)}
                    className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder={t('diagrams.columnName')}
                  />
                  <button
                    onClick={() => handleTogglePrimaryKey(index)}
                    className={clsx(
                      'p-1 rounded transition-colors',
                      column.isPrimaryKey
                        ? 'bg-yellow-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    )}
                    title={t('diagrams.primaryKey')}
                  >
                    <Key className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteColumn(index)}
                    className="p-1 rounded bg-slate-700 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
                    title={t('diagrams.deleteColumn')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Column Type */}
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={column.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      if (validateColumnType(newType)) {
                        handleColumnChange(index, 'type', newType);
                      }
                    }}
                    className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {DATA_TYPES[engine].map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-xs text-slate-400">
                      <input
                        type="checkbox"
                        checked={!column.isOptional}
                        onChange={(e) =>
                          handleColumnChange(index, 'isOptional', !e.target.checked)
                        }
                        className="rounded border-slate-600"
                      />
                      NOT NULL
                    </label>
                    <label className="flex items-center gap-1 text-xs text-slate-400">
                      <input
                        type="checkbox"
                        checked={column.isUnique || false}
                        onChange={(e) =>
                          handleColumnChange(index, 'isUnique', e.target.checked)
                        }
                        className="rounded border-slate-600"
                      />
                      UNIQUE
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions - Sticky Bottom */}
      <div className="p-4 border-t border-slate-700 bg-slate-900 space-y-2">
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors font-medium"
        >
          {isSaving ? t('diagrams.saving') : t('diagrams.saveChanges')}
        </button>
        
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-colors"
          >
            {t('diagrams.deleteTable')}
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-slate-300 text-center">
              {t('diagrams.confirmDeleteTable')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                {t('diagrams.cancel')}
              </button>
              <button
                onClick={handleDeleteTable}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                {t('diagrams.delete')}
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
