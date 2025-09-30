import { useCallback, useEffect, useState } from 'react';
import { nanoid } from 'nanoid';
import { db, DiagramDoc, DiagramMeta, DiagramEngine } from './db';
import { IRDiagram } from '../../../ir';

// Hook for managing diagram list
export function useDiagrams() {
  const [diagrams, setDiagrams] = useState<DiagramDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDiagrams = useCallback(async () => {
    try {
      // Only load non-deleted diagrams
      const docs = await db.diagrams
        .orderBy('meta.updatedAt')
        .reverse()
        .filter(doc => !doc.meta.deletedAt)
        .toArray();
      setDiagrams(docs);
    } catch (error) {
      console.error('Failed to load diagrams:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDiagrams();
  }, [loadDiagrams]);

  const createDiagram = useCallback(async (
    name: string, 
    engine: DiagramEngine = 'ir', 
    description?: string, 
    color: string = '#3b82f6'
  ) => {
    const id = nanoid();
    const now = new Date().toISOString();
    const doc: DiagramDoc = {
      meta: {
        id,
        name,
        engine,
        color,
        createdAt: now,
        updatedAt: now,
        stats: { tables: 0, relations: 0 },
        description
      },
      ir: { tables: [] },
      layout: { nodes: {}, viewport: { x: 0, y: 0, zoom: 1 } }
    };
    
    await db.diagrams.add(doc);
    await loadDiagrams();
    return id;
  }, [loadDiagrams]);

  const deleteDiagram = useCallback(async (id: string) => {
    await db.diagrams.delete(id);
    await loadDiagrams();
  }, [loadDiagrams]);

  // Soft delete - move to trash
  const softDeleteDiagram = useCallback(async (id: string) => {
    const diagram = await db.diagrams.get(id);
    if (!diagram) return;

    const updatedDoc = {
      ...diagram,
      meta: {
        ...diagram.meta,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    await db.diagrams.put(updatedDoc);
    await loadDiagrams();
  }, [loadDiagrams]);

  const duplicateDiagram = useCallback(async (id: string) => {
    const original = await db.diagrams.get(id);
    if (!original) return null;

    const newId = nanoid();
    const now = new Date().toISOString();
    const doc: DiagramDoc = {
      ...original,
      meta: {
        ...original.meta,
        id: newId,
        name: `${original.meta.name} (Copy)`,
        createdAt: now,
        updatedAt: now
      }
    };

    await db.diagrams.add(doc);
    await loadDiagrams();
    return newId;
  }, [loadDiagrams]);

  return {
    diagrams,
    loading,
    createDiagram,
    deleteDiagram,
    softDeleteDiagram,
    duplicateDiagram,
    refreshDiagrams: loadDiagrams
  };
}

// Additional helper functions
export async function renameDiagram(id: string, name: string): Promise<void> {
  const diagram = await db.diagrams.get(id);
  if (!diagram) throw new Error('Diagram not found');

  const updatedDoc = {
    ...diagram,
    meta: {
      ...diagram.meta,
      name,
      updatedAt: new Date().toISOString()
    }
  };

  await db.diagrams.put(updatedDoc);
}

export async function changeColor(id: string, color: string): Promise<void> {
  const diagram = await db.diagrams.get(id);
  if (!diagram) throw new Error('Diagram not found');

  const updatedDoc = {
    ...diagram,
    meta: {
      ...diagram.meta,
      color,
      updatedAt: new Date().toISOString()
    }
  };

  await db.diagrams.put(updatedDoc);
}

export async function changeEngine(id: string, engine: DiagramEngine): Promise<void> {
  const diagram = await db.diagrams.get(id);
  if (!diagram) throw new Error('Diagram not found');

  // TODO: Implement type mapping when changing engines
  // For now, we'll just change the engine without IR transformation
  const updatedDoc = {
    ...diagram,
    meta: {
      ...diagram.meta,
      engine,
      updatedAt: new Date().toISOString()
    }
  };

  await db.diagrams.put(updatedDoc);
}

// Hook for managing individual diagram
export function useDiagram(id: string) {
  const [diagram, setDiagram] = useState<DiagramDoc | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDiagram = useCallback(async () => {
    try {
      const doc = await db.diagrams.get(id);
      setDiagram(doc || null);
    } catch (error) {
      console.error('Failed to load diagram:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDiagram();
  }, [loadDiagram]);

  // Debounced save function
  const saveDiagram = useCallback(
    debounce(async (updatedDoc: DiagramDoc) => {
      try {
        // Recalculate stats
        const stats = {
          tables: updatedDoc.ir.tables.length,
          relations: updatedDoc.ir.tables.reduce((count, table) => 
            count + table.columns.filter(col => col.references).length, 0)
        };

        const docToSave = {
          ...updatedDoc,
          meta: {
            ...updatedDoc.meta,
            updatedAt: new Date().toISOString(),
            stats
          }
        };

        await db.diagrams.put(docToSave);
        setDiagram(docToSave);
      } catch (error) {
        console.error('Failed to save diagram:', error);
      }
    }, 700),
    []
  );

  const updateDiagram = useCallback((updates: Partial<DiagramDoc>) => {
    if (!diagram) return;
    const updatedDiagram = { ...diagram, ...updates };
    setDiagram(updatedDiagram);
    saveDiagram(updatedDiagram);
  }, [diagram, saveDiagram]);

  const updateIR = useCallback((ir: IRDiagram) => {
    updateDiagram({ ir });
  }, [updateDiagram]);

  const updateLayout = useCallback((layout: DiagramDoc['layout']) => {
    updateDiagram({ layout });
  }, [updateDiagram]);

  const updateMeta = useCallback((meta: Partial<DiagramMeta>) => {
    if (!diagram) return;
    updateDiagram({ meta: { ...diagram.meta, ...meta } });
  }, [diagram, updateDiagram]);

  return {
    diagram,
    loading,
    updateIR,
    updateLayout,
    updateMeta,
    refreshDiagram: loadDiagram
  };
}

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  }) as T;
}

// Additional helper functions for trash management
export async function restoreDiagram(id: string): Promise<void> {
  const diagram = await db.diagrams.get(id);
  if (!diagram) throw new Error('Diagram not found');

  const updatedDoc = {
    ...diagram,
    meta: {
      ...diagram.meta,
      deletedAt: null,
      updatedAt: new Date().toISOString()
    }
  };

  await db.diagrams.put(updatedDoc);
}

export async function purgeDeletedDiagrams(thresholdDays: number = 7): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - thresholdDays);
  const cutoffISO = cutoffDate.toISOString();

  const toDelete = await db.diagrams
    .filter(doc => doc.meta.deletedAt && doc.meta.deletedAt < cutoffISO)
    .toArray();

  for (const doc of toDelete) {
    await db.diagrams.delete(doc.meta.id);
  }
}

export async function getDeletedDiagrams(): Promise<DiagramDoc[]> {
  return db.diagrams
    .filter(doc => !!doc.meta.deletedAt)
    .sortBy('meta.deletedAt')
    .then(docs => docs.reverse());
}

// Add table helper function
export async function addTable(
  diagramId: string, 
  partial?: { name?: string; x?: number; y?: number }
): Promise<void> {
  const diagram = await db.diagrams.get(diagramId);
  if (!diagram) throw new Error('Diagram not found');

  // Generate unique table name
  const existingNames = diagram.ir.tables.map(t => t.name);
  let baseName = partial?.name || 'Table';
  let tableName = baseName;
  let counter = 1;
  while (existingNames.includes(tableName)) {
    tableName = `${baseName}${counter}`;
    counter++;
  }

  // Create new table in IR
  const newTable = {
    name: tableName,
    columns: [
      {
        name: 'id',
        type: 'INTEGER',
        isPrimaryKey: true,
        isOptional: false
      }
    ]
  };

  // Add to layout at center of viewport or specified position
  const tableId = `table-${tableName}`;
  const layoutNode = {
    x: partial?.x ?? 250,
    y: partial?.y ?? 250
  };

  const updatedIR = {
    ...diagram.ir,
    tables: [...diagram.ir.tables, newTable]
  };

  const updatedLayout = {
    ...diagram.layout,
    nodes: {
      ...diagram.layout.nodes,
      [tableId]: layoutNode
    }
  };

  // Update stats
  const stats = {
    tables: updatedIR.tables.length,
    relations: updatedIR.tables.reduce((count, table) => 
      count + table.columns.filter(col => col.references).length, 0
    )
  };

  const updatedDoc = {
    ...diagram,
    ir: updatedIR,
    layout: updatedLayout,
    meta: {
      ...diagram.meta,
      stats,
      updatedAt: new Date().toISOString()
    }
  };

  await db.diagrams.put(updatedDoc);
}