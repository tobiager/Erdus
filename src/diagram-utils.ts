/**
 * Utility functions for diagram operations
 * Part of Erdus - Universal ER Diagram Converter
 * @author tobiager
 */

import type { ERDiagram, Entity, Attribute, Relationship, DatabaseLanguage } from './diagram-types';

/**
 * Create a new empty diagram
 */
export function createEmptyDiagram(
  name: string,
  language: DatabaseLanguage = 'default'
): ERDiagram {
  return {
    id: generateId(),
    name,
    description: '',
    language,
    entities: [],
    relationships: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    settings: {
      showDataTypes: true,
      showConstraints: true,
      showIndexes: true,
      showComments: false,
      entityNameCase: 'PascalCase',
      theme: 'auto'
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0.0',
      author: 'tobiager'
    }
  };
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new entity
 */
export function createEntity(
  name: string,
  position: { x: number; y: number } = { x: 100, y: 100 }
): Entity {
  return {
    id: generateId(),
    name,
    attributes: [],
    position,
    size: { width: 200, height: 150 },
    primaryKey: [],
    indexes: [],
    constraints: [],
  };
}

/**
 * Create a new attribute
 */
export function createAttribute(
  name: string,
  type: string = 'VARCHAR',
  isPrimaryKey: boolean = false
): Attribute {
  return {
    id: generateId(),
    name,
    type,
    isPrimaryKey,
    isRequired: isPrimaryKey,
    isUnique: isPrimaryKey,
    isForeignKey: false,
    isAutoIncrement: false
  };
}

/**
 * Create a new relationship
 */
export function createRelationship(
  fromEntity: string,
  toEntity: string,
  fromColumns: string[],
  toColumns: string[]
): Relationship {
  return {
    id: generateId(),
    fromEntity,
    toEntity,
    fromColumns,
    toColumns,
    fromCardinality: 'N',
    toCardinality: '1',
    type: 'non-identifying',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  };
}

/**
 * Validate entity name
 */
export function validateEntityName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Entity name cannot be empty' };
  }
  
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
    return { valid: false, error: 'Entity name must start with a letter and contain only letters, numbers, and underscores' };
  }
  
  return { valid: true };
}

/**
 * Validate attribute name
 */
export function validateAttributeName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Attribute name cannot be empty' };
  }
  
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
    return { valid: false, error: 'Attribute name must start with a letter and contain only letters, numbers, and underscores' };
  }
  
  return { valid: true };
}

/**
 * Find entity by ID
 */
export function findEntityById(diagram: ERDiagram, entityId: string): Entity | undefined {
  return diagram.entities.find(e => e.id === entityId);
}

/**
 * Find entity by name
 */
export function findEntityByName(diagram: ERDiagram, name: string): Entity | undefined {
  return diagram.entities.find(e => e.name === name);
}

/**
 * Get relationships for an entity
 */
export function getEntityRelationships(diagram: ERDiagram, entityId: string): Relationship[] {
  return diagram.relationships.filter(
    r => r.fromEntity === entityId || r.toEntity === entityId
  );
}

/**
 * Update diagram metadata timestamp
 */
export function updateDiagramTimestamp(diagram: ERDiagram): void {
  diagram.metadata.updatedAt = new Date();
}
