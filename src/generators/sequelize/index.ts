import type { IRSchema, IRDiagram, IRAttribute, IRColumn } from '../../ir';
import { validateIRSchema, validateIRDiagram } from '../../ir/validators';
import { SEQUELIZE_TYPES } from '../../ir/mapping';
import { pascalCase, camelCase } from 'change-case';

export interface GeneratedFile {
  path: string;
  contents: string;
}

export interface SequelizeOptions {
  dialect?: 'postgres' | 'mysql' | 'mssql' | 'sqlite';
  useSequelizeTypescript?: boolean;
  outputDir?: string;
  includeAssociations?: boolean;
  includeIndexes?: boolean;
}

export function toSequelize(
  ir: IRSchema | IRDiagram,
  options: SequelizeOptions = {}
): GeneratedFile[] {
  const opts = {
    dialect: 'postgres' as const,
    useSequelizeTypescript: true,
    outputDir: './models',
    includeAssociations: true,
    includeIndexes: true,
    ...options,
  };

  let files: GeneratedFile[];

  // Handle both new IRSchema and legacy IRDiagram formats
  if ('entities' in ir) {
    const validIR = validateIRSchema(ir);
    files = generateFromIRSchema(validIR, opts);
  } else {
    const validIR = validateIRDiagram(ir);
    files = generateFromIRDiagram(validIR, opts);
  }

  // Add index file
  const entities = 'entities' in ir ? ir.entities : ir.tables;
  files.push(generateIndexFile(entities.map((e: any) => e.name), opts));

  return files;
}

function generateFromIRSchema(ir: IRSchema, options: SequelizeOptions): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  for (const entity of ir.entities) {
    const modelContent = generateEntityModel(entity, ir, options);
    files.push({
      path: `${options.outputDir}/${pascalCase(entity.name)}.ts`,
      contents: modelContent,
    });
  }

  return files;
}

function generateFromIRDiagram(ir: IRDiagram, options: SequelizeOptions): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  for (const table of ir.tables) {
    const modelContent = generateTableModel(table, ir, options);
    files.push({
      path: `${options.outputDir}/${pascalCase(table.name)}.ts`,
      contents: modelContent,
    });
  }

  return files;
}

function generateEntityModel(entity: any, ir: IRSchema, options: SequelizeOptions): string {
  const className = pascalCase(entity.name);
  const tableName = entity.name;

  const imports = generateImports(options);
  const attributes = entity.attributes.map((attr: any) => 
    generateAttributeDefinition(attr, options)
  ).join('\n  ');

  const associations = options.includeAssociations 
    ? generateEntityAssociations(entity, ir, options)
    : '';

  const indexes = options.includeIndexes && entity.indexes
    ? generateIndexes(entity.indexes, options)
    : '';

  return `${imports}

@Table({
  tableName: '${tableName}',${indexes ? `\n  indexes: ${indexes},` : ''}
})
export class ${className} extends Model<${className}> {
  ${attributes}${associations}
}`;
}

function generateTableModel(table: any, ir: IRDiagram, options: SequelizeOptions): string {
  const className = pascalCase(table.name);
  const tableName = table.name;

  const imports = generateImports(options);
  const attributes = table.columns.map((col: any) => 
    generateColumnDefinition(col, options)
  ).join('\n  ');

  const associations = options.includeAssociations 
    ? generateTableAssociations(table, ir, options)
    : '';

  const indexes = options.includeIndexes && table.indexes
    ? generateIndexes(table.indexes, options)
    : '';

  return `${imports}

@Table({
  tableName: '${tableName}',${indexes ? `\n  indexes: ${indexes},` : ''}
})
export class ${className} extends Model<${className}> {
  ${attributes}${associations}
}`;
}

function generateImports(options: SequelizeOptions): string {
  if (options.useSequelizeTypescript) {
    return (
      `import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Unique,
  Default,
  ForeignKey,
  BelongsTo,
  HasMany,
  HasOne,
  BelongsToMany
} from 'sequelize-typescript';`
    );
  }

  return `import { DataTypes, Model, Sequelize } from 'sequelize';`;
}

function generateAttributeDefinition(attr: IRAttribute, options: SequelizeOptions): string {
  const decorators: string[] = [];
  const propName = camelCase(attr.name);
  
  // Column decorator
  const columnOptions: string[] = [];
  
  // Data type
  const dataType = getSequelizeDataType(attr, options);
  columnOptions.push(`type: ${dataType}`);
  
  // Field name if different
  if (propName !== attr.name) {
    columnOptions.push(`field: '${attr.name}'`);
  }

  decorators.push(`@Column({ ${columnOptions.join(', ')} })`);

  // Primary key
  if (attr.pk) {
    decorators.push('@PrimaryKey');
    if (attr.type === 'integer' || attr.type === 'bigint') {
      decorators.push('@AutoIncrement');
    }
  }

  // Nullable
  if (attr.nullable) {
    decorators.push('@AllowNull(true)');
  } else {
    decorators.push('@AllowNull(false)');
  }

  // Unique
  if (attr.unique) {
    decorators.push('@Unique');
  }

  // Default
  if (attr.default) {
    const defaultValue = formatDefaultValue(attr.default, attr.type);
    decorators.push(`@Default(${defaultValue})`);
  }

  // Foreign key
  if (attr.references) {
    const refClass = pascalCase(attr.references.table);
    decorators.push(`@ForeignKey(() => ${refClass})`);
  }

  const typeAnnotation = getTypeScriptType(attr);
  
  return `${decorators.join('\n  ')}\n  ${propName}!: ${typeAnnotation};`;
}

