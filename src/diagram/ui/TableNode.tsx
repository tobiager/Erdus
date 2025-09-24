import React from 'react';
import { Handle, Position } from 'reactflow';
import { Key, Hash, Link, Eye, EyeOff } from 'lucide-react';
import { ERTable } from '../../types';
import { useDiagramStore } from '../store';
import classnames from 'classnames';

interface TableNodeProps {
  data: {
    table: ERTable;
  };
  selected: boolean;
}

export default function TableNode({ data, selected }: TableNodeProps) {
  const { table } = data;
  const { selectTable, selectColumn, selectedColumn } = useDiagramStore();

  const handleTableClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectTable(table.id);
  };

  const handleColumnClick = (e: React.MouseEvent, columnName: string) => {
    e.stopPropagation();
    selectColumn(table.id, columnName);
  };

  const getBadgeForColumn = (column: typeof table.columns[0]) => {
    const badges = [];
    
    if (column.isPrimaryKey) {
      badges.push(
        <span key="pk" className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
          <Key className="w-3 h-3 mr-1" />
          PK
        </span>
      );
    }
    
    if (column.references) {
      badges.push(
        <span key="fk" className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          <Link className="w-3 h-3 mr-1" />
          FK
        </span>
      );
    }
    
    if (column.isUnique && !column.isPrimaryKey) {
      badges.push(
        <span key="unique" className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
          <Hash className="w-3 h-3 mr-1" />
          UQ
        </span>
      );
    }
    
    return badges;
  };

  return (
    <div
      className={classnames(
        'bg-white dark:bg-slate-800 rounded-lg shadow-lg border-2 min-w-[240px]',
        selected 
          ? 'border-blue-500 dark:border-blue-400' 
          : 'border-slate-200 dark:border-slate-700',
        'hover:shadow-xl transition-shadow duration-200'
      )}
      onClick={handleTableClick}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500"
      />

      {/* Table header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 rounded-t-lg">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center">
          {table.name}
          {table.comment && (
            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400" title={table.comment}>
              💬
            </span>
          )}
        </h3>
      </div>

      {/* Columns */}
      <div className="px-4 py-2">
        {table.columns.map((column) => (
          <div
            key={column.name}
            className={classnames(
              'py-2 px-2 rounded cursor-pointer transition-colors',
              selectedColumn === column.name && selected
                ? 'bg-blue-100 dark:bg-blue-900/20'
                : 'hover:bg-slate-50 dark:hover:bg-slate-700'
            )}
            onClick={(e) => handleColumnClick(e, column.name)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-slate-900 dark:text-slate-100 truncate">
                    {column.name}
                  </span>
                  <div className="flex gap-1">
                    {getBadgeForColumn(column)}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {column.type}
                  </span>
                  {column.isOptional ? (
                    <EyeOff className="w-3 h-3 text-slate-400" title="Nullable" />
                  ) : (
                    <Eye className="w-3 h-3 text-slate-600 dark:text-slate-400" title="Not null" />
                  )}
                  {column.default && (
                    <span className="text-xs text-slate-500 dark:text-slate-400" title={`Default: ${column.default}`}>
                      = {column.default.length > 10 ? `${column.default.substring(0, 10)}...` : column.default}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {table.columns.length === 0 && (
          <div className="py-4 text-center text-slate-500 dark:text-slate-400 text-sm">
            No columns
          </div>
        )}
      </div>
    </div>
  );
}