import { IRDiagram } from '../../../ir';
import { DiagramEngine } from '../store/db';

/**
 * Export to SQL DDL format
 */
export function toSQL(ir: IRDiagram, engine: DiagramEngine = 'postgres', projectName?: string): string {
  const now = new Date().toISOString();
  const lines: string[] = [];

  // Header comment
  lines.push('-- Generated with Erdus (https://github.com/tobiager/Erdus) — Deploy: https://erdus.app');
  if (projectName) {
    lines.push(`-- Project: ${projectName} | Engine: ${engine} | Exported: ${now}`);
  } else {
    lines.push(`-- Engine: ${engine} | Exported: ${now}`);
  }
  lines.push('');

  // Generate CREATE TABLE statements
  for (const table of ir.tables) {
    lines.push(`CREATE TABLE ${quoteIdentifier(table.name, engine)} (`);
    
    const columnLines = table.columns.map(column => {
      const parts = [`  ${quoteIdentifier(column.name, engine)}`];
      parts.push(mapColumnType(column.type, engine));
      
      if (!column.isOptional) {
        parts.push('NOT NULL');
      }
      
      if (column.isPrimaryKey) {
        parts.push('PRIMARY KEY');
      }
      
      if (column.isUnique && !column.isPrimaryKey) {
        parts.push('UNIQUE');
      }
      
      if (column.default) {
        parts.push(`DEFAULT ${column.default}`);
      }
      
      return parts.join(' ');
    });

    lines.push(columnLines.join(',\n'));
    lines.push(');');
    lines.push('');
  }

  // Generate foreign key constraints
  const foreignKeys: string[] = [];
  ir.tables.forEach(table => {
    table.columns.forEach(column => {
      if (column.references) {
        const constraintName = `fk_${table.name}_${column.name}`.toLowerCase();
        let constraint = `ALTER TABLE ${quoteIdentifier(table.name, engine)} ADD CONSTRAINT ${constraintName}`;
        constraint += ` FOREIGN KEY (${quoteIdentifier(column.name, engine)})`;
        constraint += ` REFERENCES ${quoteIdentifier(column.references.table, engine)} (${quoteIdentifier(column.references.column, engine)})`;
        
        if (column.references.onDelete) {
          constraint += ` ON DELETE ${column.references.onDelete}`;
        }
        if (column.references.onUpdate) {
          constraint += ` ON UPDATE ${column.references.onUpdate}`;
        }
        
        foreignKeys.push(constraint + ';');
      }
    });
  });

  if (foreignKeys.length > 0) {
    lines.push('-- Foreign Key Constraints');
    lines.push(...foreignKeys);
  }

  return lines.join('\n');
}

/**
 * Export to DBML format
 */
export function toDBML(ir: IRDiagram, projectName?: string): string {
  const lines: string[] = [];

  // Header comment
  lines.push('// Generated with Erdus (https://github.com/tobiager/Erdus) — Deploy: https://erdus.app');
  if (projectName) {
    lines.push(`// Project: ${projectName} | Exported: ${new Date().toISOString()}`);
  }
  lines.push('');

  // Generate tables
  for (const table of ir.tables) {
    lines.push(`Table ${table.name} {`);
    
    for (const column of table.columns) {
      const parts = [`  ${column.name} ${column.type}`];
      
      const attributes: string[] = [];
      if (column.isPrimaryKey) attributes.push('pk');
      if (!column.isOptional) attributes.push('not null');
      if (column.isUnique && !column.isPrimaryKey) attributes.push('unique');
      if (column.default) attributes.push(`default: ${column.default}`);
      
      if (attributes.length > 0) {
        parts.push(`[${attributes.join(', ')}]`);
      }
      
      lines.push(parts.join(' '));
    }
    
    lines.push('}');
    lines.push('');
  }

  // Generate relationships
  const relationships: string[] = [];
  ir.tables.forEach(table => {
    table.columns.forEach(column => {
      if (column.references) {
        relationships.push(`Ref: ${table.name}.${column.name} > ${column.references.table}.${column.references.column}`);
      }
    });
  });

  if (relationships.length > 0) {
    lines.push('// Relationships');
    lines.push(...relationships);
  }

  return lines.join('\n');
}

/**
 * Export to Erdus IR JSON format
 */
export function toIR(ir: IRDiagram): string {
  return JSON.stringify(ir, null, 2);
}

// Engine-specific helpers

function quoteIdentifier(name: string, engine: DiagramEngine): string {
  switch (engine) {
    case 'mysql':
      return `\`${name}\``;
    case 'mssql':
      return `[${name}]`;
    case 'sqlite':
    case 'postgres':
    default:
      return `"${name}"`;
  }
}

