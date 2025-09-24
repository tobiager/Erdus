import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Database, Plus, Upload, Calendar, Trash2, Copy, Edit3, FolderOpen } from 'lucide-react';
import { useDiagramStore } from './store/diagramsStore';
import { ERProject } from '../types';

export default function Hub() {
  const navigate = useNavigate();
  const { 
    recentProjects, 
    loadRecentProjects, 
    createProject, 
    isLoading 
  } = useDiagramStore();
  
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadRecentProjects();
  }, [loadRecentProjects]);

  const handleCreateNew = () => {
    const name = prompt('Nombre del proyecto:');
    if (name?.trim()) {
      const projectId = createProject(name.trim(), 'default', 'empty');
      navigate(`/diagrams/${projectId}`);
    }
  };

  const handleCreateTemplate = (template: string) => {
    const name = prompt(`Nombre del proyecto ${template}:`);
    if (name?.trim()) {
      const projectId = createProject(name.trim(), 'default', template);
      navigate(`/diagrams/${projectId}`);
    }
  };

  const handleOpenProject = (project: ERProject) => {
    navigate(`/diagrams/${project.id}`);
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    console.log('Import functionality to be implemented');
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
      <div className="min-h-screen flex items-center justify-center">
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
            Diagramas ER
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
            Diseña, modela y exporta esquemas de bases de datos profesionales
          </p>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create New
            </button>
            
            <button
              onClick={handleImport}
              className="flex items-center gap-2 px-6 py-3 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium transition-colors"
            >
              <Upload className="w-5 h-5" />
              Import Diagram
            </button>
          </div>
        </div>

        {/* Templates */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-6 text-center">
            Plantillas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              onClick={() => handleCreateTemplate('empty')}
              className="cursor-pointer p-8 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
            >
              <div className="text-center">
                <Database className="w-12 h-12 text-neutral-400 group-hover:text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  Proyecto Vacío
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Empezar desde cero con un lienzo limpio
                </p>
              </div>
            </div>

            <div 
              onClick={() => handleCreateTemplate('crud')}
              className="cursor-pointer p-8 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
            >
              <div className="text-center">
                <Database className="w-12 h-12 text-neutral-400 group-hover:text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  Template CRUD
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Sistema básico con usuarios y posts
                </p>
              </div>
            </div>

            <div 
              onClick={() => handleCreateTemplate('ventas')}
              className="cursor-pointer p-8 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
            >
              <div className="text-center">
                <Database className="w-12 h-12 text-neutral-400 group-hover:text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  Template Ventas
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Sistema de e-commerce completo
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
              Proyectos Recientes
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
                        title="Renombrar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded"
                        title="Duplicar"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      <span className="capitalize">{project.settings.dialect}</span>
                      <span className="bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded-full text-xs">
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
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Abrir Proyecto
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            ¿Cómo funciona?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-neutral-600 dark:text-neutral-400">
            <div>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                1
              </div>
              <p>Crea un nuevo proyecto o utiliza una plantilla predefinida</p>
            </div>
            <div>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                2
              </div>
              <p>Diseña tu esquema arrastrando tablas y definiendo relaciones</p>
            </div>
            <div>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                3
              </div>
              <p>Exporta a SQL, Prisma, TypeORM y otros formatos profesionales</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}