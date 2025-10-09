/**
 * DiagramGallery - View and manage ER diagrams
 * Part of Erdus - Universal ER Diagram Converter
 * @author tobiager
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, Calendar, Database } from 'lucide-react';
import type { ERDiagram } from '../diagram-types';
import { createEmptyDiagram } from '../diagram-utils';

export default function DiagramGallery() {
  const [diagrams, setDiagrams] = useState<ERDiagram[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newDiagramName, setNewDiagramName] = useState('');

  useEffect(() => {
    // Load diagrams from localStorage
    const stored = localStorage.getItem('erdus-diagrams');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const diagramsWithDates = parsed.map((d: any) => ({
          ...d,
          metadata: {
            ...d.metadata,
            createdAt: new Date(d.metadata.createdAt),
            updatedAt: new Date(d.metadata.updatedAt)
          }
        }));
        setDiagrams(diagramsWithDates);
      } catch (e) {
        console.error('Failed to load diagrams:', e);
      }
    }
  }, []);

  const handleCreateDiagram = () => {
    if (!newDiagramName.trim()) {
      alert('Please enter a diagram name');
      return;
    }

    const newDiagram = createEmptyDiagram(newDiagramName);
    const updatedDiagrams = [...diagrams, newDiagram];
    setDiagrams(updatedDiagrams);
    localStorage.setItem('erdus-diagrams', JSON.stringify(updatedDiagrams));
    setIsCreating(false);
    setNewDiagramName('');
  };

  const handleDeleteDiagram = (id: string) => {
    if (!confirm('Are you sure you want to delete this diagram?')) {
      return;
    }

    const updatedDiagrams = diagrams.filter(d => d.id !== id);
    setDiagrams(updatedDiagrams);
    localStorage.setItem('erdus-diagrams', JSON.stringify(updatedDiagrams));
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            ER Diagram Gallery
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Create and manage your entity-relationship diagrams
          </p>
        </div>

        {/* Create new diagram section */}
        <div className="mb-8">
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={20} />
              New Diagram
            </button>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">
                Create New Diagram
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDiagramName}
                  onChange={(e) => setNewDiagramName(e.target.value)}
                  placeholder="Diagram name..."
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateDiagram();
                    if (e.key === 'Escape') {
                      setIsCreating(false);
                      setNewDiagramName('');
                    }
                  }}
                />
                <button
                  onClick={handleCreateDiagram}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewDiagramName('');
                  }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Diagrams grid */}
        {diagrams.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={48} className="mx-auto mb-4 text-slate-400" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              No diagrams yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Create your first ER diagram to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {diagrams.map((diagram) => (
              <div
                key={diagram.id}
                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-lg transition"
              >
                <Link to={`/diagrams/${diagram.id}`} className="block">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {diagram.name}
                  </h3>
                  
                  {diagram.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      {diagram.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Database size={14} />
                      <span>{diagram.language}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText size={14} />
                      <span>{diagram.entities.length} entities</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-600">
                    <Calendar size={12} />
                    <span>
                      Updated {new Date(diagram.metadata.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>

                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => handleDeleteDiagram(diagram.id)}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