function mapColumnType(type: string, engine: DiagramEngine): string {
  const lowerType = type.toLowerCase();
  
  // Common mappings
  const commonMappings: Record<string, Record<string, string>> = {
    mysql: {
      'varchar': 'VARCHAR',
      'text': 'TEXT',
      'integer': 'INT',
      'int': 'INT',
      'bigint': 'BIGINT',
      'decimal': 'DECIMAL',
      'float': 'FLOAT',
      'double': 'DOUBLE',
      'boolean': 'BOOLEAN',
      'timestamp': 'TIMESTAMP',
      'datetime': 'DATETIME',
      'date': 'DATE',
      'time': 'TIME',
    },
    postgres: {
      'varchar': 'VARCHAR',
      'text': 'TEXT',
      'integer': 'INTEGER',
      'int': 'INTEGER',
      'bigint': 'BIGINT',
      'decimal': 'DECIMAL',
      'numeric': 'NUMERIC',
      'real': 'REAL',
      'double': 'DOUBLE PRECISION',
      'boolean': 'BOOLEAN',
      'timestamp': 'TIMESTAMP',
      'timestamptz': 'TIMESTAMPTZ',
      'date': 'DATE',
      'time': 'TIME',
      'uuid': 'UUID',
      'json': 'JSON',
      'jsonb': 'JSONB',
    },
    sqlite: {
      'varchar': 'TEXT',
      'text': 'TEXT',
      'integer': 'INTEGER',
      'int': 'INTEGER',
      'bigint': 'INTEGER',
      'decimal': 'REAL',
      'float': 'REAL',
      'double': 'REAL',
      'boolean': 'INTEGER',
      'timestamp': 'TEXT',
      'datetime': 'TEXT',
      'date': 'TEXT',
      'time': 'TEXT',
    },
    mssql: {
      'varchar': 'VARCHAR',
      'text': 'NVARCHAR(MAX)',
      'integer': 'INT',
      'int': 'INT',
      'bigint': 'BIGINT',
      'decimal': 'DECIMAL',
      'float': 'FLOAT',
      'double': 'FLOAT',
      'boolean': 'BIT',
      'timestamp': 'DATETIME2',
      'datetime': 'DATETIME2',
      'date': 'DATE',
      'time': 'TIME',
      'uniqueidentifier': 'UNIQUEIDENTIFIER',
    },
  };

  const engineMappings = commonMappings[engine] || commonMappings.postgres;
  
  // Extract base type (remove size/precision)
  const baseType = lowerType.replace(/\([^)]*\)/, '');
  const mappedType = engineMappings[baseType];
  
  if (mappedType) {
    // If original type had size/precision, preserve it
    const sizeMatch = type.match(/\([^)]*\)/);
    return sizeMatch ? mappedType + sizeMatch[0] : mappedType;
  }
  
  // Return original type if no mapping found
  return type;
}

/**
 * Export to Prisma schema format
 */
export function toPrisma(ir: IRDiagram, projectName?: string): string {
  const lines: string[] = [];

  // Header
  lines.push('// Generated with Erdus (https://github.com/tobiager/Erdus) — Deploy: https://erdus.app');
  if (projectName) {
    lines.push(`// Project: ${projectName} | Exported: ${new Date().toISOString()}`);
  }
  lines.push('');
  
  lines.push('generator client {');
  lines.push('  provider = "prisma-client-js"');
  lines.push('}');
  lines.push('');
  
  lines.push('datasource db {');
  lines.push('  provider = "postgresql"');
  lines.push('  url      = env("DATABASE_URL")');
  lines.push('}');
  lines.push('');

  // Generate models
  for (const table of ir.tables) {
    lines.push(`model ${toPascalCase(table.name)} {`);
    
    for (const column of table.columns) {
      const parts = [`  ${column.name}`];
      parts.push(mapToPrismaType(column.type));
      
      const attributes: string[] = [];
      if (column.isPrimaryKey) attributes.push('@id');
      if (column.isUnique && !column.isPrimaryKey) attributes.push('@unique');
      if (column.default) attributes.push(`@default(${column.default})`);
      if (!column.isOptional && !column.isPrimaryKey) {
        // Prisma assumes required by default unless marked optional with ?
      } else if (column.isOptional && !column.isPrimaryKey) {
        parts[1] += '?';
      }
      
      if (attributes.length > 0) {
        parts.push(attributes.join(' '));
      }
      
      lines.push(parts.join(' '));
    }
    
    lines.push('}');
    lines.push('');
  }

  return lines.join('\n');
}

function toPascalCase(str: string): string {
  return str.replace(/(^\w|_\w)/g, (match) => match.replace('_', '').toUpperCase());
}

function mapToPrismaType(type: string): string {
  const lowerType = type.toLowerCase();
  
  if (lowerType.includes('varchar') || lowerType.includes('text')) return 'String';
  if (lowerType.includes('int') || lowerType.includes('integer')) return 'Int';
  if (lowerType.includes('bigint')) return 'BigInt';
  if (lowerType.includes('decimal') || lowerType.includes('numeric')) return 'Decimal';
  if (lowerType.includes('float') || lowerType.includes('double') || lowerType.includes('real')) return 'Float';
  if (lowerType.includes('boolean') || lowerType.includes('bit')) return 'Boolean';
  if (lowerType.includes('timestamp') || lowerType.includes('datetime') || lowerType.includes('date')) return 'DateTime';
  if (lowerType.includes('uuid')) return 'String'; // @db.Uuid could be added as attribute
  if (lowerType.includes('json')) return 'Json';
  
  return 'String'; // Default fallback
}