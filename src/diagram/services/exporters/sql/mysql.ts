import { ERProject, ERTable, ERColumn } from '../../../types';
import { generateSqlHeader } from '../../exportHeader';

export function exportMySQL(project: ERProject): string {
  if (!project.schemas[0]?.tables.length) {
    return generateSqlHeader(project) + '-- No tables to export\n';
  }

  const header = generateSqlHeader(project);
  const tables = project.schemas[0].tables;
  
  // Sort tables by dependencies
  const sortedTables = sortTablesByDependencies(tables);
  
  let sql = header;
  sql += 'SET foreign_key_checks = 0;\n\n';
  
  // Generate CREATE TABLE statements
  for (const table of sortedTables) {
    sql += generateMySQLTable(table) + '\n\n';
  }
  
  sql += 'SET foreign_key_checks = 1;\n';
  
  return sql.trim();
}

function sortTablesByDependencies(tables: ERTable[]): ERTable[] {
  // Simple topological sort
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
    
    if (!foundTable) {
      const table = remaining.shift()!;
      sorted.push(table);
      added.add(table.name);
    }
  }
  
  return sorted;
}

function generateMySQLTable(table: ERTable): string {
  const lines: string[] = [];
  const fkConstraints: string[] = [];
  
  for (const column of table.columns) {
    const sqlType = mapMySQLType(column);
    let line = `  \`${column.name}\` ${sqlType}`;
    
    // Handle auto increment
    if (column.type === 'serial' || (column.isPrimaryKey && column.type === 'int')) {
      line += ' AUTO_INCREMENT';
    }
    
    if (!column.isOptional) line += ' NOT NULL';
    if (column.isUnique && !column.isPrimaryKey) line += ' UNIQUE';
    if (column.default && !line.includes('AUTO_INCREMENT')) {
      line += ` DEFAULT ${column.default}`;
    }
    if (column.check) {
      line += ` CHECK (${column.check})`;
    }
    
    lines.push(line);
    
    // Foreign key constraints
    if (column.references) {
      const onDelete = column.references.onDelete || 'NO ACTION';
      const onUpdate = column.references.onUpdate || 'NO ACTION';
      fkConstraints.push(
        `  CONSTRAINT \`fk_${table.name}_${column.name}\` ` +
        `FOREIGN KEY (\`${column.name}\`) REFERENCES \`${column.references.table}\`(\`${column.references.column}\`) ` +
        `ON DELETE ${onDelete.toUpperCase()} ON UPDATE ${onUpdate.toUpperCase()}`
      );
    }
  }
  
  // Primary key
  const pkColumns = table.columns
    .filter(c => c.isPrimaryKey)
    .map(c => `\`${c.name}\``);
  
  if (pkColumns.length > 0) {
    lines.push(`  PRIMARY KEY (${pkColumns.join(', ')})`);
  } else if (table.primaryKey && table.primaryKey.length > 0) {
    const pkCols = table.primaryKey.map(c => `\`${c}\``).join(', ');
    lines.push(`  PRIMARY KEY (${pkCols})`);
  }
  
  // Add foreign key constraints
  lines.push(...fkConstraints);
  
  let sql = `CREATE TABLE \`${table.name}\` (\n${lines.join(',\n')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
  
  // Table comment
  if (table.comment) {
    const commentIndex = sql.lastIndexOf(';');
    sql = sql.substring(0, commentIndex) + ` COMMENT='${table.comment.replace(/'/g, "\\'")}';`;
  }
  
  return sql;
}

function mapMySQLType(column: ERColumn): string {
  const type = column.type.toLowerCase();
  
  switch (type) {
    case 'serial':
    case 'integer':
    case 'int':
      return 'INT';
    case 'bigint':
      return 'BIGINT';
    case 'smallint':
      return 'SMALLINT';
    case 'tinyint':
      return 'TINYINT';
    case 'mediumint':
      return 'MEDIUMINT';
    case 'decimal':
    case 'numeric':
      return 'DECIMAL(10,0)';
    case 'float':
      return 'FLOAT';
    case 'double':
    case 'double precision':
    case 'real':
      return 'DOUBLE';
    case 'varchar':
      return 'VARCHAR(255)';
    case 'char':
      return 'CHAR(1)';
    case 'text':
      return 'TEXT';
    case 'mediumtext':
      return 'MEDIUMTEXT';
    case 'longtext':
      return 'LONGTEXT';
    case 'boolean':
    case 'bool':
      return 'TINYINT(1)';
    case 'date':
      return 'DATE';
    case 'time':
      return 'TIME';
    case 'datetime':
      return 'DATETIME';
    case 'timestamp':
      return 'TIMESTAMP';
    case 'uuid':
      return 'CHAR(36)';
    case 'json':
      return 'JSON';
    case 'binary':
      return 'BINARY(255)';
    case 'varbinary':
      return 'VARBINARY(255)';
    case 'blob':
      return 'BLOB';
    default:
      return type.toUpperCase();
  }
}