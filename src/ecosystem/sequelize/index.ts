import type { IRDiagram, IRTable, IRColumn } from '../../ir';

/**
 * Sequelize DataType mapping information
 */
interface SequelizeTypeMapping {
  /** Sequelize DataType import name */
  type: string;
  /** Constructor arguments if needed */
  args?: string[];
  /** Import path for special types */
  importPath?: string;
}

/**
 * Options for Sequelize model generation
 */
export interface SequelizeOptions {
  /** Use TypeScript syntax */
  typescript?: boolean;
  /** Include timestamps (createdAt, updatedAt) */
  timestamps?: boolean;
  /** Include model associations */
  includeAssociations?: boolean;
  /** Table name prefix */
  tablePrefix?: string;
  /** Use underscored field names */
  underscored?: boolean;
  /** Generate model initialization code */
  includeInit?: boolean;
  /** Custom model directory for imports */
  modelDir?: string;
}

/**
 * Sequelize model metadata
 */
interface ModelMeta {
  tableName: string;
  className: string;
  attributes: AttributeMeta[];
  associations: AssociationMeta[];
  imports: Set<string>;
}

interface AttributeMeta {
  name: string;
  sequelizeType: SequelizeTypeMapping;
  options: SequelizeAttributeOptions;
}

interface SequelizeAttributeOptions {
  primaryKey?: boolean;
  autoIncrement?: boolean;
  allowNull?: boolean;
  unique?: boolean;
  defaultValue?: string;
  field?: string;
  references?: {
    model: string;
    key: string;
  };
  onDelete?: string;
  onUpdate?: string;
}

interface AssociationMeta {
  type: 'belongsTo' | 'hasMany' | 'hasOne' | 'belongsToMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  through?: string;
  as?: string;
}

/**
 * Map IR column types to Sequelize DataTypes
 */
function mapColumnTypeToSequelize(irType: string): SequelizeTypeMapping {
  const upperType = irType.toUpperCase();
  
  // Handle SERIAL types
  if (upperType === 'SERIAL') {
    return { type: 'INTEGER' };
  }
  
  if (upperType === 'BIGSERIAL') {
    return { type: 'BIGINT' };
  }
  
  // Integer types
  if (upperType === 'INTEGER' || upperType === 'INT') {
    return { type: 'INTEGER' };
  }
  
  if (upperType === 'BIGINT') {
    return { type: 'BIGINT' };
  }
  
  if (upperType === 'SMALLINT') {
    return { type: 'SMALLINT' };
  }
  
  // Numeric types
  if (upperType.startsWith('DECIMAL') || upperType.startsWith('NUMERIC')) {
    const match = irType.match(/\((\d+),(\d+)\)/);
    if (match) {
      return { type: 'DECIMAL', args: [match[1], match[2]] };
    }
    return { type: 'DECIMAL' };
  }
  
  if (upperType === 'REAL' || upperType === 'FLOAT') {
    return { type: 'REAL' };
  }
  
  if (upperType === 'DOUBLE PRECISION') {
    return { type: 'DOUBLE' };
  }
  
  // Boolean
  if (upperType === 'BOOLEAN' || upperType === 'BOOL') {
    return { type: 'BOOLEAN' };
  }
  
  // String types
  if (upperType.startsWith('VARCHAR')) {
    const match = irType.match(/\((\d+)\)/);
    if (match) {
      return { type: 'STRING', args: [match[1]] };
    }
    return { type: 'STRING' };
  }
  
  if (upperType.startsWith('CHAR')) {
    const match = irType.match(/\((\d+)\)/);
    if (match) {
      return { type: 'CHAR', args: [match[1]] };
    }
    return { type: 'CHAR' };
  }
  
  if (upperType === 'TEXT') {
    return { type: 'TEXT' };
  }
  
  // Date/Time types
  if (upperType.includes('TIMESTAMP')) {
    return { type: 'DATE' };
  }
  
  if (upperType === 'DATE') {
    return { type: 'DATEONLY' };
  }
  
  if (upperType === 'TIME') {
    return { type: 'TIME' };
  }
  
  // UUID
  if (upperType === 'UUID') {
    return { type: 'UUID' };
  }
  
  // JSON
  if (upperType === 'JSON' || upperType === 'JSONB') {
    return { type: 'JSON' };
  }
  
  // Default to STRING for unknown types
  return { type: 'STRING' };
}

