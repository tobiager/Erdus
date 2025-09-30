import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Upload, FileText, Trash2 } from 'lucide-react';
import { useDiagrams, purgeDeletedDiagrams } from './store/diagrams';
import { useT } from './services/i18n';
import DiagramCard from './components/DiagramCard';
import CreateDiagramDialog from './components/CreateDiagramDialog';
import TrashBar from './components/TrashBar';
import { DiagramEngine } from './store/db';

export default function DiagramsGallery() {
  const { t } = useT();
  const { diagrams, loading, softDeleteDiagram, duplicateDiagram, refreshDiagrams } = useDiagrams();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEngine, setFilterEngine] = useState<DiagramEngine | 'all'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTrash, setShowTrash] = useState(false);

  // Purge old deleted diagrams on mount
  useEffect(() => {
    purgeDeletedDiagrams(7).catch(console.error);
  }, []);

  const filteredDiagrams = useMemo(() => {
    return diagrams.filter(diagram => {
      const matchesSearch = diagram.meta.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (diagram.meta.description && diagram.meta.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesEngine = filterEngine === 'all' || diagram.meta.engine === filterEngine;
      return matchesSearch && matchesEngine;
    });
  }, [diagrams, searchQuery, filterEngine]);

  const engineOptions = [
    { value: 'all', label: 'All Engines' },
    { value: 'ir', label: 'Default' },
    { value: 'mssql', label: 'SQL Server' },
    { value: 'mysql', label: 'MySQL' },
    { value: 'postgres', label: 'PostgreSQL' },
    { value: 'sqlite', label: 'SQLite' },
    { value: 'prisma', label: 'Prisma' },
    { value: 'typeorm', label: 'TypeORM' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              ER Diagrams
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Create, edit, and manage your entity relationship diagrams
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowTrash(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="View trash"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Trash</span>
            </button>

            <button
              onClick={() => setShowCreateDialog(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              New Diagram
            </button>

            <button className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Upload className="w-4 h-4" />
              Import
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search diagrams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterEngine}
          onChange={(e) => setFilterEngine(e.target.value as DiagramEngine | 'all')}
          className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {engineOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Diagrams Grid */}
      <AnimatePresence mode="wait">
        {filteredDiagrams.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">
              {searchQuery || filterEngine !== 'all' 
                ? 'No diagrams found'
                : 'No diagrams yet'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {searchQuery || filterEngine !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first ER diagram to get started'}
            </p>
            {!searchQuery && filterEngine === 'all' && (
              <button
                onClick={() => setShowCreateDialog(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Create First Diagram
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredDiagrams.map((diagram) => (
              <DiagramCard
                key={diagram.meta.id}
                diagram={diagram}
                onDuplicate={duplicateDiagram}
                onDelete={softDeleteDiagram}
                onRefresh={refreshDiagrams}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Dialog */}
      <CreateDiagramDialog 
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />

      {/* Trash Bar */}
      <AnimatePresence>
        {showTrash && (
          <TrashBar 
            onClose={() => setShowTrash(false)}
            onRefresh={refreshDiagrams}
          />
        )}
      </AnimatePresence>
    </div>
  );
}