import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Table, Link, Settings, Info } from 'lucide-react';
import { DiagramDoc } from '../store/db';
import { useT } from '../services/i18n';

interface SidePanelsProps {
  side: 'left' | 'right';
  collapsed: boolean;
  diagram: DiagramDoc;
  selectedElement: string | null;
}

export default function SidePanels({ side, collapsed, diagram, selectedElement }: SidePanelsProps) {
  const { t } = useT();

  const panelWidth = 280;
  const direction = side === 'left' ? -1 : 1;

  return (
    <AnimatePresence>
      {!collapsed && (
        <motion.div
          initial={{ x: direction * panelWidth }}
          animate={{ x: 0 }}
          exit={{ x: direction * panelWidth }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`w-[280px] bg-white dark:bg-slate-900 border-${side === 'left' ? 'r' : 'l'} border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden`}
        >
          {side === 'left' ? (
            <LeftPanelContent diagram={diagram} />
          ) : (
            <RightPanelContent diagram={diagram} selectedElement={selectedElement} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LeftPanelContent({ diagram }: { diagram: DiagramDoc }) {
  const { t } = useT();

  return (
    <>
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Table className="w-4 h-4" />
          Tables & Relations
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Tables List */}
        <div className="p-4">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Table className="w-4 h-4" />
            Tables ({diagram.ir.tables.length})
          </h4>
          
          <div className="space-y-1">
            {diagram.ir.tables.map((table) => (
              <div
                key={table.name}
                className="p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <div className="font-medium text-slate-900 dark:text-white">
                  {table.name}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {table.columns.length} columns
                  {table.columns.filter(c => c.references).length > 0 && (
                    <span className="ml-2 text-green-600 dark:text-green-400">
                      {table.columns.filter(c => c.references).length} FK
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Relations List */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Link className="w-4 h-4" />
            Relations ({diagram.meta.stats.relations})
          </h4>
          
          <div className="space-y-1">
            {diagram.ir.tables.map((table) =>
              table.columns
                .filter(column => column.references)
                .map((column) => (
                  <div
                    key={`${table.name}.${column.name}`}
                    className="p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  >
                    <div className="font-medium text-slate-900 dark:text-white text-sm">
                      {table.name}.{column.name}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      → {column.references!.table}.{column.references!.column}
                    </div>
                    {(column.references!.onDelete || column.references!.onUpdate) && (
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {column.references!.onDelete && `ON DELETE ${column.references!.onDelete}`}
                        {column.references!.onUpdate && column.references!.onDelete && ' • '}
                        {column.references!.onUpdate && `ON UPDATE ${column.references!.onUpdate}`}
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function RightPanelContent({ diagram, selectedElement }: { diagram: DiagramDoc; selectedElement: string | null }) {
  const { t } = useT();

  if (!selectedElement) {
    return (
      <>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4" />
            Diagram Info
          </h3>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Name
            </label>
            <input
              type="text"
              defaultValue={diagram.meta.name}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Engine
            </label>
            <select
              defaultValue={diagram.meta.engine}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="ir">Default (IR)</option>
              <option value="mssql">SQL Server</option>
              <option value="mysql">MySQL</option>
              <option value="postgres">PostgreSQL</option>
              <option value="sqlite">SQLite</option>
              <option value="prisma">Prisma</option>
              <option value="typeorm">TypeORM</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                defaultValue={diagram.meta.color}
                className="w-12 h-8 rounded border border-slate-300 dark:border-slate-600"
              />
              <input
                type="text"
                defaultValue={diagram.meta.color}
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Statistics
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {diagram.meta.stats.tables}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Tables
                </div>
              </div>
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {diagram.meta.stats.relations}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Relations
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Find selected table
  const selectedTable = diagram.ir.tables.find(t => t.name === selectedElement);

  if (selectedTable) {
    return (
      <>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Table className="w-4 h-4" />
            Table Properties
          </h3>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Table Name
            </label>
            <input
              type="text"
              defaultValue={selectedTable.name}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Primary Key
            </label>
            <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
              {selectedTable.columns.map(col => (
                <option key={col.name} value={col.name}>
                  {col.name} ({col.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Columns ({selectedTable.columns.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedTable.columns.map(column => (
                <div
                  key={column.name}
                  className="p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-slate-900 dark:text-white text-sm">
                      {column.name}
                    </div>
                    <div className="flex gap-1">
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
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {column.type}
                    {column.references && (
                      <span className="text-green-600 dark:text-green-400 ml-1">
                        → {column.references.table}.{column.references.column}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Properties
        </h3>
      </div>
      
      <div className="p-4">
        <p className="text-slate-500 dark:text-slate-400 text-center">
          Select an element to view its properties
        </p>
      </div>
    </>
  );
}