import React, { useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { useDiagramStore } from './store';
import Sidebar from './ui/Sidebar';
import Canvas from './ui/Canvas';
import Properties from './ui/Properties';
import Toolbar from './ui/Toolbar';
import { autoSave } from './services/autosave';

import 'reactflow/dist/style.css';

export default function DiagramEditor() {
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
      <div className="h-full w-full bg-slate-50 dark:bg-slate-900 flex flex-col">
        {/* Toolbar */}
        <div className="h-12 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <Toolbar />
        </div>

        {/* Main Editor */}
        <div className="flex-1 flex">
          {/* Sidebar */}
          <div className="w-80 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <Sidebar />
          </div>

          {/* Canvas */}
          <div className="flex-1 relative">
            <Canvas />
          </div>

          {/* Properties Panel */}
          <div className="w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <Properties />
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
}