import Dexie, { Table } from 'dexie';
import { ERProject } from '../../types';

export interface DiagramSnapshot {
  id?: number;
  projectId: string;
  timestamp: number;
  data: ERProject;
}

export class DiagramDB extends Dexie {
  projects!: Table<ERProject, string>;
  snapshots!: Table<DiagramSnapshot, number>;

  constructor() {
    super('ErdusDB');
    
    this.version(1).stores({
      projects: 'id, name, updatedAt, createdAt',
      snapshots: '++id, projectId, timestamp'
    });
  }
}

export const db = new DiagramDB();

// Autosave functionality
export class AutoSave {
  private saveTimeout: NodeJS.Timeout | null = null;
  private readonly SAVE_DELAY = 5000; // 5 seconds

  scheduleAutoSave(project: ERProject) {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(async () => {
      await this.saveProject(project);
      await this.createSnapshot(project);
    }, this.SAVE_DELAY);
  }

  async saveProject(project: ERProject): Promise<void> {
    project.updatedAt = new Date().toISOString();
    await db.projects.put(project);
  }

  async loadProject(id: string): Promise<ERProject | undefined> {
    return await db.projects.get(id);
  }

  async loadAllProjects(): Promise<ERProject[]> {
    return await db.projects.orderBy('updatedAt').reverse().toArray();
  }

  async deleteProject(id: string): Promise<void> {
    await db.projects.delete(id);
    await db.snapshots.where('projectId').equals(id).delete();
  }

  private async createSnapshot(project: ERProject): Promise<void> {
    const snapshot: DiagramSnapshot = {
      projectId: project.id,
      timestamp: Date.now(),
      data: project
    };
    
    await db.snapshots.add(snapshot);
    
    // Keep only last 10 snapshots per project
    const snapshots = await db.snapshots
      .where('projectId')
      .equals(project.id)
      .orderBy('timestamp')
      .toArray();
    
    if (snapshots.length > 10) {
      const toDelete = snapshots.slice(0, snapshots.length - 10);
      await db.snapshots.bulkDelete(toDelete.map(s => s.id!));
    }
  }

  async getSnapshots(projectId: string): Promise<DiagramSnapshot[]> {
    return await db.snapshots
      .where('projectId')
      .equals(projectId)
      .orderBy('timestamp')
      .reverse()
      .toArray();
  }

  cancel() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
  }
}

export const autoSave = new AutoSave();