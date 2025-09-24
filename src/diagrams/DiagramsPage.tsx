import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDiagramStore } from './store/diagramsStore';
import Hub from './Hub';
import DiagramCanvas from './DiagramCanvas';

export default function DiagramsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { project, loadProjectById, isLoading, error } = useDiagramStore();

  useEffect(() => {
    if (id && !project) {
      loadProjectById(id);
    } else if (id && project && project.id !== id) {
      loadProjectById(id);
    }
  }, [id, project, loadProjectById]);

  // Show hub if no ID is provided
  if (!id) {
    return <Hub />;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/diagrams')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Show project not found
  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
        <div className="text-center">
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">Proyecto no encontrado</p>
          <button
            onClick={() => navigate('/diagrams')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Show the diagram canvas
  return <DiagramCanvas />;
}