/**
 * Convert IR column to Sequelize attribute metadata
 */
function generateAttributeFromColumn(column: IRColumn, options: SequelizeOptions): AttributeMeta {
  const sequelizeType = mapColumnTypeToSequelize(column.type);
  
  const attributeOptions: SequelizeAttributeOptions = {
    allowNull: column.isOptional,
    unique: column.isUnique,
  };
  
  // Handle primary keys
  if (column.isPrimaryKey) {
    attributeOptions.primaryKey = true;
    
    // Auto-increment for SERIAL types
    if (column.type.toUpperCase().includes('SERIAL')) {
      attributeOptions.autoIncrement = true;
    }
  }
  
  // Handle default values
  if (column.default !== undefined) {
    const defaultStr = column.default.toLowerCase();
    if (defaultStr === 'true' || defaultStr === 'false') {
      attributeOptions.defaultValue = defaultStr;
    } else if (!isNaN(Number(defaultStr))) {
      attributeOptions.defaultValue = defaultStr;
    } else if (defaultStr.includes('now()') || defaultStr.includes('current_timestamp')) {
      attributeOptions.defaultValue = 'DataTypes.NOW';
    } else if (defaultStr.startsWith("'") && defaultStr.endsWith("'")) {
      attributeOptions.defaultValue = `'${defaultStr.slice(1, -1)}'`;
    } else {
      attributeOptions.defaultValue = `'${column.default}'`;
    }
  }
  
  // Handle foreign key references
  if (column.references) {
    attributeOptions.references = {
      model: column.references.table,
      key: column.references.column,
    };
    
    if (column.references.onDelete) {
      attributeOptions.onDelete = column.references.onDelete.toUpperCase();
    }
    
    if (column.references.onUpdate) {
      attributeOptions.onUpdate = column.references.onUpdate.toUpperCase();
    }
  }
  
  // Underscore field names if configured
  if (options.underscored && column.name.includes('_')) {
    attributeOptions.field = column.name;
  }
  
  return {
    name: column.name,
    sequelizeType,
    options: attributeOptions,
  };
}

/**
 * Generate associations for a table based on foreign key relationships
 */
function generateAssociationsForTable(
  table: IRTable, 
  allTables: IRTable[], 
  options: SequelizeOptions
): AssociationMeta[] {
  if (!options.includeAssociations) {
    return [];
  }
  
  const associations: AssociationMeta[] = [];
  const tablesByName = new Map(allTables.map(t => [t.name, t]));
  
  // belongsTo associations (this table has foreign keys to others)
  for (const column of table.columns) {
    if (column.references) {
      const targetTable = tablesByName.get(column.references.table);
      if (targetTable) {
        associations.push({
          type: 'belongsTo',
          target: column.references.table,
          foreignKey: column.name,
          as: column.references.table.toLowerCase(),
        });
      }
    }
  }
  
  // hasMany associations (other tables have foreign keys to this table)
  for (const otherTable of allTables) {
    if (otherTable.name === table.name) continue;
    
    for (const column of otherTable.columns) {
      if (column.references?.table === table.name) {
        associations.push({
          type: 'hasMany',
          target: otherTable.name,
          foreignKey: column.name,
          as: `${otherTable.name.toLowerCase()}s`,
        });
      }
    }
  }
  
  return associations;
}

/**
 * Generate Sequelize model class name from table name
 */