function generateColumnDefinition(column: IRColumn, options: SequelizeOptions): string {
  const decorators: string[] = [];
  const propName = camelCase(column.name);
  
  // Column decorator
  const columnOptions: string[] = [];
  
  // Data type
  const dataType = getSequelizeDataTypeFromString(column.type, options);
  columnOptions.push(`type: ${dataType}`);
  
  // Field name if different
  if (propName !== column.name) {
    columnOptions.push(`field: '${column.name}'`);
  }

  decorators.push(`@Column({ ${columnOptions.join(', ')} })`);

  // Primary key
  if (column.isPrimaryKey) {
    decorators.push('@PrimaryKey');
    if (isIntegerType(column.type)) {
      decorators.push('@AutoIncrement');
    }
  }

  // Nullable
  if (column.isOptional) {
    decorators.push('@AllowNull(true)');
  } else {
    decorators.push('@AllowNull(false)');
  }

  // Unique
  if (column.isUnique) {
    decorators.push('@Unique');
  }

  // Default
  if (column.default) {
    const defaultValue = formatDefaultValue(column.default, 'string');
    decorators.push(`@Default(${defaultValue})`);
  }

  // Foreign key
  if (column.references) {
    const refClass = pascalCase(column.references.table);
    decorators.push(`@ForeignKey(() => ${refClass})`);
  }

  const typeAnnotation = getTypeScriptTypeFromString(column.type);
  
  return `${decorators.join('\n  ')}\n  ${propName}!: ${typeAnnotation};`;
}

function generateEntityAssociations(entity: any, ir: IRSchema, options: SequelizeOptions): string {
  const associations: string[] = [];
  
  // Find relations involving this entity
  for (const relation of ir.relations || []) {
    if (relation.from.entity === entity.name) {
      // This entity is the source
      const targetClass = pascalCase(relation.to.entity);
      const propName = camelCase(relation.to.entity);
      
      if (relation.type === '1-1') {
        associations.push(`
  @HasOne(() => ${targetClass})
  ${propName}!: ${targetClass};`);
      } else if (relation.type === '1-N') {
        associations.push(`
  @HasMany(() => ${targetClass})
  ${propName}!: ${targetClass}[];`);
      } else if (relation.type === 'N-N') {
        const through = relation.junctionTable || `${entity.name}_${relation.to.entity}`;
        associations.push(`
  @BelongsToMany(() => ${targetClass}, () => ${pascalCase(through)})
  ${propName}!: ${targetClass}[];`);
      }
    } else if (relation.to.entity === entity.name) {
      // This entity is the target
      const sourceClass = pascalCase(relation.from.entity);
      const propName = camelCase(relation.from.entity);
      
      if (relation.type === '1-1' || relation.type === '1-N') {
        associations.push(`
  @BelongsTo(() => ${sourceClass})
  ${propName}!: ${sourceClass};`);
      }
    }
  }

  return associations.join('');
}

function generateTableAssociations(table: any, ir: IRDiagram, options: SequelizeOptions): string {
  const associations: string[] = [];
  
  // Find foreign key relationships
  for (const column of table.columns) {
    if (column.references) {
      const refClass = pascalCase(column.references.table);
      const propName = camelCase(column.references.table);
      
      associations.push(`
  @BelongsTo(() => ${refClass})
  ${propName}!: ${refClass};`);
    }
  }

  // Find reverse relationships (hasMany)
  for (const otherTable of ir.tables) {
    if (otherTable.name === table.name) continue;
    
    const fkColumns = otherTable.columns.filter((col: any) => 
      col.references && col.references.table === table.name
    );
    
    if (fkColumns.length > 0) {
      const refClass = pascalCase(otherTable.name);
      const propName = camelCase(otherTable.name);
      
      associations.push(`
  @HasMany(() => ${refClass})
  ${propName}!: ${refClass}[];`);
    }
  }

  return associations.join('');
}

function generateIndexes(indexes: any[], options: SequelizeOptions): string {
  const indexDefs = indexes.map(idx => {
    const fields = idx.columns.map((col: string) => `'${col}'`).join(', ');
    const unique = idx.unique ? ', unique: true' : '';
    const name = idx.name ? `, name: '${idx.name}'` : '';
    
    return `{ fields: [${fields}]${unique}${name} }`;
  });
  
  return `[\n    ${indexDefs.join(',\n    ')}\n  ]`;
}

