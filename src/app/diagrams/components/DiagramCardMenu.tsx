import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit3, Copy, Palette, Settings, Download, Trash2 } from 'lucide-react';
import { DiagramDoc } from '../store/db';

interface DiagramCardMenuProps {
  diagram: DiagramDoc;
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onChangeColor: (color: string) => void;
  onChangeEngine: (engine: string) => void;
  onExport: () => void;
  onDelete: () => void;
}

export default function DiagramCardMenu({
  diagram,
  onOpen,
  onRename,
  onDuplicate,
  onChangeColor,
  onChangeEngine,
  onExport,
  onDelete
}: DiagramCardMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEngineSelector, setShowEngineSelector] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Handle keyboard navigation
  useEffect(() => {
    if (!showMenu) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMenu(false);
        buttonRef.current?.focus();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const menuItems = menuRef.current?.querySelectorAll('[role="menuitem"]');
        if (!menuItems) return;

        const currentIndex = Array.from(menuItems).findIndex(item => item === document.activeElement);
        const nextIndex = e.key === 'ArrowDown' 
          ? (currentIndex + 1) % menuItems.length
          : (currentIndex - 1 + menuItems.length) % menuItems.length;
        
        (menuItems[nextIndex] as HTMLElement).focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
  ];

  const engines = [
    { value: 'ir', label: 'Default (IR)' },
    { value: 'mssql', label: 'SQL Server' },
    { value: 'mysql', label: 'MySQL' },
    { value: 'postgres', label: 'PostgreSQL' },
    { value: 'sqlite', label: 'SQLite' },
    { value: 'prisma', label: 'Prisma' },
    { value: 'typeorm', label: 'TypeORM' }
  ];

  const handleMenuClick = (action: () => void) => {
    action();
    setShowMenu(false);
  };

  return (
    <div className="relative z-10">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={showMenu}
        aria-controls={showMenu ? 'diagram-menu' : undefined}
      >
        <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-400" />
      </button>

      {showMenu && (
        <div
          ref={menuRef}
          id="diagram-menu"
          role="menu"
          className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-20 py-1"
        >
          <button
            role="menuitem"
            onClick={() => handleMenuClick(onOpen)}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 focus:bg-slate-50 dark:focus:bg-slate-700 focus:outline-none"
            tabIndex={0}
          >
            <Edit3 className="w-4 h-4" />
            Open
          </button>

          <button
            role="menuitem"
            onClick={() => handleMenuClick(onRename)}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 focus:bg-slate-50 dark:focus:bg-slate-700 focus:outline-none"
            tabIndex={-1}
          >
            <Edit3 className="w-4 h-4" />
            Rename
          </button>

          <button
            role="menuitem"
            onClick={() => handleMenuClick(onDuplicate)}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 focus:bg-slate-50 dark:focus:bg-slate-700 focus:outline-none"
            tabIndex={-1}
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </button>

          <div className="relative">
            <button
              role="menuitem"
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowEngineSelector(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 focus:bg-slate-50 dark:focus:bg-slate-700 focus:outline-none"
              tabIndex={-1}
            >
              <Palette className="w-4 h-4" />
              Change Color
            </button>

            {showColorPicker && (
              <div className="absolute left-full top-0 ml-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-3 z-30">
                <div className="grid grid-cols-4 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        onChangeColor(color);
                        setShowColorPicker(false);
                        setShowMenu(false);
                      }}
                      className="w-6 h-6 rounded-full border-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              role="menuitem"
              onClick={() => {
                setShowEngineSelector(!showEngineSelector);
                setShowColorPicker(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 focus:bg-slate-50 dark:focus:bg-slate-700 focus:outline-none"
              tabIndex={-1}
            >
              <Settings className="w-4 h-4" />
              Change Engine
            </button>

            {showEngineSelector && (
              <div className="absolute left-full top-0 ml-1 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-30 max-h-48 overflow-y-auto">
                {engines.map((engine) => (
                  <button
                    key={engine.value}
                    onClick={() => {
                      onChangeEngine(engine.value);
                      setShowEngineSelector(false);
                      setShowMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 focus:bg-slate-50 dark:focus:bg-slate-700 focus:outline-none ${
                      diagram.meta.engine === engine.value
                        ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {engine.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            role="menuitem"
            onClick={() => handleMenuClick(onExport)}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 focus:bg-slate-50 dark:focus:bg-slate-700 focus:outline-none"
            tabIndex={-1}
          >
            <Download className="w-4 h-4" />
            Export...
          </button>

          <div className="border-t border-slate-200 dark:border-slate-700 my-1" />

          <button
            role="menuitem"
            onClick={() => handleMenuClick(onDelete)}
            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 focus:bg-red-50 dark:focus:bg-red-900/20 focus:outline-none"
            tabIndex={-1}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}

      {/* Overlay to capture clicks outside submenu */}
      {(showColorPicker || showEngineSelector) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowColorPicker(false);
            setShowEngineSelector(false);
          }}
        />
      )}
    </div>
  );
}