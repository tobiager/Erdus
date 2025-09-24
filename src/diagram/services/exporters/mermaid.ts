import { ERProject, ERTable, ERColumn } from '../../types';
import { generateMermaidHeader } from '../exportHeader';

export function exportMermaid(project: ERProject): string {
  if (!project.schemas[0]?.tables.length) {
    return generateMermaidHeader(project) + '%% No tables to export\n';
  }

  const header = generateMermaidHeader(project);
  const tables = project.schemas[0].tables;
  
  let mermaid = header;
  
  // ERD directive
  mermaid += 'erDiagram\n';
  
  // Tables and their columns
  for (const table of tables) {
    mermaid += generateMermaidTable(table) + '\n';
  }
  
  // Relationships
  const relationships = generateMermaidRelationships(tables);
  if (relationships) {
    mermaid += '\n' + relationships;
  }
  
  return mermaid.trim();
}

function generateMermaidTable(table: ERTable): string {
  let mermaid = `  ${sanitizeTableName(table.name)} {\n`;
  
  for (const column of table.columns) {
    mermaid += generateMermaidColumn(column);
  }
  
  mermaid += '  }\n';
  
  return mermaid;
}

function generateMermaidColumn(column: ERColumn): string {
  const type = mapMermaidType(column.type);
  let line = `    ${type} ${column.name}`;
  
  // Add column attributes
  const attributes: string[] = [];
  
  if (column.isPrimaryKey) {
    attributes.push('PK');
  }
  
  if (column.references) {
    attributes.push('FK');
  }
  
  if (column.isUnique && !column.isPrimaryKey) {
    attributes.push('UK');
  }
  
  if (!column.isOptional) {
    attributes.push('NOT NULL');
  }
  
  if (column.default) {
    let defaultValue = column.default;
    if (defaultValue === 'now()') {
      defaultValue = 'CURRENT_TIMESTAMP';
    }
    attributes.push(`DEFAULT ${defaultValue}`);
  }
  
  if (attributes.length > 0) {
    line += ` "${attributes.join(', ')}"`;
  }
  
  line += '\n';
  
  return line;
}

function generateMermaidRelationships(tables: ERTable[]): string {
  const relationships: string[] = [];
  
  for (const table of tables) {
    for (const column of table.columns) {
      if (column.references) {
        const sourceTable = sanitizeTableName(table.name);
        const targetTable = sanitizeTableName(column.references.table);
        
        // Determine relationship type based on column properties
        let relationshipType = '||--o{'; // One-to-many by default
        
        if (column.isPrimaryKey) {
          relationshipType = '||--||'; // One-to-one
        } else if (column.isUnique) {
          relationshipType = '||--||'; // One-to-one
        }
        
        const relationship = `  ${targetTable} ${relationshipType} ${sourceTable} : "${column.references.column} -> ${column.name}"`;
        relationships.push(relationship);
      }
    }
  }
  
  return relationships.join('\n');
}

function mapMermaidType(type: string): string {
  const t = type.toLowerCase();
  
  switch (t) {
    case 'serial':
    case 'bigserial':
    case 'integer':
    case 'int':
    case 'bigint':
    case 'smallint':
    case 'tinyint':
      return 'int';
    case 'decimal':
    case 'numeric':
    case 'float':
    case 'real':
    case 'double':
    case 'double precision':
      return 'decimal';
    case 'varchar':
    case 'char':
    case 'text':
    case 'mediumtext':
    case 'longtext':
      return 'string';
    case 'boolean':
    case 'bool':
      return 'boolean';
    case 'date':
      return 'date';
    case 'time':
      return 'time';
    case 'datetime':
    case 'timestamp':
    case 'timestamptz':
      return 'datetime';
    case 'uuid':
      return 'uuid';
    case 'json':
    case 'jsonb':
      return 'json';
    case 'binary':
    case 'varbinary':
    case 'blob':
    case 'bytea':
      return 'blob';
    default:
      return 'string';
  }
}

function sanitizeTableName(name: string): string {
  // Mermaid entity names should not have special characters
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}