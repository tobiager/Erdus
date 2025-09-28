import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { DiagramEngine } from '../store/db';
import { useDiagrams } from '../store/diagrams';
import { useT } from '../services/i18n';

interface CreateDiagramDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateDiagramDialog({ isOpen, onClose }: CreateDiagramDialogProps) {
  const { t } = useT();
  const navigate = useNavigate();
  const { createDiagram, diagrams } = useDiagrams();
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [projectName, setProjectName] = useState('');
  const [selectedEngine, setSelectedEngine] = useState<DiagramEngine>('ir');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [nameError, setNameError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const engines = [
    { value: 'ir' as DiagramEngine, label: 'Default (IR)' },
    { value: 'mssql' as DiagramEngine, label: 'SQL Server' },
    { value: 'mysql' as DiagramEngine, label: 'MySQL' },
    { value: 'postgres' as DiagramEngine, label: 'PostgreSQL' },
    { value: 'sqlite' as DiagramEngine, label: 'SQLite' },
    { value: 'prisma' as DiagramEngine, label: 'Prisma' },
    { value: 'typeorm' as DiagramEngine, label: 'TypeORM' }
  ];

  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
    '#ec4899', '#6b7280', '#374151', '#1f2937'
  ];

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setProjectName('');
      setSelectedEngine('ir');
      setDescription('');
      setSelectedColor('#3b82f6');
      setNameError('');
      setIsCreating(false);
      // Focus the name input after animation completes
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const validateName = (name: string) => {
    if (!name.trim()) {
      setNameError('Project name is required');
      return false;
    }

    // Check for duplicate names
    const existingNames = diagrams.map(d => d.meta.name.toLowerCase());
    if (existingNames.includes(name.trim().toLowerCase())) {
      setNameError('A diagram with this name already exists');
      return false;
    }

    setNameError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateName(projectName) || isCreating) return;

    setIsCreating(true);
    try {
      const diagramId = await createDiagram(
        projectName.trim(), 
        selectedEngine, 
        description.trim() || undefined,
        selectedColor
      );
      
      onClose();
      navigate(`/diagrams/${diagramId}`);
    } catch (error) {
      console.error('Failed to create diagram:', error);
      setIsCreating(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setProjectName(value);
    
    // Clear error when user starts typing
    if (nameError && value.trim()) {
      validateName(value);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Create New Diagram
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Project Name *
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={projectName}
                  onChange={handleNameChange}
                  onBlur={() => validateName(projectName)}
                  placeholder="My ER Diagram"
                  className={`w-full px-4 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors ${
                    nameError 
                      ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                      : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500'
                  }`}
                  disabled={isCreating}
                />
                {nameError && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{nameError}</p>
                )}
              </div>

              {/* Engine Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Database Engine
                </label>
                <select
                  value={selectedEngine}
                  onChange={(e) => setSelectedEngine(e.target.value as DiagramEngine)}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  disabled={isCreating}
                >
                  {engines.map((engine) => (
                    <option key={engine.value} value={engine.value}>
                      {engine.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of your diagram..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
                  disabled={isCreating}
                />
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Color
                </label>
                <div className="flex flex-wrap gap-3">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                        selectedColor === color 
                          ? 'border-slate-800 dark:border-white shadow-lg' 
                          : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                      disabled={isCreating}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                disabled={isCreating}
                className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!projectName.trim() || !!nameError || isCreating}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Diagram'
                )}
              </button>
            </div>

            {/* Shortcuts hint */}
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-3">
              Press <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">Esc</kbd> to cancel, 
              <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs ml-1">Ctrl+Enter</kbd> to create
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}