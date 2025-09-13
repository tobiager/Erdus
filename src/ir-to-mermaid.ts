import type { IRDiagram, IRColumn } from './ir';

export interface MermaidOptions {
  /** Whether to include attribute details (types, constraints). */
  includeAttributes?: boolean;
  /** Diagram direction: 'TD' (top-down), 'LR' (left-right). */
  direction?: 'TD' | 'LR';
}

/**
 * Convert canonical IR to Mermaid ER diagram format.
 * Mermaid is used for documentation in Markdown files and repositories.
 */
export function irToMermaid(diagram: IRDiagram, opts: MermaidOptions = {}): string {
  const { includeAttributes = true, direction = 'TD' } = opts;
  const lines: string[] = [];
  
  // Start with Mermaid ER diagram declaration
  lines.push(`erDiagram`);
  lines.push('');
  
  // Add each table as an entity
  for (const table of diagram.tables) {
    lines.push(`  ${sanitizeEntityName(table.name)} {`);
    
    if (includeAttributes) {
      for (const col of table.columns) {
        const attrLine = convertAttribute(col);
        lines.push(`    ${attrLine}`);
      }
    }
    
    lines.push('  }');
    lines.push('');
  }

  // Add relationships
  const relationships = extractMermaidRelationships(diagram);
  if (relationships.length > 0) {
    for (const rel of relationships) {
      lines.push(`  ${rel}`);
    }
  }

  return lines.join('\n');
}

function sanitizeEntityName(name: string): string {
  // Mermaid entity names should be valid identifiers
  // Replace spaces and special characters with underscores
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

function convertAttribute(col: IRColumn): string {
  let line = '';
  
  // Add type information
  const type = mapMermaidType(col);
  line += `${type} ${col.name}`;
  
  // Add constraints as comments
  const constraints: string[] = [];
  
  if (col.isPrimaryKey) {
    constraints.push('PK');
  }
  
  if (col.references) {
    constraints.push(`FK`);
  }
  
  if (col.isUnique && !col.isPrimaryKey) {
    constraints.push('UK');
  }
  
  // Primary keys are implicitly NOT NULL in most databases, so we don't need to add it
  if (!col.isOptional && !col.isPrimaryKey) {
    constraints.push('NOT NULL');
  }
  
  if (col.default) {
    if (col.default === 'autoincrement()') {
      constraints.push('AUTO_INCREMENT');
    } else {
      constraints.push(`DEFAULT ${col.default}`);
    }
  }
  
  if (constraints.length > 0) {
    line += ` "${constraints.join(', ')}"`;
  }
  
  return line;
}

function mapMermaidType(col: IRColumn): string {
  // Map IR types to common database types for Mermaid
  switch (col.type) {
    case 'Int':
      return 'int';
    case 'String':
      return 'varchar';
    case 'DateTime':
      return 'timestamp';
    case 'Boolean':
      return 'boolean';
    case 'Float':
    case 'Double':
      return 'decimal';
    default:
      // For SQL types, normalize them
      const lowerType = col.type.toLowerCase();
      if (lowerType.includes('varchar') || lowerType.includes('text')) {
        return 'varchar';
      }
      if (lowerType.includes('int') || lowerType.includes('serial')) {
        return 'int';
      }
      if (lowerType.includes('timestamp') || lowerType.includes('datetime')) {
        return 'timestamp';
      }
      if (lowerType.includes('boolean') || lowerType.includes('bool')) {
        return 'boolean';
      }
      if (lowerType.includes('decimal') || lowerType.includes('numeric') || lowerType.includes('float') || lowerType.includes('double')) {
        return 'decimal';
      }
      // Return as-is for other types
      return col.type.toLowerCase();
  }
}

function extractMermaidRelationships(diagram: IRDiagram): string[] {
  const relationships: string[] = [];
  
  for (const table of diagram.tables) {
    for (const col of table.columns) {
      if (col.references) {
        // Mermaid relationship syntax: ENTITY ||--o{ OTHER_ENTITY : "relationship"
        // We'll use many-to-one as the default relationship type
        const childEntity = sanitizeEntityName(table.name);
        const parentEntity = sanitizeEntityName(col.references.table);
        const relationshipName = `has_${col.name}`;
        
        // Use many-to-one relationship (||--o{)
        const relationship = `${parentEntity} ||--o{ ${childEntity} : "${relationshipName}"`;
        relationships.push(relationship);
      }
    }
  }
  
  return relationships;
}