import { describe, it, expect, beforeEach } from 'vitest';
import { addTable, softDeleteDiagram, restoreDiagram, purgeDeletedDiagrams } from '../src/app/diagrams/store/diagrams';
import { db, DiagramDoc } from '../src/app/diagrams/store/db';

describe('Diagrams Improvements', () => {
  beforeEach(async () => {
    // Clear database before each test
    await db.diagrams.clear();
  });

  it('should add table with unique name', async () => {
    // Create test diagram
    const testDiagram: DiagramDoc = {
      meta: {
        id: 'test-diagram',
        name: 'Test Diagram',
        engine: 'ir',
        color: '#3b82f6',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: { tables: 0, relations: 0 }
      },
      ir: { tables: [] },
      layout: { nodes: {}, viewport: { x: 0, y: 0, zoom: 1 } }
    };

    await db.diagrams.add(testDiagram);

    // Add first table
    await addTable('test-diagram', { name: 'User', x: 100, y: 100 });
    
    let diagram = await db.diagrams.get('test-diagram');
    expect(diagram?.ir.tables).toHaveLength(1);
    expect(diagram?.ir.tables[0].name).toBe('User');
    expect(diagram?.meta.stats.tables).toBe(1);

    // Add another table with same base name - should get unique name
    await addTable('test-diagram', { name: 'User', x: 200, y: 200 });
    
    diagram = await db.diagrams.get('test-diagram');
    expect(diagram?.ir.tables).toHaveLength(2);
    expect(diagram?.ir.tables[1].name).toBe('User1');
    expect(diagram?.meta.stats.tables).toBe(2);
  });

  it('should soft delete and restore diagram', async () => {
    // Create test diagram
    const testDiagram: DiagramDoc = {
      meta: {
        id: 'test-diagram',
        name: 'Test Diagram',
        engine: 'ir',
        color: '#3b82f6',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: { tables: 0, relations: 0 }
      },
      ir: { tables: [] },
      layout: { nodes: {}, viewport: { x: 0, y: 0, zoom: 1 } }
    };

    await db.diagrams.add(testDiagram);

    // Soft delete
    await softDeleteDiagram('test-diagram');
    
    let diagram = await db.diagrams.get('test-diagram');
    expect(diagram?.meta.deletedAt).toBeTruthy();

    // Restore
    await restoreDiagram('test-diagram');
    
    diagram = await db.diagrams.get('test-diagram');
    expect(diagram?.meta.deletedAt).toBeNull();
  });

  it('should purge old deleted diagrams', async () => {
    // Create test diagram
    const testDiagram: DiagramDoc = {
      meta: {
        id: 'test-diagram',
        name: 'Test Diagram',
        engine: 'ir',
        color: '#3b82f6',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: { tables: 0, relations: 0 },
        deletedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() // 8 days ago
      },
      ir: { tables: [] },
      layout: { nodes: {}, viewport: { x: 0, y: 0, zoom: 1 } }
    };

    await db.diagrams.add(testDiagram);

    // Verify diagram exists
    let diagram = await db.diagrams.get('test-diagram');
    expect(diagram).toBeTruthy();

    // Purge old diagrams (older than 7 days)
    await purgeDeletedDiagrams(7);

    // Verify diagram was purged
    diagram = await db.diagrams.get('test-diagram');
    expect(diagram).toBeFalsy();
  });
});