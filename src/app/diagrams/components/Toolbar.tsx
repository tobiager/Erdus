import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Minus,
  Undo,
  Redo,
  Search,
  Download,
  Upload,
  Grid3x3,
  PanelLeft,
  PanelRight,
  ArrowLeft,
  Settings,
} from 'lucide-react';
import { DiagramDoc, DiagramEngine } from '../store/db';
import { useT } from '../services/i18n';

interface ToolbarProps {
  diagram: DiagramDoc;
  onEngineChange: (engine: DiagramEngine) => void;
  leftPanelCollapsed: boolean;
  onToggleLeftPanel: () => void;
  rightPanelCollapsed: boolean;
  onToggleRightPanel: () => void;
  onAddTable: () => void;
}

export default function Toolbar({
  diagram,
  onEngineChange,
  leftPanelCollapsed,
  onToggleLeftPanel,
  rightPanelCollapsed,
  onToggleRightPanel,
  onAddTable,
}: ToolbarProps) {
  const { t } = useT();
  const [showEngineMenu, setShowEngineMenu] = useState(false);

  const engines: { value: DiagramEngine; label: string }[] = [
    { value: 'ir', label: 'Default (IR)' },
    { value: 'mssql', label: 'SQL Server' },
    { value: 'mysql', label: 'MySQL' },
    { value: 'postgres', label: 'PostgreSQL' },
    { value: 'sqlite', label: 'SQLite' },
    { value: 'prisma', label: 'Prisma' },
    { value: 'typeorm', label: 'TypeORM' },
  ];

  const currentEngine = engines.find(e => e.value === diagram.meta.engine) || engines[0];

  return (
    <div className="h-14 bg-slate-900 border-b border-slate-700 flex items-center px-4 gap-4">
      {/* Back button */}
      <Link
        to="/diagrams"
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="w-px h-6 bg-slate-700" />

      {/* Panel toggles */}
      <button
        onClick={onToggleLeftPanel}
        className={`p-2 rounded-lg transition-colors ${
          leftPanelCollapsed
            ? 'text-slate-400 hover:text-white hover:bg-slate-800'
            : 'text-blue-400 bg-blue-900/20 hover:bg-blue-900/30'
        }`}
        title={leftPanelCollapsed ? 'Show left panel' : 'Hide left panel'}
      >
        <PanelLeft className="w-4 h-4" />
      </button>

      <button
        onClick={onToggleRightPanel}
        className={`p-2 rounded-lg transition-colors ${
          rightPanelCollapsed
            ? 'text-slate-400 hover:text-white hover:bg-slate-800'
            : 'text-blue-400 bg-blue-900/20 hover:bg-blue-900/30'
        }`}
        title={rightPanelCollapsed ? 'Show right panel' : 'Hide right panel'}
      >
        <PanelRight className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-slate-700" />

      {/* Main actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onAddTable}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          title="Add new table (N)"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Table</span>
        </button>

        <button
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
          title="Add new relation (R)"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Relation</span>
        </button>
      </div>

      <div className="w-px h-6 bg-slate-700" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <button
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-6 bg-slate-700" />

      {/* Tools */}
      <div className="flex items-center gap-1">
        <button
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Search (F)"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Snap to grid"
        >
          <Grid3x3 className="w-4 h-4" />
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Diagram name */}
      <div className="hidden md:flex flex-col items-center">
        <h1 className="text-lg font-semibold text-white">
          {diagram.meta.name}
        </h1>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: diagram.meta.color }}
          />
          <span>{diagram.meta.stats.tables} tables</span>
          <span>•</span>
          <span>{diagram.meta.stats.relations} relations</span>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Engine selector */}
      <div className="relative">
        <button
          onClick={() => setShowEngineMenu(!showEngineMenu)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>{currentEngine.label}</span>
        </button>

        {showEngineMenu && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 rounded-lg shadow-lg border border-slate-700 z-10">
            {engines.map((engine) => (
              <button
                key={engine.value}
                onClick={() => {
                  onEngineChange(engine.value);
                  setShowEngineMenu(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg ${
                  engine.value === diagram.meta.engine
                    ? 'text-blue-400 bg-blue-900/20'
                    : 'text-slate-300'
                }`}
              >
                {engine.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Import/Export */}
      <div className="flex items-center gap-1">
        <button
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Import"
        >
          <Upload className="w-4 h-4" />
        </button>
        <button
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Export"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Click overlay when engine menu is open */}
      {showEngineMenu && (
        <div
          className="fixed inset-0 z-[5]"
          onClick={() => setShowEngineMenu(false)}
        />
      )}
    </div>
  );
}