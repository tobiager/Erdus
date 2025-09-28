import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { DiagramDoc } from '../store/db';
import { useT } from '../services/i18n';
import { renameDiagram, changeColor, changeEngine } from '../store/diagrams';
import DiagramCardMenu from './DiagramCardMenu';

interface DiagramCardProps {
  diagram: DiagramDoc;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export default function DiagramCard({ diagram, onDuplicate, onDelete, onRefresh }: DiagramCardProps) {
  const { t } = useT();
  const navigate = useNavigate();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(diagram.meta.name);

  const handleRename = async () => {
    if (newName.trim() && newName !== diagram.meta.name) {
      try {
        await renameDiagram(diagram.meta.id, newName.trim());
        onRefresh();
      } catch (error) {
        console.error('Failed to rename diagram:', error);
      }
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

  const handleChangeColor = async (color: string) => {
    try {
      await changeColor(diagram.meta.id, color);
      onRefresh();
    } catch (error) {
      console.error('Failed to change color:', error);
    }
  };

  const handleChangeEngine = async (engine: string) => {
    try {
      await changeEngine(diagram.meta.id, engine as any);
      onRefresh();
    } catch (error) {
      console.error('Failed to change engine:', error);
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
                className="w-full text-lg font-semibold bg-transparent border border-slate-300 dark:border-slate-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
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
            {diagram.meta.description && (
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 line-clamp-2">
                {diagram.meta.description}
              </p>
            )}
          </div>

          <DiagramCardMenu
            diagram={diagram}
            onOpen={() => navigate(`/diagrams/${diagram.meta.id}`)}
            onRename={() => setIsRenaming(true)}
            onDuplicate={() => onDuplicate(diagram.meta.id)}
            onChangeColor={handleChangeColor}
            onChangeEngine={handleChangeEngine}
            onExport={() => {
              // TODO: Implement export dialog
              console.log('Export diagram:', diagram.meta.id);
            }}
            onDelete={() => onDelete(diagram.meta.id)}
          />
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
    </motion.div>
  );
}