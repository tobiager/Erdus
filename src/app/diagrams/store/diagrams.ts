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
      const docs = await db.diagrams.orderBy('meta.updatedAt').reverse().toArray();
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