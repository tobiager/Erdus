import Dexie, { Table } from 'dexie';
import { IRDiagram } from '../../../ir';

export type DiagramEngine = 'ir' | 'mssql' | 'mysql' | 'postgres' | 'sqlite' | 'prisma' | 'typeorm';

export interface DiagramMeta {
  id: string;            // nanoid
  name: string;
  engine: DiagramEngine;
  color: string;         // hex
  createdAt: string;     // ISO
  updatedAt: string;     // ISO
  stats: { tables: number; relations: number };
  description?: string;  // optional description
  deletedAt?: string | null;   // ISO - soft delete
}

export interface DiagramDoc {
  meta: DiagramMeta;
  ir: IRDiagram;         // source of truth
  layout: {              // editor metadata
    nodes: Record<string, { x: number; y: number; color?: string; collapsed?: boolean }>;
    viewport: { x: number; y: number; zoom: number };
  };
}

export class ErdusDB extends Dexie {
  diagrams!: Table<DiagramDoc, string>;

  constructor() {
    super('erdus');
    this.version(1).stores({
      diagrams: 'meta.id, meta.name, meta.engine, meta.updatedAt'
    });
  }
}

export const db = new ErdusDB();