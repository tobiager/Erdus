import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, RotateCcw, X } from 'lucide-react';
import { DiagramDoc } from '../store/db';
import { getDeletedDiagrams, restoreDiagram, purgeDeletedDiagrams } from '../store/diagrams';
import { useT } from '../services/i18n';

interface TrashBarProps {
  onClose: () => void;
  onRefresh: () => void;
}

export default function TrashBar({ onClose, onRefresh }: TrashBarProps) {
  const { t } = useT();
  const [deletedDiagrams, setDeletedDiagrams] = useState<DiagramDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeletedDiagrams();
  }, []);

  const loadDeletedDiagrams = async () => {
    try {
      const deleted = await getDeletedDiagrams();
      setDeletedDiagrams(deleted);
    } catch (error) {
      console.error('Failed to load deleted diagrams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreDiagram(id);
      await loadDeletedDiagrams();
      onRefresh();
    } catch (error) {
      console.error('Failed to restore diagram:', error);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this diagram? This cannot be undone.')) {
      return;
    }

    try {
      // Force delete by setting deletedAt to far past
      const diagram = deletedDiagrams.find(d => d.meta.id === id);
      if (diagram) {
        // This will trigger purge
        await purgeDeletedDiagrams(0);
        await loadDeletedDiagrams();
      }
    } catch (error) {
      console.error('Failed to permanently delete diagram:', error);
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm('Are you sure you want to permanently delete all items in trash? This cannot be undone.')) {
      return;
    }

    try {
      await purgeDeletedDiagrams(0);
      await loadDeletedDiagrams();
    } catch (error) {
      console.error('Failed to empty trash:', error);
    }
  };

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysInTrash = (deletedAt: string) => {
    const deleted = new Date(deletedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - deleted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-16 left-0 right-0 z-50 bg-slate-900 border-b border-slate-700 shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trash2 className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-white">
              Trash ({deletedDiagrams.length} items)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {deletedDiagrams.length > 0 && (
              <button
                onClick={handleEmptyTrash}
                className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Empty Trash
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : deletedDiagrams.length === 0 ? (
          <div className="text-center py-8">
            <Trash2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Trash is empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {deletedDiagrams.map((diagram) => (
              <div
                key={diagram.meta.id}
                className="bg-slate-800 border border-slate-700 rounded-lg p-4 relative"
              >
                {/* Color line */}
                <div
                  className="absolute inset-x-0 top-0 h-1 rounded-t-lg opacity-50"
                  style={{ background: diagram.meta.color ?? '#3b82f6' }}
                />

                <div className="pt-2">
                  <h3 className="font-medium text-white truncate mb-1">
                    {diagram.meta.name}
                  </h3>
                  <p className="text-sm text-slate-400 mb-2">
                    {diagram.meta.engine === 'ir' ? 'Default' : diagram.meta.engine}
                  </p>
                  {diagram.meta.description && (
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                      {diagram.meta.description}
                    </p>
                  )}

                  <div className="text-xs text-slate-500 mb-3">
                    <div>Deleted: {formatDate(diagram.meta.deletedAt!)}</div>
                    <div className="text-amber-400">
                      {7 - getDaysInTrash(diagram.meta.deletedAt!)} days remaining
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRestore(diagram.meta.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restore
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(diagram.meta.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}