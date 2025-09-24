import { ERProject, ERTable, ERColumn } from '../../types';
import { generateDbmlHeader } from '../exportHeader';

export function exportDBML(project: ERProject): string {
  if (!project.schemas[0]?.tables.length) {
    return generateDbmlHeader(project) + '// No tables to export\n';
  }

  const header = generateDbmlHeader(project);
  const tables = project.schemas[0].tables;
  
  let dbml = header;
  
  // Project info
  dbml += `Project "${project.name}" {\n`;
  dbml += `  database_type: '${project.settings.dialect}'\n`;
  dbml += `  Note: '''Exported from Erdus on ${new Date().toISOString()}'''\n`;
  dbml += '}\n\n';
  
  // Tables
  for (const table of tables) {
    dbml += generateDBMLTable(table) + '\n\n';
  }
  
  // References (foreign keys)
  const references = generateDBMLReferences(tables);
  if (references) {
    dbml += references;
  }
  
  return dbml.trim();
}

function generateDBMLTable(table: ERTable): string {
  let dbml = `Table "${table.name}" {\n`;
  
  // Columns
  for (const column of table.columns) {
    dbml += generateDBMLColumn(column, table);
  }
  
  // Indexes
  if (table.indexes && table.indexes.length > 0) {
    dbml += '\n';
    for (const index of table.indexes) {
      const indexCols = index.columns.map(col => `"${col}"`).join(', ');
      const indexType = index.unique ? 'unique' : 'btree';
      dbml += `  Indexes {\n    (${indexCols}) [type: ${indexType}]\n  }\n`;
    }
  }
  
  // Table note (comment)
  if (table.comment) {
    dbml += `\n  Note: '''${table.comment}'''\n`;
  }
  
  dbml += '}';
  
  return dbml;
}

function generateDBMLColumn(column: ERColumn, table: ERTable): string {
  let line = `  "${column.name}" ${mapDBMLType(column)}`;
  
  // Column settings
  const settings: string[] = [];
  
  if (column.isPrimaryKey) {
    settings.push('pk');
  }
  
  if (column.isUnique && !column.isPrimaryKey) {
    settings.push('unique');
  }
  
  if (!column.isOptional) {
    settings.push('not null');
  }
  
  if (column.type === 'serial' || (column.isPrimaryKey && column.default === 'autoincrement()')) {
    settings.push('increment');
  } else if (column.default) {
    let defaultValue = column.default;
    
    // Format default value for DBML
    if (defaultValue === 'now()') {
      defaultValue = '`now()`';
    } else if (defaultValue === 'uuid()') {
      defaultValue = '`uuid()`';
    } else if (!defaultValue.startsWith('`') && isNaN(Number(defaultValue)) && defaultValue !== 'true' && defaultValue !== 'false') {
      // Wrap string values in quotes if not already wrapped in backticks
      if (!defaultValue.startsWith("'") && !defaultValue.startsWith('"')) {
        defaultValue = `'${defaultValue}'`;
      }
    }
    
    settings.push(`default: ${defaultValue}`);
  }
  
  if (settings.length > 0) {
    line += ` [${settings.join(', ')}]`;
  }
  
  line += '\n';
  
  return line;
}

function generateDBMLReferences(tables: ERTable[]): string {
  const references: string[] = [];
  
  for (const table of tables) {
    for (const column of table.columns) {
      if (column.references) {
        let ref = `Ref: "${table.name}"."${column.name}" > "${column.references.table}"."${column.references.column}"`;
        
        // Add referential actions if specified
        const actions: string[] = [];
        if (column.references.onDelete && column.references.onDelete !== 'no action') {
          actions.push(`delete: ${column.references.onDelete.replace(' ', '_')}`);
        }
        if (column.references.onUpdate && column.references.onUpdate !== 'no action') {
          actions.push(`update: ${column.references.onUpdate.replace(' ', '_')}`);
        }
        
        if (actions.length > 0) {
          ref += ` [${actions.join(', ')}]`;
        }
        
        references.push(ref);
      }
    }
  }
  
  if (references.length === 0) {
    return '';
  }
  
  return '// Foreign Key References\n' + references.join('\n') + '\n';
}

function mapDBMLType(column: ERColumn): string {
  const type = column.type.toLowerCase();
  
  switch (type) {
    case 'serial':
      return 'integer';
    case 'bigserial':
      return 'bigint';
    case 'integer':
    case 'int':
      return 'integer';
    case 'bigint':
      return 'bigint';
    case 'smallint':
      return 'smallint';
    case 'tinyint':
      return 'tinyint';
    case 'decimal':
    case 'numeric':
      return 'decimal';
    case 'float':
    case 'real':
      return 'float';
    case 'double':
    case 'double precision':
      return 'double';
    case 'varchar':
      return 'varchar(255)'; // Default length
    case 'char':
      return 'char(1)'; // Default length
    case 'text':
    case 'mediumtext':
    case 'longtext':
      return 'text';
    case 'boolean':
    case 'bool':
      return 'boolean';
    case 'date':
      return 'date';
    case 'time':
      return 'time';
    case 'datetime':
      return 'datetime';
    case 'timestamp':
      return 'timestamp';
    case 'timestamptz':
      return 'timestamptz';
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
      return type;
  }
}