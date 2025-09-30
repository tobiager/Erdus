import { Handle, Position } from 'reactflow';
import { ChevronDown, ChevronUp, Key, Hash, Lock } from 'lucide-react';
import clsx from 'clsx';
import { IRTable, IRColumn } from '../../../ir';

interface TableNodeProps {
  data: {
    table: IRTable;
    color: string;
    collapsed: boolean;
  };
  selected: boolean;
}

export default function TableNode({ data, selected }: TableNodeProps) {
  const { table, color, collapsed } = data;

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
          <h3 className="text-lg font-semibold text-white">
            {table.name}
          </h3>

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
            className="flex items-center gap-3 px-4 py-2 border-b border-slate-100 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
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
    </div>
  );
}