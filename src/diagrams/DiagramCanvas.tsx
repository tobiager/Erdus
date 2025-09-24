import React, { useEffect, useRef } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelRightClose } from 'lucide-react';
import { useDiagramStore } from './store/diagramsStore';
import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import Canvas from '../diagram/ui/Canvas';
import Toolbar from '../diagram/ui/Toolbar';
import { useFitViewportHeight } from '../diagram/hooks/useFitViewportHeight';

import 'reactflow/dist/style.css';

export default function DiagramCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const height = useFitViewportHeight(containerRef);
  
  const { 
    project, 
    sidebarCollapsed, 
    propertiesCollapsed,
    toggleSidebar,
    toggleProperties,
    selectedTable,
    addTable,
    removeTable,
    save,
    undo,
    redo
  } = useDiagramStore();

  useEffect(() => {
    // Handle keyboard shortcuts
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we're typing in an input field
      const target = event.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';
      
      if (isTyping) {
        // Allow normal input behavior, but stop propagation to prevent global shortcuts
        event.stopPropagation();
        return;
      }

      const { ctrlKey, metaKey, key, shiftKey } = event;
      const isCtrlOrCmd = ctrlKey || metaKey;

      // Prevent default for our shortcuts
      if (isCtrlOrCmd) {
        switch (key) {
          case 's':
            event.preventDefault();
            save();
            break;
          case 'z':
            event.preventDefault();
            if (shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'n':
            event.preventDefault();
            if (project) {
              addTable();
            }
            break;
        }
      }

      // Other shortcuts (only when not typing)
      switch (key) {
        case 'Delete':
        case 'Backspace':
          if (selectedTable) {
            event.preventDefault();
            removeTable(selectedTable);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, selectedTable, save, undo, redo, addTable, removeTable]);

  if (!project) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
      style={{ height: height > 0 ? `${height}px` : '100vh' }}
    >
      <ReactFlowProvider>
        <div className="h-full w-full flex">
          {/* Left Sidebar */}
          <aside className={`${sidebarCollapsed ? 'w-0' : 'w-72'} transition-[width] duration-300 shrink-0 border-r border-neutral-200 dark:border-white/10 bg-white/90 dark:bg-black/20 backdrop-blur-sm overflow-hidden`}>
            {!sidebarCollapsed && <SidebarLeft />}
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

          {/* Right Sidebar */}
          <aside className={`${propertiesCollapsed ? 'w-0' : 'w-96'} transition-[width] duration-300 shrink-0 border-l border-neutral-200 dark:border-white/10 bg-white/90 dark:bg-black/20 backdrop-blur-sm overflow-hidden`}>
            {!propertiesCollapsed && <SidebarRight />}
          </aside>
        </div>
      </ReactFlowProvider>
    </div>
  );
}