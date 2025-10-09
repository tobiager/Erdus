import { describe, it, expect } from 'vitest';
import {
  createEmptyDiagram,
  createEntity,
  createAttribute,
  createRelationship,
  validateEntityName,
  validateAttributeName,
  findEntityById,
  findEntityByName,
  getEntityRelationships
} from '../src/diagram-utils';

describe('diagram-utils', () => {
  describe('createEmptyDiagram', () => {
    it('should create an empty diagram with default values', () => {
      const diagram = createEmptyDiagram('Test Diagram');
      
      expect(diagram.name).toBe('Test Diagram');
      expect(diagram.language).toBe('default');
      expect(diagram.entities).toEqual([]);
      expect(diagram.relationships).toEqual([]);
      expect(diagram.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
      expect(diagram.metadata.author).toBe('tobiager');
    });

    it('should create a diagram with specified language', () => {
      const diagram = createEmptyDiagram('MySQL Diagram', 'mysql');
      
      expect(diagram.language).toBe('mysql');
    });
  });

  describe('createEntity', () => {
    it('should create an entity with default position', () => {
      const entity = createEntity('User');
      
      expect(entity.name).toBe('User');
      expect(entity.attributes).toEqual([]);
      expect(entity.position).toEqual({ x: 100, y: 100 });
      expect(entity.primaryKey).toEqual([]);
    });

    it('should create an entity with specified position', () => {
      const entity = createEntity('Product', { x: 200, y: 300 });
      
      expect(entity.position).toEqual({ x: 200, y: 300 });
    });
  });

  describe('createAttribute', () => {
    it('should create a non-primary key attribute', () => {
      const attr = createAttribute('email', 'VARCHAR');
      
      expect(attr.name).toBe('email');
      expect(attr.type).toBe('VARCHAR');
      expect(attr.isPrimaryKey).toBe(false);
      expect(attr.isForeignKey).toBe(false);
    });

    it('should create a primary key attribute', () => {
      const attr = createAttribute('id', 'INT', true);
      
      expect(attr.isPrimaryKey).toBe(true);
      expect(attr.isRequired).toBe(true);
      expect(attr.isUnique).toBe(true);
    });
  });

  describe('createRelationship', () => {
    it('should create a relationship with default cardinality', () => {
      const rel = createRelationship('entity1', 'entity2', ['col1'], ['col2']);
      
      expect(rel.fromEntity).toBe('entity1');
      expect(rel.toEntity).toBe('entity2');
      expect(rel.fromColumns).toEqual(['col1']);
      expect(rel.toColumns).toEqual(['col2']);
      expect(rel.fromCardinality).toBe('N');
      expect(rel.toCardinality).toBe('1');
      expect(rel.type).toBe('non-identifying');
    });
  });

  describe('validateEntityName', () => {
    it('should validate correct entity names', () => {
      expect(validateEntityName('User').valid).toBe(true);
      expect(validateEntityName('user_account').valid).toBe(true);
      expect(validateEntityName('Product123').valid).toBe(true);
    });

    it('should reject empty names', () => {
      const result = validateEntityName('');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject names starting with numbers', () => {
      const result = validateEntityName('123User');
      expect(result.valid).toBe(false);
    });

    it('should reject names with special characters', () => {
      const result = validateEntityName('User-Account');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateAttributeName', () => {
    it('should validate correct attribute names', () => {
      expect(validateAttributeName('id').valid).toBe(true);
      expect(validateAttributeName('user_name').valid).toBe(true);
      expect(validateAttributeName('createdAt').valid).toBe(true);
    });

    it('should reject empty names', () => {
      const result = validateAttributeName('');
      expect(result.valid).toBe(false);
    });
  });

  describe('findEntityById', () => {
    it('should find entity by id', () => {
      const diagram = createEmptyDiagram('Test');
      const entity1 = createEntity('User');
      const entity2 = createEntity('Product');
      diagram.entities = [entity1, entity2];

      const found = findEntityById(diagram, entity2.id);
      expect(found).toBe(entity2);
    });

    it('should return undefined for non-existent id', () => {
      const diagram = createEmptyDiagram('Test');
      const found = findEntityById(diagram, 'nonexistent');
      expect(found).toBeUndefined();
    });
  });

  describe('findEntityByName', () => {
    it('should find entity by name', () => {
      const diagram = createEmptyDiagram('Test');
      const entity = createEntity('User');
      diagram.entities = [entity];

      const found = findEntityByName(diagram, 'User');
      expect(found).toBe(entity);
    });

    it('should return undefined for non-existent name', () => {
      const diagram = createEmptyDiagram('Test');
      const found = findEntityByName(diagram, 'NonExistent');
      expect(found).toBeUndefined();
    });
  });

  describe('getEntityRelationships', () => {
    it('should get all relationships for an entity', () => {
      const diagram = createEmptyDiagram('Test');
      const entity1 = createEntity('User');
      const entity2 = createEntity('Product');
      diagram.entities = [entity1, entity2];

      const rel1 = createRelationship(entity1.id, entity2.id, ['id'], ['user_id']);
      const rel2 = createRelationship(entity2.id, entity1.id, ['id'], ['product_id']);
      diagram.relationships = [rel1, rel2];

      const relationships = getEntityRelationships(diagram, entity1.id);
      expect(relationships).toHaveLength(2);
      expect(relationships).toContain(rel1);
      expect(relationships).toContain(rel2);
    });
  });
});
