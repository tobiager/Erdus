import { ERProject, ERTable, ERColumn } from '../../types';
import { generatePrismaHeader } from '../exportHeader';

export function exportPrisma(project: ERProject): string {
  if (!project.schemas[0]?.tables.length) {
    return generatePrismaHeader(project) + '// No tables to export\n';
  }

  const header = generatePrismaHeader(project);
  const tables = project.schemas[0].tables;
  
  let prisma = header;
  
  // Generator and datasource
  prisma += 'generator client {\n';
  prisma += '  provider = "prisma-client-js"\n';
  prisma += '}\n\n';
  
  prisma += 'datasource db {\n';
  prisma += `  provider = "${getPrismaProvider(project.settings.dialect)}"\n`;
  prisma += '  url      = env("DATABASE_URL")\n';
  prisma += '}\n\n';
  
  // Generate models
  for (const table of tables) {
    prisma += generatePrismaModel(table, tables) + '\n\n';
  }
  
  return prisma.trim();
}

function getPrismaProvider(dialect: string): string {
  switch (dialect) {
    case 'postgres':
      return 'postgresql';
    case 'mysql':
      return 'mysql';
    case 'mssql':
      return 'sqlserver';
    case 'sqlite':
      return 'sqlite';
    default:
      return 'postgresql';
  }
}

function generatePrismaModel(table: ERTable, allTables: ERTable[]): string {
  let model = `model ${toPascalCase(table.name)} {\n`;
  
  // Fields
  for (const column of table.columns) {
    model += generatePrismaField(column, table, allTables);
  }
  
  // Model attributes
  const attributes = generatePrismaModelAttributes(table);
  if (attributes) {
    model += `\n${attributes}`;
  }
  
  model += '}';
  
  return model;
}

function generatePrismaField(column: ERColumn, table: ERTable, allTables: ERTable[]): string {
  let field = `  ${column.name}`;
  
  // Field type
  const prismaType = mapPrismaType(column, allTables);
  field += ` ${prismaType}`;
  
  // Field attributes
  const attributes: string[] = [];
  
  if (column.isPrimaryKey) {
    if (column.type === 'serial' || column.default === 'autoincrement()') {
      attributes.push('@id @default(autoincrement())');
    } else {
      attributes.push('@id');
    }
  }
  
  if (column.isUnique && !column.isPrimaryKey) {
    attributes.push('@unique');
  }
  
  if (column.default && !column.isPrimaryKey && column.type !== 'serial') {
    if (column.default === 'now()') {
      attributes.push('@default(now())');
    } else if (column.default === 'uuid()') {
      attributes.push('@default(uuid())');
    } else if (column.default === 'cuid()') {
      attributes.push('@default(cuid())');
    } else {
      // Try to parse the default value
      const defaultValue = parsePrismaDefault(column.default, column.type);
      if (defaultValue) {
        attributes.push(`@default(${defaultValue})`);
      }
    }
  }
  
  if (column.references) {
    // This is handled in the relation section
  }
  
  if (attributes.length > 0) {
    field += ` ${attributes.join(' ')}`;
  }
  
  field += '\n';
  
  // Add relation field if this is a foreign key
  if (column.references) {
    const relationTable = allTables.find(t => t.name === column.references!.table);
    if (relationTable) {
      const relationName = toCamelCase(column.references.table);
      const relationField = `  ${relationName} ${toPascalCase(column.references.table)} @relation(fields: [${column.name}], references: [${column.references.column}])\n`;
      field += relationField;
    }
  }
  
  return field;
}

function generatePrismaModelAttributes(table: ERTable): string {
  const attributes: string[] = [];
  
  // Map directive for table name if different from model name
  if (table.name !== toPascalCase(table.name)) {
    attributes.push(`@@map("${table.name}")`);
  }
  
  return attributes.join('\n  ');
}

function mapPrismaType(column: ERColumn, allTables: ERTable[]): string {
  const type = column.type.toLowerCase();
  let prismaType = '';
  
  // Handle foreign keys
  if (column.references) {
    const relationTable = allTables.find(t => t.name === column.references!.table);
    if (relationTable) {
      const pkColumn = relationTable.columns.find(c => c.name === column.references!.column);
      if (pkColumn) {
        prismaType = mapBasePrismaType(pkColumn.type);
      } else {
        prismaType = 'Int'; // Default
      }
    } else {
      prismaType = 'Int'; // Default
    }
  } else {
    prismaType = mapBasePrismaType(type);
  }
  
  // Add optional modifier
  if (column.isOptional && !column.isPrimaryKey) {
    prismaType += '?';
  }
  
  return prismaType;
}

function mapBasePrismaType(type: string): string {
  switch (type.toLowerCase()) {
    case 'serial':
    case 'integer':
    case 'int':
    case 'smallint':
    case 'tinyint':
      return 'Int';
    case 'bigint':
    case 'bigserial':
      return 'BigInt';
    case 'decimal':
    case 'numeric':
    case 'float':
    case 'real':
    case 'double':
    case 'double precision':
      return 'Decimal';
    case 'varchar':
    case 'char':
    case 'text':
    case 'mediumtext':
    case 'longtext':
      return 'String';
    case 'boolean':
    case 'bool':
      return 'Boolean';
    case 'date':
    case 'datetime':
    case 'timestamp':
    case 'timestamptz':
      return 'DateTime';
    case 'uuid':
      return 'String'; // UUID is represented as String in Prisma
    case 'json':
    case 'jsonb':
      return 'Json';
    case 'binary':
    case 'varbinary':
    case 'blob':
    case 'bytea':
      return 'Bytes';
    default:
      return 'String';
  }
}

function parsePrismaDefault(defaultValue: string, type: string): string | null {
  // Remove quotes if present
  let value = defaultValue.trim();
  
  if (value.startsWith("'") && value.endsWith("'")) {
    value = value.slice(1, -1);
    return `"${value}"`; // String literal
  }
  
  if (value === 'true' || value === 'false') {
    return value;
  }
  
  // Check if it's a number
  if (!isNaN(Number(value))) {
    return value;
  }
  
  // For other values, return as string
  return `"${value}"`;
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function toCamelCase(str: string): string {
  const pascalCase = toPascalCase(str);
  return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
}