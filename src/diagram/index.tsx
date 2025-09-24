import React, { useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { useDiagramStore } from './store';
import Sidebar from './ui/Sidebar';
import Canvas from './ui/Canvas';
import Properties from './ui/Properties';
import Toolbar from './ui/Toolbar';
import { autoSave } from './services/autosave';

import 'reactflow/dist/style.css';

export default function DiagramApp() {
  const { project, reset } = useDiagramStore();

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

  return (
    <ReactFlowProvider>
      <div className="h-full w-full flex">
        <aside className="w-72 shrink-0 border-r border-white/10 bg-black/20 backdrop-blur-sm overflow-auto">
          <Sidebar />
        </aside>
        <main className="flex-1 relative overflow-hidden">
          <Toolbar className="absolute top-16 left-1/2 -translate-x-1/2 z-40" />
          <Canvas />
        </main>
        <aside className="w-96 shrink-0 border-l border-white/10 bg-black/20 backdrop-blur-sm overflow-auto">
          <Properties />
        </aside>
      </div>
    </ReactFlowProvider>
  );
}