function generateModelClassName(tableName: string): string {
  // Convert snake_case or kebab-case to PascalCase
  return tableName
    .split(/[_-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Format Sequelize attribute options as code
 */
function formatAttributeOptions(options: SequelizeAttributeOptions, typescript: boolean): string {
  const parts: string[] = [];
  
  if (options.primaryKey) {
    parts.push('primaryKey: true');
  }
  
  if (options.autoIncrement) {
    parts.push('autoIncrement: true');
  }
  
  if (options.allowNull !== undefined) {
    parts.push(`allowNull: ${options.allowNull}`);
  }
  
  if (options.unique) {
    parts.push('unique: true');
  }
  
  if (options.defaultValue !== undefined) {
    parts.push(`defaultValue: ${options.defaultValue}`);
  }
  
  if (options.field) {
    parts.push(`field: '${options.field}'`);
  }
  
  if (options.references) {
    parts.push(`references: { model: '${options.references.model}', key: '${options.references.key}' }`);
  }
  
  if (options.onDelete) {
    parts.push(`onDelete: '${options.onDelete}'`);
  }
  
  if (options.onUpdate) {
    parts.push(`onUpdate: '${options.onUpdate}'`);
  }
  
  return parts.length > 0 ? `{ ${parts.join(', ')} }` : '';
}

/**
 * Generate Sequelize DataType string with arguments
 */
function formatSequelizeType(typeMapping: SequelizeTypeMapping): string {
  if (typeMapping.args && typeMapping.args.length > 0) {
    return `DataTypes.${typeMapping.type}(${typeMapping.args.join(', ')})`;
  }
  return `DataTypes.${typeMapping.type}`;
}

/**
 * Generate model metadata for a table
 */
function generateModelForTable(
  table: IRTable, 
  allTables: IRTable[], 
  options: SequelizeOptions
): ModelMeta {
  const className = generateModelClassName(table.name);
  const attributes: AttributeMeta[] = [];
  const imports = new Set<string>();
  
  // Add standard Sequelize imports
  imports.add('DataTypes');
  imports.add('Model');
  imports.add('Sequelize');
  
  // Generate attributes
  for (const column of table.columns) {
    attributes.push(generateAttributeFromColumn(column, options));
  }
  
  // Generate associations
  const associations = generateAssociationsForTable(table, allTables, options);
  
  return {
    tableName: table.name,
    className,
    attributes,
    associations,
    imports,
  };
}

/**
 * Generate TypeScript model code
 */
function generateTypeScriptModel(model: ModelMeta, options: SequelizeOptions): string {
  const lines: string[] = [];
  
  // Imports
  const importsArray = Array.from(model.imports).sort();
  lines.push(`import { ${importsArray.join(', ')} } from 'sequelize';`);
  lines.push('');
  
  // Interface for model attributes
  lines.push(`export interface ${model.className}Attributes {`);
  for (const attr of model.attributes) {
    const optional = attr.options.allowNull ? '?' : '';
    const type = getTypeScriptType(attr.sequelizeType);
    lines.push(`  ${attr.name}${optional}: ${type};`);
  }
  lines.push('}');
  lines.push('');
  
  // Model class
  lines.push(`export class ${model.className} extends Model<${model.className}Attributes> implements ${model.className}Attributes {`);
  
  // Declare attributes
  for (const attr of model.attributes) {
    const optional = attr.options.allowNull ? '?' : '!';
    const type = getTypeScriptType(attr.sequelizeType);
    lines.push(`  public ${attr.name}${optional}: ${type};`);
  }
  lines.push('');
  
  // Initialize method
  lines.push(`  public static initialize(sequelize: Sequelize): typeof ${model.className} {`);
  lines.push(`    return ${model.className}.init(`);
  lines.push('      {');
  
  // Attributes definition
  for (const attr of model.attributes) {
    const typeStr = formatSequelizeType(attr.sequelizeType);
    const optionsStr = formatAttributeOptions(attr.options, true);
    
    if (optionsStr) {
      lines.push(`        ${attr.name}: { type: ${typeStr}, ${optionsStr.slice(2, -2)} },`);
    } else {
      lines.push(`        ${attr.name}: ${typeStr},`);
    }
  }
  
  lines.push('      },');
  lines.push('      {');
  lines.push('        sequelize,');
  lines.push(`        tableName: '${options.tablePrefix || ''}${model.tableName}',`);
  
  if (options.timestamps !== false) {
    lines.push('        timestamps: true,');
  } else {
    lines.push('        timestamps: false,');
  }
  
  if (options.underscored) {
    lines.push('        underscored: true,');
  }
  
  lines.push('      }');
  lines.push('    );');
  lines.push('  }');
  
  // Associations
  if (model.associations.length > 0) {
    lines.push('');
    lines.push('  public static associate(models: any): void {');
    for (const assoc of model.associations) {
      const options = assoc.foreignKey ? `{ foreignKey: '${assoc.foreignKey}', as: '${assoc.as}' }` : `{ as: '${assoc.as}' }`;
      lines.push(`    ${model.className}.${assoc.type}(models.${assoc.target}, ${options});`);
    }
    lines.push('  }');
  }
  
  lines.push('}');
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Map Sequelize DataType to TypeScript type
 */
function getTypeScriptType(typeMapping: SequelizeTypeMapping): string {
  switch (typeMapping.type) {
    case 'INTEGER':
    case 'BIGINT':
    case 'SMALLINT':
    case 'DECIMAL':
    case 'REAL':
    case 'DOUBLE':
      return 'number';
    case 'BOOLEAN':
      return 'boolean';
    case 'DATE':
    case 'DATEONLY':
    case 'TIME':
      return 'Date';
    case 'STRING':
    case 'CHAR':
    case 'TEXT':
    case 'UUID':
      return 'string';
    case 'JSON':
      return 'object';
    default:
      return 'any';
  }
}

/**
 * Convert IR diagram to Sequelize v6 TypeScript models
 * 
 * @param diagram - The IR diagram to convert
 * @param options - Configuration options for model generation
 * @returns Generated Sequelize model code
 * 
 * @example
 * ```typescript
 * const diagram: IRDiagram = {
 *   tables: [
 *     {
 *       name: 'User',
 *       columns: [
 *         { name: 'id', type: 'SERIAL', isPrimaryKey: true },
 *         { name: 'name', type: 'VARCHAR(100)' },
 *         { name: 'email', type: 'VARCHAR(255)', isUnique: true }
 *       ]
 *     }
 *   ]
 * };
 * 
 * const models = irToSequelize(diagram, {
 *   typescript: true,
 *   includeAssociations: true
 * });
 * ```
 */
export function irToSequelize(
  diagram: IRDiagram, 
  options: SequelizeOptions = {}
): string {
  const defaultOptions: Required<SequelizeOptions> = {
    typescript: true,
    timestamps: true,
    includeAssociations: true,
    tablePrefix: '',
    underscored: false,
    includeInit: true,
    modelDir: './models',
    ...options,
  };
  
  const models: ModelMeta[] = [];
  
  // Generate model metadata for each table
  for (const table of diagram.tables) {
    models.push(generateModelForTable(table, diagram.tables, defaultOptions));
  }
  
  // Generate model files
  const outputs: string[] = [];
  
  for (const model of models) {
    if (defaultOptions.typescript) {
      outputs.push(`// ${model.className}.ts`);
      outputs.push(generateTypeScriptModel(model, defaultOptions));
    }
  }
  
  // Generate index file with exports and initialization
  if (defaultOptions.includeInit) {
    outputs.push('// index.ts');
    outputs.push("import { Sequelize } from 'sequelize';");
    
    // Import all models
    for (const model of models) {
      outputs.push(`import { ${model.className} } from './${model.className}';`);
    }
    
    outputs.push('');
    outputs.push('export function initializeModels(sequelize: Sequelize): void {');
    
    // Initialize all models
    for (const model of models) {
      outputs.push(`  ${model.className}.initialize(sequelize);`);
    }
    
    outputs.push('');
    outputs.push('  // Set up associations');
    outputs.push('  const models = {');
    for (const model of models) {
      outputs.push(`    ${model.className},`);
    }
    outputs.push('  };');
    outputs.push('');
    
    // Call associate methods
    for (const model of models) {
      if (model.associations.length > 0) {
        outputs.push(`  ${model.className}.associate(models);`);
      }
    }
    
    outputs.push('}');
    outputs.push('');
    
    // Export all models
    for (const model of models) {
      outputs.push(`export { ${model.className} };`);
    }
  }
  
  return outputs.join('\n');
}