function getSequelizeDataType(attr: IRAttribute, options: SequelizeOptions): string {
  const baseType = SEQUELIZE_TYPES[attr.type] || 'STRING';
  
  switch (attr.type) {
    case 'string':
      return attr.length ? `DataType.STRING(${attr.length})` : 'DataType.STRING';
    case 'decimal':
      if (attr.precision && attr.scale !== undefined) {
        return `DataType.DECIMAL(${attr.precision}, ${attr.scale})`;
      }
      return 'DataType.DECIMAL';
    default:
      return `DataType.${baseType}`;
  }
}

function getSequelizeDataTypeFromString(typeString: string, options: SequelizeOptions): string {
  const upperType = typeString.toUpperCase();
  
  // Handle VARCHAR with length
  const varcharMatch = upperType.match(/VARCHAR\((\d+)\)/);
  if (varcharMatch) {
    return `DataType.STRING(${varcharMatch[1]})`;
  }
  
  // Handle DECIMAL with precision/scale
  const decimalMatch = upperType.match(/DECIMAL\((\d+),\s*(\d+)\)/);
  if (decimalMatch) {
    return `DataType.DECIMAL(${decimalMatch[1]}, ${decimalMatch[2]})`;
  }
  
  // Map common types
  if (upperType.includes('INT')) return 'DataType.INTEGER';
  if (upperType.includes('BIGINT')) return 'DataType.BIGINT';
  if (upperType.includes('FLOAT') || upperType.includes('DOUBLE')) return 'DataType.FLOAT';
  if (upperType.includes('BOOL')) return 'DataType.BOOLEAN';
  if (upperType.includes('DATE')) return 'DataType.DATE';
  if (upperType.includes('UUID')) return 'DataType.UUID';
  if (upperType.includes('JSON')) return 'DataType.JSON';
  if (upperType.includes('TEXT')) return 'DataType.TEXT';
  
  return 'DataType.STRING';
}

function getTypeScriptType(attr: IRAttribute): string {
  const nullable = attr.nullable ? ' | null' : '';
  
  switch (attr.type) {
    case 'string':
    case 'text':
    case 'uuid':
    case 'date':
    case 'datetime':
    case 'timestamp':
      return `string${nullable}`;
    case 'number':
    case 'decimal':
    case 'integer':
    case 'bigint':
      return `number${nullable}`;
    case 'boolean':
      return `boolean${nullable}`;
    case 'json':
      return `object${nullable}`;
    case 'binary':
      return `Buffer${nullable}`;
    default:
      return `any${nullable}`;
  }
}

function getTypeScriptTypeFromString(typeString: string): string {
  const upperType = typeString.toUpperCase();
  
  if (upperType.includes('INT') || upperType.includes('DECIMAL') || upperType.includes('FLOAT')) {
    return 'number';
  }
  if (upperType.includes('BOOL')) {
    return 'boolean';
  }
  if (upperType.includes('JSON')) {
    return 'object';
  }
  if (upperType.includes('BLOB') || upperType.includes('BINARY')) {
    return 'Buffer';
  }
  
  return 'string';
}

function formatDefaultValue(defaultValue: string, dataType: any): string {
  if (!defaultValue) return 'null';
  
  const lower = defaultValue.toLowerCase().trim();
  
  // Handle special values
  if (lower === 'now()' || lower === 'current_timestamp') {
    return 'DataType.NOW';
  }
  if (lower === 'uuid()' || lower === 'gen_random_uuid()') {
    return 'DataType.UUIDV4';
  }
  
  // Handle boolean
  if (lower === 'true' || lower === 'false') {
    return lower;
  }
  
  // Handle numbers
  if (/^-?\d+(\.\d+)?$/.test(defaultValue)) {
    return defaultValue;
  }
  
  // Handle quoted strings
  if (defaultValue.startsWith("'") && defaultValue.endsWith("'")) {
    return `'${defaultValue.slice(1, -1).replace(/'/g, "\\'")}'`;
  }
  
  // Default to string
  return `'${defaultValue}'`;
}

function isIntegerType(typeString: string): boolean {
  const upperType = typeString.toUpperCase();
  return upperType.includes('INT') && !upperType.includes('FLOAT');
}

function generateIndexFile(entityNames: string[], options: SequelizeOptions): GeneratedFile {
  const imports = entityNames
    .map(name => `import { ${pascalCase(name)} } from './${pascalCase(name)}';`)
    .join('\n');
  
  const exports = entityNames
    .map(name => pascalCase(name))
    .join(',\n  ');

  const content = `${imports}

export {
  ${exports}
};

export const models = [
  ${exports}
];`;

  return {
    path: `${options.outputDir}/index.ts`,
    contents: content,
  };
}