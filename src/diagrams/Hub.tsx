import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Database, Plus, Upload, Calendar, Trash2, Copy, Edit3, FolderOpen, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDiagramStore } from './store/diagramsStore';
import { diagramsService, ProjectMetadata } from './services/diagramsService';
import CreateProjectDialog from './CreateProjectDialog';
import { ERProject } from '../types';

export default function Hub() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { 
    recentProjects, 
    loadRecentProjects, 
    isLoading 
  } = useDiagramStore();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importError, setImportError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadRecentProjects();
  }, [loadRecentProjects]);

  const handleCreateNew = () => {
    setCreateDialogOpen(true);
  };

  const handleOpenProject = (project: ERProject) => {
    navigate(`/diagrams/${project.id}`);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError('');
    
    try {
      const project = await diagramsService.importFromFile(file);
      diagramsService.saveRecentProject(project);
      loadRecentProjects();
      navigate(`/diagrams/${project.id}`);
    } catch (error) {
      setImportError((error as Error).message);
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            {t('diagrams.title')}
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
            {t('diagrams.subtitle')}
          </p>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t('diagrams.createNew')}
            </button>
            
            <button
              onClick={handleImport}
              className="flex items-center gap-2 px-6 py-3 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium transition-colors"
            >
              <Upload className="w-5 h-5" />
              {t('diagrams.importDiagram')}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.sql,.dbml"
              onChange={handleFileImport}
              className="hidden"
            />
          </div>

          {/* Import Error */}
          {importError && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300 max-w-md mx-auto">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{importError}</span>
            </div>
          )}
        </div>

        {/* Recent Projects */}
        {recentProjects.length > 0 ? (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
              {t('diagrams.recent')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentProjects.slice(0, 9).map((project) => (
                <div
                  key={project.id}
                  className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 hover:shadow-lg dark:hover:shadow-2xl transition-shadow bg-white dark:bg-neutral-900"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 
                      className="font-semibold text-neutral-900 dark:text-neutral-100 truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 flex-1"
                      onClick={() => handleOpenProject(project)}
                    >
                      {project.name}
                    </h3>
                    
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded"
                        title={t('diagrams.edit')}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded"
                        title={t('diagrams.duplicate')}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                        title={t('diagrams.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      <span className="capitalize">
                        {t(`diagrams.dialects.${project.settings.dialect}`)}
                      </span>
                      <span className="bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded-full text-xs">
                        {project.schemas[0]?.tables.length || 0} {t('diagrams.tables')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(project.updatedAt)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenProject(project)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <FolderOpen className="w-4 h-4" />
                    {t('diagrams.openProject')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Database className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              {t('diagrams.emptyState')}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              {t('diagrams.getStarted')}
            </p>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t('diagrams.createNew')}
            </button>
          </div>
        )}

        {/* How it works */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t('diagrams.howItWorks')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-neutral-600 dark:text-neutral-400">
            <div>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                1
              </div>
              <p>{t('diagrams.step1')}</p>
            </div>
            <div>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                2
              </div>
              <p>{t('diagrams.step2')}</p>
            </div>
            <div>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                3
              </div>
              <p>{t('diagrams.step3')}</p>
            </div>
          </div>
        </div>
      </div>

      <CreateProjectDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
    </div>
  );
}