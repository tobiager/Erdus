import React, { useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelRightClose } from 'lucide-react';
import { useDiagramStore } from './store';
import Sidebar from './ui/Sidebar';
import Canvas from './ui/Canvas';
import Properties from './ui/Properties';
import Toolbar from './ui/Toolbar';
import RecentProjects from './ui/RecentProjects';
import { autoSave } from './services/autosave';

import 'reactflow/dist/style.css';

export default function DiagramApp() {
  const { 
    project, 
    reset, 
    sidebarCollapsed, 
    propertiesCollapsed,
    toggleSidebar,
    toggleProperties 
  } = useDiagramStore();

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      autoSave.cancel();
    };
  }, []);

  useEffect(() => {
    // Handle keyboard shortcuts
    const handleKeyDown = (event: KeyboardEvent) => {
      const { ctrlKey, metaKey, key, shiftKey } = event;
      const isCtrlOrCmd = ctrlKey || metaKey;

      // Prevent default for our shortcuts
      if (isCtrlOrCmd) {
        switch (key) {
          case 's':
            event.preventDefault();
            useDiagramStore.getState().save();
            break;
          case 'z':
            event.preventDefault();
            if (shiftKey) {
              useDiagramStore.getState().redo();
            } else {
              useDiagramStore.getState().undo();
            }
            break;
          case 'n':
            event.preventDefault();
            if (project) {
              useDiagramStore.getState().addTable();
            }
            break;
        }
      }

      // Other shortcuts
      switch (key) {
        case 'Delete':
        case 'Backspace':
          const { selectedTable } = useDiagramStore.getState();
          if (selectedTable) {
            event.preventDefault();
            useDiagramStore.getState().removeTable(selectedTable);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project]);

  // Show recent projects when no project is active
  if (!project) {
    return <RecentProjects />;
  }

  return (
    <ReactFlowProvider>
      <div className="h-full w-full flex">
        {/* Sidebar */}
        <aside className={`${sidebarCollapsed ? 'w-0' : 'w-72'} transition-[width] duration-300 shrink-0 border-r border-neutral-200 dark:border-white/10 bg-white/90 dark:bg-black/20 backdrop-blur-sm overflow-hidden`}>
          {!sidebarCollapsed && <Sidebar />}
        </aside>
        
        {/* Sidebar toggle */}
        <button
          onClick={toggleSidebar}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-50 p-2 bg-white/80 dark:bg-black/80 hover:bg-white dark:hover:bg-black/90 border border-neutral-200 dark:border-white/20 rounded-md backdrop-blur-sm transition-colors"
          title={sidebarCollapsed ? 'Mostrar panel lateral' : 'Ocultar panel lateral'}
        >
          {sidebarCollapsed ? (
            <PanelLeftClose className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
          )}
        </button>

        <main className="flex-1 relative overflow-hidden">
          <Toolbar className="absolute top-4 left-1/2 -translate-x-1/2 z-40" />
          <Canvas />
        </main>

        {/* Properties toggle */}
        <button
          onClick={toggleProperties}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-50 p-2 bg-white/80 dark:bg-black/80 hover:bg-white dark:hover:bg-black/90 border border-neutral-200 dark:border-white/20 rounded-md backdrop-blur-sm transition-colors"
          title={propertiesCollapsed ? 'Mostrar propiedades' : 'Ocultar propiedades'}
        >
          {propertiesCollapsed ? (
            <PanelRightClose className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
          ) : (
            <ChevronRight className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
          )}
        </button>

        {/* Properties */}
        <aside className={`${propertiesCollapsed ? 'w-0' : 'w-96'} transition-[width] duration-300 shrink-0 border-l border-neutral-200 dark:border-white/10 bg-white/90 dark:bg-black/20 backdrop-blur-sm overflow-hidden`}>
          {!propertiesCollapsed && <Properties />}
        </aside>
      </div>
    </ReactFlowProvider>
  );
}