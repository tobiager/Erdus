import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MoreVertical, Copy, Trash2, Edit3 } from 'lucide-react';
import clsx from 'clsx';
import { DiagramDoc } from '../store/db';
import { useT } from '../services/i18n';

interface DiagramCardProps {
  diagram: DiagramDoc;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

export default function DiagramCard({ diagram, onDuplicate, onDelete, onRename }: DiagramCardProps) {
  const { t } = useT();
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(diagram.meta.name);

  const handleRename = () => {
    if (newName.trim() && newName !== diagram.meta.name) {
      onRename(diagram.meta.id, newName.trim());
    }
    setIsRenaming(false);
    setNewName(diagram.meta.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setIsRenaming(false);
      setNewName(diagram.meta.name);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const engineLabels = {
    ir: 'Default',
    mssql: 'SQL Server',
    mysql: 'MySQL',
    postgres: 'PostgreSQL',
    sqlite: 'SQLite',
    prisma: 'Prisma',
    typeorm: 'TypeORM'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
    >
      {/* Color accent line */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: diagram.meta.color }}
      />

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            {isRenaming ? (
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={handleKeyDown}
                className="w-full text-lg font-semibold bg-transparent border border-slate-300 dark:border-slate-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            ) : (
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                {diagram.meta.name}
              </h3>
            )}
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {engineLabels[diagram.meta.engine]}
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10">
                <button
                  onClick={() => {
                    setIsRenaming(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 rounded-t-lg"
                >
                  <Edit3 className="w-4 h-4" />
                  Rename
                </button>
                <button
                  onClick={() => {
                    onDuplicate(diagram.meta.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
                <button
                  onClick={() => {
                    onDelete(diagram.meta.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 rounded-b-lg"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-4">
          <div className="flex items-center gap-1">
            <span className="font-medium">{diagram.meta.stats.tables}</span>
            <span>tables</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">{diagram.meta.stats.relations}</span>
            <span>relations</span>
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-500 space-y-1">
          <div>Created: {formatDate(diagram.meta.createdAt)}</div>
          <div>Modified: {formatDate(diagram.meta.updatedAt)}</div>
        </div>

        <Link
          to={`/diagrams/${diagram.meta.id}`}
          className={clsx(
            'absolute inset-0 z-0',
            isRenaming && 'pointer-events-none'
          )}
          aria-label={`Open diagram: ${diagram.meta.name}`}
        />
      </div>

      {/* Click overlay when menu is open */}
      {showMenu && (
        <div
          className="fixed inset-0 z-[5]"
          onClick={() => setShowMenu(false)}
        />
      )}
    </motion.div>
  );
}