import { ERProject, ERTable, ERColumn } from '../../../types';
import { generateSqlHeader } from '../../exportHeader';

export function exportPostgreSQL(project: ERProject): string {
  if (!project.schemas[0]?.tables.length) {
    return generateSqlHeader(project) + '-- No tables to export\n';
  }

  const header = generateSqlHeader(project);
  const tables = project.schemas[0].tables;
  
  // Sort tables by dependencies (tables without FKs first)
  const sortedTables = sortTablesByDependencies(tables);
  
  let sql = header;
  
  // Generate CREATE TABLE statements
  for (const table of sortedTables) {
    sql += generatePostgreSQLTable(table) + '\n\n';
  }
  
  // Generate foreign key constraints
  for (const table of sortedTables) {
    const fkConstraints = generatePostgreSQLForeignKeys(table);
    if (fkConstraints) {
      sql += fkConstraints + '\n';
    }
  }
  
  return sql.trim();
}

function sortTablesByDependencies(tables: ERTable[]): ERTable[] {
  // Simple topological sort - tables with no FK dependencies first
  const sorted: ERTable[] = [];
  const remaining = [...tables];
  const added = new Set<string>();
  
  while (remaining.length > 0) {
    let foundTable = false;
    
    for (let i = 0; i < remaining.length; i++) {
      const table = remaining[i];
      const hasUnresolvedFK = table.columns.some(col => 
        col.references && !added.has(col.references.table)
      );
      
      if (!hasUnresolvedFK) {
        sorted.push(table);
        added.add(table.name);
        remaining.splice(i, 1);
        foundTable = true;
        break;
      }
    }
    
    // If no table can be added, add the first one to break cycles
    if (!foundTable) {
      const table = remaining.shift()!;
      sorted.push(table);
      added.add(table.name);
    }
  }
  
  return sorted;
}

function generatePostgreSQLTable(table: ERTable): string {
  const lines: string[] = [];
  const fkColumns: ERColumn[] = [];
  
  for (const column of table.columns) {
    const sqlType = mapPostgreSQLType(column);
    let line = `  "${column.name}" ${sqlType}`;
    
    // Handle serial types
    if (column.isPrimaryKey && column.type === 'serial') {
      line += ' PRIMARY KEY';
    } else {
      if (!column.isOptional) line += ' NOT NULL';
      if (column.isUnique && !column.isPrimaryKey) line += ' UNIQUE';
      if (column.default && column.type !== 'serial') {
        line += ` DEFAULT ${column.default}`;
      }
    }
    
    lines.push(line);
    
    if (column.references) {
      fkColumns.push(column);
    }
  }
  
  // Add primary key constraint if not serial
  const pkColumns = table.columns
    .filter(c => c.isPrimaryKey && c.type !== 'serial')
    .map(c => `"${c.name}"`);
  
  if (pkColumns.length > 0) {
    lines.push(`  PRIMARY KEY (${pkColumns.join(', ')})`);
  } else if (table.primaryKey && table.primaryKey.length > 1) {
    const pkCols = table.primaryKey.map(c => `"${c}"`).join(', ');
    lines.push(`  PRIMARY KEY (${pkCols})`);
  }
  
  // Add table comment if present
  let sql = `CREATE TABLE "${table.name}" (\n${lines.join(',\n')}\n);`;
  
  if (table.comment) {
    sql += `\n\nCOMMENT ON TABLE "${table.name}" IS '${table.comment.replace(/'/g, "''")}';`;
  }
  
  return sql;
}

function generatePostgreSQLForeignKeys(table: ERTable): string {
  const fkConstraints: string[] = [];
  
  for (const column of table.columns) {
    if (column.references) {
      const constraintName = `fk_${table.name}_${column.name}`;
      const onDelete = column.references.onDelete || 'NO ACTION';
      const onUpdate = column.references.onUpdate || 'NO ACTION';
      
      fkConstraints.push(
        `ALTER TABLE "${table.name}" ADD CONSTRAINT "${constraintName}" ` +
        `FOREIGN KEY ("${column.name}") REFERENCES "${column.references.table}"("${column.references.column}") ` +
        `ON DELETE ${onDelete.toUpperCase()} ON UPDATE ${onUpdate.toUpperCase()};`
      );
    }
  }
  
  return fkConstraints.join('\n');
}

function mapPostgreSQLType(column: ERColumn): string {
  const type = column.type.toLowerCase();
  
  switch (type) {
    case 'serial':
      return 'SERIAL';
    case 'bigserial':
      return 'BIGSERIAL';
    case 'integer':
    case 'int':
      return 'INTEGER';
    case 'bigint':
      return 'BIGINT';
    case 'smallint':
      return 'SMALLINT';
    case 'decimal':
    case 'numeric':
      return 'DECIMAL';
    case 'real':
      return 'REAL';
    case 'double precision':
      return 'DOUBLE PRECISION';
    case 'varchar':
      return 'VARCHAR(255)'; // Default length
    case 'char':
      return 'CHAR(1)'; // Default length
    case 'text':
      return 'TEXT';
    case 'boolean':
    case 'bool':
      return 'BOOLEAN';
    case 'date':
      return 'DATE';
    case 'time':
      return 'TIME';
    case 'timestamp':
      return 'TIMESTAMP';
    case 'timestamptz':
      return 'TIMESTAMPTZ';
    case 'uuid':
      return 'UUID';
    case 'json':
      return 'JSON';
    case 'jsonb':
      return 'JSONB';
    case 'bytea':
      return 'BYTEA';
    default:
      return type.toUpperCase();
  }
}