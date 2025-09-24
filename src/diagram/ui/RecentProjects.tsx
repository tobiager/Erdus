import React, { useEffect, useState } from 'react';
import { Calendar, Database, Edit3, Copy, Trash2, FolderOpen } from 'lucide-react';
import { useDiagramStore } from '../store';
import { ERProject } from '../../types';
import { autoSave } from '../services/autosave';
import { nanoid } from 'nanoid';

export default function RecentProjects() {
  const { 
    recentProjects, 
    loadRecentProjects, 
    loadProject, 
    isLoading, 
    createProject 
  } = useDiagramStore();
  
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadRecentProjects();
  }, [loadRecentProjects]);

  const handleOpenProject = async (project: ERProject) => {
    loadProject(project);
  };

  const handleDuplicateProject = async (project: ERProject) => {
    const duplicatedProject: ERProject = {
      ...project,
      id: nanoid(),
      name: `${project.name} (copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await autoSave.saveProject(duplicatedProject);
    loadRecentProjects();
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
      await autoSave.deleteProject(projectId);
      loadRecentProjects();
    }
  };

  const handleRenameProject = async (project: ERProject) => {
    if (editName.trim() && editName !== project.name) {
      const updatedProject = { ...project, name: editName.trim() };
      await autoSave.saveProject(updatedProject);
      loadRecentProjects();
    }
    setEditingProject(null);
    setEditName('');
  };

  const startRename = (project: ERProject) => {
    setEditingProject(project.id);
    setEditName(project.name);
  };

  const handleNewProject = (template: string = 'empty') => {
    const name = prompt('Nombre del nuevo proyecto:');
    if (name?.trim()) {
      createProject(name.trim(), 'default', template);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Diagramas ER
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Crea y edita diagramas de entidad-relación para tus proyectos de base de datos
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => handleNewProject('empty')}
          className="p-6 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
        >
          <div className="text-center">
            <Database className="w-8 h-8 text-neutral-400 group-hover:text-blue-500 mx-auto mb-2" />
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
              Proyecto vacío
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Empezar desde cero
            </p>
          </div>
        </button>

        <button
          onClick={() => handleNewProject('crud')}
          className="p-6 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
        >
          <div className="text-center">
            <Database className="w-8 h-8 text-neutral-400 group-hover:text-blue-500 mx-auto mb-2" />
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
              Template CRUD
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Usuarios y posts
            </p>
          </div>
        </button>

        <button
          onClick={() => handleNewProject('ventas')}
          className="p-6 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
        >
          <div className="text-center">
            <Database className="w-8 h-8 text-neutral-400 group-hover:text-blue-500 mx-auto mb-2" />
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
              Template Ventas
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Sistema de comercio
            </p>
          </div>
        </button>
      </div>

      {/* Recent projects */}
      {recentProjects.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Proyectos recientes
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-xl transition-shadow bg-white dark:bg-neutral-800"
              >
                <div className="flex items-start justify-between mb-3">
                  {editingProject === project.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleRenameProject(project)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameProject(project);
                        if (e.key === 'Escape') {
                          setEditingProject(null);
                          setEditName('');
                        }
                      }}
                      autoFocus
                      className="font-medium text-neutral-900 dark:text-neutral-100 bg-transparent border border-blue-500 rounded px-1 py-0.5 text-sm flex-1"
                    />
                  ) : (
                    <h3 
                      className="font-medium text-neutral-900 dark:text-neutral-100 truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      onClick={() => handleOpenProject(project)}
                    >
                      {project.name}
                    </h3>
                  )}
                  
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => startRename(project)}
                      className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded"
                      title="Renombrar"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDuplicateProject(project)}
                      className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded"
                      title="Duplicar"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="p-1 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    <span className="capitalize">{project.settings.dialect}</span>
                    <span className="bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded text-xs">
                      {project.schemas[0]?.tables.length || 0} tablas
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(project.updatedAt)}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenProject(project)}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  Abrir proyecto
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentProjects.length === 0 && (
        <div className="text-center py-12">
          <Database className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            No hay proyectos recientes
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Crea tu primer diagrama ER seleccionando una de las opciones de arriba
          </p>
        </div>
      )}
    </div>
  );
}