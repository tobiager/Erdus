import { useState, useRef, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { ChevronDown, ChevronUp, Key, Hash, Lock } from 'lucide-react';
import clsx from 'clsx';
import { IRTable, IRColumn } from '../../../ir';

interface TableNodeProps {
  data: {
    table: IRTable;
    color: string;
    collapsed: boolean;
    onEdit: (editing: boolean) => void;
  };
  selected: boolean;
}

export default function TableNode({ data, selected }: TableNodeProps) {
  const { table, color, collapsed, onEdit } = data;
  const [isEditing, setIsEditing] = useState(false);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [tableName, setTableName] = useState(table.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
    onEdit(isEditing || editingColumn !== null);
  }, [isEditing, editingColumn, onEdit]);

  const handleTableNameEdit = () => {
    setIsEditing(true);
  };

  const handleTableNameSave = () => {
    // TODO: Update table name in IR
    setIsEditing(false);
  };

  const handleTableNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTableNameSave();
    } else if (e.key === 'Escape') {
      setTableName(table.name);
      setIsEditing(false);
    }
  };

  const getColumnIcon = (column: IRColumn) => {
    if (column.isPrimaryKey) {
      return <Key className="w-3 h-3 text-yellow-600" title="Primary Key" />;
    }
    if (!column.isOptional) {
      return <Lock className="w-3 h-3 text-red-600" title="Not Null" />;
    }
    return <Hash className="w-3 h-3 text-slate-400" />;
  };

  const getColumnType = (column: IRColumn) => {
    // TODO: Map types based on engine
    return column.type;
  };

  const visibleColumns = collapsed ? table.columns.slice(0, 3) : table.columns;
  const hiddenCount = table.columns.length - visibleColumns.length;

  return (
    <div
      className={clsx(
        'bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-2 transition-all',
        selected 
          ? 'border-blue-500 shadow-blue-200 dark:shadow-blue-900/50' 
          : 'border-slate-200 dark:border-slate-700'
      )}
      style={{ minWidth: 280 }}
    >
      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Left}
        className="opacity-0 hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="opacity-0 hover:opacity-100 transition-opacity"
      />

      {/* Table header */}
      <div
        className="px-4 py-3 rounded-t-2xl border-b border-slate-200 dark:border-slate-600"
        style={{ backgroundColor: color }}
      >
        <div className="flex items-center justify-between">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              onBlur={handleTableNameSave}
              onKeyDown={handleTableNameKeyDown}
              className="bg-white/90 text-slate-900 px-2 py-1 rounded text-lg font-semibold border-0 outline-none flex-1"
            />
          ) : (
            <h3
              className="text-lg font-semibold text-white cursor-pointer hover:bg-black/10 px-2 py-1 rounded transition-colors"
              onClick={handleTableNameEdit}
              title="Click to edit table name"
            >
              {table.name}
            </h3>
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm text-white/80">
              {table.columns.length} cols
            </span>
            {table.columns.length > 3 && (
              <button
                className="p-1 rounded hover:bg-black/10 transition-colors text-white"
                title={collapsed ? 'Expand columns' : 'Collapse columns'}
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Toggle collapsed state
                }}
              >
                {collapsed ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="p-0">
        {visibleColumns.map((column, index) => (
          <div
            key={column.name}
            className={clsx(
              'flex items-center gap-3 px-4 py-2 border-b border-slate-100 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors',
              editingColumn === column.name && 'bg-blue-50 dark:bg-blue-900/20'
            )}
            onClick={() => setEditingColumn(editingColumn === column.name ? null : column.name)}
          >
            <div className="flex-shrink-0">
              {getColumnIcon(column)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-medium text-slate-900 dark:text-white truncate">
                {column.name}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                {getColumnType(column)}
                {column.references && (
                  <span className="text-blue-600 dark:text-blue-400 ml-1">
                    → {column.references.table}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-shrink-0 flex items-center gap-1">
              {column.isPrimaryKey && (
                <span className="text-xs px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">
                  PK
                </span>
              )}
              {column.isUnique && (
                <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                  UQ
                </span>
              )}
              {column.references && (
                <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                  FK
                </span>
              )}
            </div>
          </div>
        ))}

        {hiddenCount > 0 && (
          <div className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 text-center border-t border-slate-100 dark:border-slate-700">
            +{hiddenCount} more columns
          </div>
        )}
      </div>

      {/* Column editor panel */}
      {editingColumn && (
        <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/50">
          <h4 className="font-medium text-slate-900 dark:text-white mb-3">
            Edit Column: {editingColumn}
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Name
              </label>
              <input
                type="text"
                defaultValue={editingColumn}
                className="w-full text-sm px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Type
              </label>
              <select className="w-full text-sm px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                <option>VARCHAR(255)</option>
                <option>INTEGER</option>
                <option>BOOLEAN</option>
                <option>TIMESTAMP</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded" />
              <span className="text-slate-700 dark:text-slate-300">Primary Key</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded" />
              <span className="text-slate-700 dark:text-slate-300">Not Null</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded" />
              <span className="text-slate-700 dark:text-slate-300">Unique</span>
            </label>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setEditingColumn(null)}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setEditingColumn(null)}
              className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}