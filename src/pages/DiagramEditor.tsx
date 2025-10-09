/**
 * DiagramEditor - Edit and visualize ER diagrams
 * Part of Erdus - Universal ER Diagram Converter
 * @author tobiager
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Download, Plus, ArrowLeft, Trash2 } from 'lucide-react';
import type { ERDiagram, Entity } from '../diagram-types';
import { createEntity, createAttribute, updateDiagramTimestamp } from '../diagram-utils';
import { formatExportTemplate } from '../export-templates';
import { getDataTypesForLanguage } from '../data-type-mappings';

export default function DiagramEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [diagram, setDiagram] = useState<ERDiagram | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  useEffect(() => {
    // Load diagram from localStorage
    const stored = localStorage.getItem('erdus-diagrams');
    if (stored) {
      try {
        const diagrams = JSON.parse(stored);
        const found = diagrams.find((d: ERDiagram) => d.id === id);
        if (found) {
          // Convert date strings back to Date objects
          found.metadata.createdAt = new Date(found.metadata.createdAt);
          found.metadata.updatedAt = new Date(found.metadata.updatedAt);
          setDiagram(found);
        } else {
          alert('Diagram not found');
          navigate('/diagrams');
        }
      } catch (e) {
        console.error('Failed to load diagram:', e);
        navigate('/diagrams');
      }
    } else {
      navigate('/diagrams');
    }
  }, [id, navigate]);

  const saveDiagram = () => {
    if (!diagram) return;

    updateDiagramTimestamp(diagram);
    
    const stored = localStorage.getItem('erdus-diagrams');
    const diagrams = stored ? JSON.parse(stored) : [];
    const index = diagrams.findIndex((d: ERDiagram) => d.id === diagram.id);
    
    if (index >= 0) {
      diagrams[index] = diagram;
    } else {
      diagrams.push(diagram);
    }
    
    localStorage.setItem('erdus-diagrams', JSON.stringify(diagrams));
    alert('Diagram saved!');
  };

  const handleAddEntity = () => {
    if (!diagram) return;

    const entityName = prompt('Enter entity name:');
    if (!entityName) return;

    const newEntity = createEntity(entityName, {
      x: 100 + diagram.entities.length * 50,
      y: 100 + diagram.entities.length * 30
    });

    setDiagram({
      ...diagram,
      entities: [...diagram.entities, newEntity]
    });
  };

  const handleDeleteEntity = (entityId: string) => {
    if (!diagram) return;
    if (!confirm('Delete this entity?')) return;

    setDiagram({
      ...diagram,
      entities: diagram.entities.filter(e => e.id !== entityId),
      relationships: diagram.relationships.filter(
        r => r.fromEntity !== entityId && r.toEntity !== entityId
      )
    });
    setSelectedEntity(null);
  };

  const handleAddAttribute = (entityId: string) => {
    if (!diagram) return;

    const attrName = prompt('Enter attribute name:');
    if (!attrName) return;

    const entity = diagram.entities.find(e => e.id === entityId);
    if (!entity) return;

    const newAttr = createAttribute(attrName);
    entity.attributes.push(newAttr);

    setDiagram({ ...diagram });
  };

  const handleDeleteAttribute = (entityId: string, attrId: string) => {
    if (!diagram) return;

    const entity = diagram.entities.find(e => e.id === entityId);
    if (!entity) return;

    entity.attributes = entity.attributes.filter(a => a.id !== attrId);
    setDiagram({ ...diagram });
  };

  const handleExportSQL = () => {
    if (!diagram) return;

    const header = formatExportTemplate('sql', {
      diagramName: diagram.name,
      language: diagram.language,
      description: diagram.description || ''
    });

    let sql = header;

    for (const entity of diagram.entities) {
      sql += `CREATE TABLE ${entity.name} (\n`;
      const columns = entity.attributes.map(attr => {
        let line = `  ${attr.name} ${attr.type}`;
        if (attr.length) line += `(${attr.length})`;
        if (attr.isRequired) line += ' NOT NULL';
        if (attr.isAutoIncrement) line += ' AUTO_INCREMENT';
        if (attr.defaultValue) line += ` DEFAULT ${attr.defaultValue}`;
        return line;
      });
      
      if (entity.primaryKey.length > 0) {
        columns.push(`  PRIMARY KEY (${entity.primaryKey.join(', ')})`);
      }
      
      sql += columns.join(',\n');
      sql += '\n);\n\n';
    }

    // Download
    const blob = new Blob([sql], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${diagram.name}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!diagram) {
    return <div className="p-8">Loading...</div>;
  }

  const availableTypes = getDataTypesForLanguage(diagram.language);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/diagrams')}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              title="Back to gallery"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {diagram.name}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {diagram.entities.length} entities · {diagram.language}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddEntity}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Entity
            </button>
            <button
              onClick={saveDiagram}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Save size={18} />
              Save
            </button>
            <button
              onClick={handleExportSQL}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Download size={18} />
              Export SQL
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Canvas area */}
        <div className="flex-1 bg-slate-50 dark:bg-slate-900 p-8 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {diagram.entities.map((entity) => (
              <div
                key={entity.id}
                className={`bg-white dark:bg-slate-800 rounded-lg border-2 p-4 cursor-pointer transition ${
                  selectedEntity?.id === entity.id
                    ? 'border-blue-500'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
                onClick={() => setSelectedEntity(entity)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {entity.name}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEntity(entity.id);
                    }}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600"
                    title="Delete entity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {entity.attributes.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-500 mb-2">
                    No attributes yet
                  </p>
                ) : (
                  <div className="space-y-1 mb-2">
                    {entity.attributes.map((attr) => (
                      <div
                        key={attr.id}
                        className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <div className="flex items-center gap-2">
                          {attr.isPrimaryKey && (
                            <span className="text-xs font-bold text-yellow-600">PK</span>
                          )}
                          {attr.isForeignKey && (
                            <span className="text-xs font-bold text-blue-600">FK</span>
                          )}
                          <span className="text-slate-900 dark:text-white">
                            {attr.name}
                          </span>
                          <span className="text-slate-500 dark:text-slate-500">
                            {attr.type}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAttribute(entity.id, attr.id);
                          }}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600"
                          title="Delete attribute"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddAttribute(entity.id);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Add attribute
                </button>
              </div>
            ))}
          </div>

          {diagram.entities.length === 0 && (
            <div className="text-center py-16">
              <p className="text-slate-500 dark:text-slate-500">
                No entities yet. Click "Add Entity" to get started.
              </p>
            </div>
          )}
        </div>

        {/* Properties panel */}
        {selectedEntity && (
          <div className="w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 p-4 overflow-auto">
            <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">
              Entity Properties
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-white">
                  Name
                </label>
                <input
                  type="text"
                  value={selectedEntity.name}
                  onChange={(e) => {
                    selectedEntity.name = e.target.value;
                    setDiagram({ ...diagram });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-white">
                  Comment
                </label>
                <textarea
                  value={selectedEntity.comment || ''}
                  onChange={(e) => {
                    selectedEntity.comment = e.target.value;
                    setDiagram({ ...diagram });
                  }}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">
                  Attributes ({selectedEntity.attributes.length})
                </label>
                <div className="space-y-2">
                  {selectedEntity.attributes.map((attr) => (
                    <div
                      key={attr.id}
                      className="p-2 border border-slate-200 dark:border-slate-700 rounded"
                    >
                      <div className="font-medium text-slate-900 dark:text-white">
                        {attr.name}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {attr.type}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <label className="flex items-center text-xs">
                          <input
                            type="checkbox"
                            checked={attr.isPrimaryKey}
                            onChange={(e) => {
                              attr.isPrimaryKey = e.target.checked;
                              if (e.target.checked) {
                                if (!selectedEntity.primaryKey.includes(attr.name)) {
                                  selectedEntity.primaryKey.push(attr.name);
                                }
                              } else {
                                selectedEntity.primaryKey = selectedEntity.primaryKey.filter(
                                  pk => pk !== attr.name
                                );
                              }
                              setDiagram({ ...diagram });
                            }}
                            className="mr-1"
                          />
                          PK
                        </label>
                        <label className="flex items-center text-xs">
                          <input
                            type="checkbox"
                            checked={attr.isRequired}
                            onChange={(e) => {
                              attr.isRequired = e.target.checked;
                              setDiagram({ ...diagram });
                            }}
                            className="mr-1"
                          />
                          Required
                        </label>
                        <label className="flex items-center text-xs">
                          <input
                            type="checkbox"
                            checked={attr.isUnique}
                            onChange={(e) => {
                              attr.isUnique = e.target.checked;
                              setDiagram({ ...diagram });
                            }}
                            className="mr-1"
                          />
                          Unique
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-white">
                  Available Data Types
                </label>
                <div className="text-xs text-slate-600 dark:text-slate-400 max-h-40 overflow-auto">
                  {availableTypes.map((type) => (
                    <div key={type} className="py-1">
                      {type}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
