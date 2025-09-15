import type { IRSchema, IREntity, IRAttribute } from '../../ir';
import { validateIRSchema } from '../../ir/validators';
import { pascalCase, camelCase } from 'change-case';

export interface GeneratedFile {
  path: string;
  contents: string;
}

export interface SequelizeOptions {
  dialect?: 'postgres' | 'mysql' | 'mssql' | 'sqlite';
  useDecorators?: boolean;
  generateAssociations?: boolean;
  exportFormat?: 'commonjs' | 'esm';
}

/**
 * Generate Sequelize models from IR Schema
 */
export function toSequelize(
  ir: IRSchema,
  options: SequelizeOptions = {}
): GeneratedFile[] {
  const validated = validateIRSchema(ir);
  const {
    useDecorators = true,
    generateAssociations = true,
    exportFormat = 'esm'
  } = options;

  const files: GeneratedFile[] = [];

  // Generate individual model files
  for (const entity of validated.entities) {
    const modelFile = generateModelFile(entity, {
      useDecorators,
      exportFormat
    });
    files.push(modelFile);
  }

  // Generate associations file if requested
  if (generateAssociations && validated.relations?.length) {
    const associationsFile = generateAssociationsFile(validated, { exportFormat });
    files.push(associationsFile);
  }

  // Generate index file
  const indexFile = generateIndexFile(validated.entities, { exportFormat });
  files.push(indexFile);

  return files;
}

function generateModelFile(
  entity: IREntity,
  options: {
    useDecorators: boolean;
    exportFormat: string;
  }
): GeneratedFile {
  const { useDecorators, exportFormat } = options;
  const className = pascalCase(entity.name);
  const tableName = entity.name;

  let imports = '';
  let classDeclaration = '';
  let attributes = '';
  let modelOptions = '';

  if (useDecorators) {
    // Use sequelize-typescript decorators
    imports = generateDecoratorImports(exportFormat);
    classDeclaration = `@Table({\n  tableName: '${tableName}',\n  timestamps: false\n})\nexport class ${className} extends Model<${className}> {`;
    attributes = generateDecoratorAttributes(entity.attributes || entity.columns);
  } else {
    // Use traditional Sequelize
    imports = generateTraditionalImports(exportFormat);
    classDeclaration = `export class ${className} extends Model<${className}> {\n  static init(sequelize: Sequelize) {`;
    attributes = generateTraditionalAttributes(entity.attributes || entity.columns);
    modelOptions = generateModelOptions(entity);
  }

  const content = `${imports}\n\n${classDeclaration}\n${attributes}\n${modelOptions}\n}`;

  return {
    path: `models/${className}.ts`,
    contents: content
  };
}

function generateDecoratorImports(exportFormat: string): string {
  const importStyle = exportFormat === 'commonjs' ? 'require' : 'import';
  
  if (importStyle === 'import') {
    return `import { Model, Table, Column, DataType, PrimaryKey, AutoIncrement, AllowNull, Unique, ForeignKey, BelongsTo } from 'sequelize-typescript';`;
  } else {
    return `const { Model, Table, Column, DataType, PrimaryKey, AutoIncrement, AllowNull, Unique, ForeignKey, BelongsTo } = require('sequelize-typescript');`;
  }
}

function generateTraditionalImports(exportFormat: string): string {
  const importStyle = exportFormat === 'commonjs' ? 'require' : 'import';
  
  if (importStyle === 'import') {
    return `import { Model, DataTypes, Sequelize } from 'sequelize';`;
  } else {
    return `const { Model, DataTypes } = require('sequelize');`;
  }
}

function generateDecoratorAttributes(attributes: IRAttribute[]): string {
  const lines: string[] = [];
  
  for (const attr of attributes) {
    const decorators: string[] = [];
    
    // Column decorator
    const columnOptions: string[] = [];
    
    if (attr.isPrimaryKey) {
      decorators.push('@PrimaryKey');
      if (isAutoIncrement(attr)) {
        decorators.push('@AutoIncrement');
      }
    }
    
    if (!attr.isOptional) {
      decorators.push('@AllowNull(false)');
    }
    
    if (attr.isUnique) {
      decorators.push('@Unique');
    }
    
    if (attr.references) {
      decorators.push(`@ForeignKey(() => ${pascalCase(attr.references.table)})`);
    }
    
    const dataType = mapToSequelizeType(attr.type);
    columnOptions.push(`type: ${dataType}`);
    
    if (attr.default) {
      const defaultValue = formatDefaultValue(attr.default);
      columnOptions.push(`defaultValue: ${defaultValue}`);
    }
    
    decorators.push(`@Column({ ${columnOptions.join(', ')} })`);
    
    const propertyName = camelCase(attr.name);
    const typeAnnotation = getTypeScriptType(attr.type);
    
    lines.push(`  ${decorators.join('\n  ')}`);
    lines.push(`  ${propertyName}!: ${typeAnnotation};\n`);
  }
  
  return lines.join('\n');
}

function generateTraditionalAttributes(attributes: IRAttribute[]): string {
  const attrs: string[] = [];
  
  for (const attr of attributes) {
    const options: string[] = [];
    
    const dataType = mapToSequelizeType(attr.type);
    options.push(`type: ${dataType}`);
    
    if (attr.isPrimaryKey) {
      options.push('primaryKey: true');
      if (isAutoIncrement(attr)) {
        options.push('autoIncrement: true');
      }
    }
    
    if (!attr.isOptional) {
      options.push('allowNull: false');
    }
    
    if (attr.isUnique) {
      options.push('unique: true');
    }
    
    if (attr.default) {
      const defaultValue = formatDefaultValue(attr.default);
      options.push(`defaultValue: ${defaultValue}`);
    }
    
    if (attr.references) {
      options.push(`references: {\n        model: '${attr.references.table}',\n        key: '${attr.references.column}'\n      }`);
      
      if (attr.references.onDelete) {
        options.push(`onDelete: '${attr.references.onDelete}'`);
      }
      if (attr.references.onUpdate) {
        options.push(`onUpdate: '${attr.references.onUpdate}'`);
      }
    }
    
    attrs.push(`      ${attr.name}: {\n        ${options.join(',\n        ')}\n      }`);
  }
  
  return `    return super.init({\n${attrs.join(',\n')}\n    }, {\n      sequelize,\n      modelName: '${pascalCase(attributes[0]?.name || '')}',\n      timestamps: false\n    });`;
}

function generateModelOptions(entity: IREntity): string {
  const options: string[] = [
    `modelName: '${pascalCase(entity.name)}'`,
    `tableName: '${entity.name}'`,
    'timestamps: false'
  ];
  
  if (entity.indexes?.length) {
    const indexes = entity.indexes.map(idx => {
      const fields = idx.columns.map(col => `'${col}'`).join(', ');
      const unique = idx.unique ? ', unique: true' : '';
      return `{ fields: [${fields}]${unique} }`;
    });
    options.push(`indexes: [${indexes.join(', ')}]`);
  }
  
  return `\n    }, {\n      ${options.join(',\n      ')}\n    });`;
}

function generateAssociationsFile(schema: IRSchema, options: { exportFormat: string }): GeneratedFile {
  const { exportFormat } = options;
  
  let imports = '';
  let associations = '';
  
  const entityNames = schema.entities.map(e => pascalCase(e.name));
  
  if (exportFormat === 'esm') {
    imports = entityNames.map(name => `import { ${name} } from './${name}';`).join('\n');
  } else {
    imports = entityNames.map(name => `const { ${name} } = require('./${name}');`).join('\n');
  }
  
  const associationLines: string[] = [];
  
  for (const relation of schema.relations || []) {
    const sourceClass = pascalCase(relation.sourceEntity);
    const targetClass = pascalCase(relation.targetEntity);
    
    switch (relation.type) {
      case '1-1':
        associationLines.push(`${sourceClass}.hasOne(${targetClass});`);
        associationLines.push(`${targetClass}.belongsTo(${sourceClass});`);
        break;
      case '1-N':
        associationLines.push(`${sourceClass}.hasMany(${targetClass});`);
        associationLines.push(`${targetClass}.belongsTo(${sourceClass});`);
        break;
      case 'N-N':
        associationLines.push(`${sourceClass}.belongsToMany(${targetClass}, { through: '${relation.name || sourceClass + targetClass}' });`);
        associationLines.push(`${targetClass}.belongsToMany(${sourceClass}, { through: '${relation.name || sourceClass + targetClass}' });`);
        break;
    }
  }
  
  associations = associationLines.join('\n');
  
  const content = `${imports}\n\n// Define associations\n${associations}`;
  
  return {
    path: 'models/associations.ts',
    contents: content
  };
}

function generateIndexFile(entities: IREntity[], options: { exportFormat: string }): GeneratedFile {
  const { exportFormat } = options;
  
  const entityNames = entities.map(e => pascalCase(e.name));
  
  let content = '';
  
  if (exportFormat === 'esm') {
    const imports = entityNames.map(name => `export { ${name} } from './${name}';`).join('\n');
    content = `${imports}\nexport * from './associations';`;
  } else {
    const exports = entityNames.map(name => `  ${name}: require('./${name}').${name}`).join(',\n');
    content = `module.exports = {\n${exports}\n};`;
  }
  
  return {
    path: 'models/index.ts',
    contents: content
  };
}

function mapToSequelizeType(sqlType: string): string {
  const type = sqlType.toLowerCase().trim();
  
  // String types
  if (type.includes('varchar')) {
    const lengthMatch = type.match(/\((\d+)\)/);
    return lengthMatch ? `DataTypes.STRING(${lengthMatch[1]})` : 'DataTypes.STRING';
  }
  
  if (type.includes('char') && !type.includes('var')) {
    const lengthMatch = type.match(/\((\d+)\)/);
    return lengthMatch ? `DataTypes.CHAR(${lengthMatch[1]})` : 'DataTypes.CHAR';
  }
  
  if (type.includes('text')) {
    return 'DataTypes.TEXT';
  }
  
  // Integer types
  if (type.includes('bigint')) {
    return 'DataTypes.BIGINT';
  }
  
  if (type.includes('smallint')) {
    return 'DataTypes.SMALLINT';
  }
  
  if (type.includes('int') || type.includes('serial')) {
    return 'DataTypes.INTEGER';
  }
  
  // Decimal types
  if (type.includes('decimal') || type.includes('numeric')) {
    const match = type.match(/\((\d+),(\d+)\)/);
    return match ? `DataTypes.DECIMAL(${match[1]}, ${match[2]})` : 'DataTypes.DECIMAL';
  }
  
  if (type.includes('float') || type.includes('real')) {
    return 'DataTypes.FLOAT';
  }
  
  if (type.includes('double')) {
    return 'DataTypes.DOUBLE';
  }
  
  // Boolean
  if (type.includes('bool')) {
    return 'DataTypes.BOOLEAN';
  }
  
  // Date types
  if (type === 'date') {
    return 'DataTypes.DATEONLY';
  }
  
  if (type.includes('timestamp') || type.includes('datetime')) {
    return 'DataTypes.DATE';
  }
  
  if (type === 'time') {
    return 'DataTypes.TIME';
  }
  
  // UUID
  if (type.includes('uuid')) {
    return 'DataTypes.UUID';
  }
  
  // JSON
  if (type.includes('json')) {
    return 'DataTypes.JSON';
  }
  
  // Binary
  if (type.includes('bytea') || type.includes('blob') || type.includes('binary')) {
    return 'DataTypes.BLOB';
  }
  
  // Array
  if (type.includes('[]')) {
    const baseType = type.replace('[]', '').trim();
    const mappedBase = mapToSequelizeType(baseType);
    return `DataTypes.ARRAY(${mappedBase})`;
  }
  
  // Default fallback
  return 'DataTypes.STRING';
}

function getTypeScriptType(sqlType: string): string {
  const type = sqlType.toLowerCase().trim();
  
  if (type.includes('int') || type.includes('serial') || 
      type.includes('decimal') || type.includes('numeric') ||
      type.includes('float') || type.includes('double') || type.includes('real')) {
    return 'number';
  }
  
  if (type.includes('bool')) {
    return 'boolean';
  }
  
  if (type.includes('date') || type.includes('timestamp') || type.includes('time')) {
    return 'Date';
  }
  
  if (type.includes('json')) {
    return 'any';
  }
  
  if (type.includes('[]')) {
    const baseType = getTypeScriptType(type.replace('[]', '').trim());
    return `${baseType}[]`;
  }
  
  // Default to string
  return 'string';
}

function isAutoIncrement(attr: IRAttribute): boolean {
  return !!(
    attr.type.toLowerCase().includes('serial') ||
    attr.default?.toLowerCase().includes('nextval')
  );
}

function formatDefaultValue(defaultExpr: string): string {
  if (!defaultExpr) return 'null';
  
  const expr = defaultExpr.trim();
  
  // Handle quoted strings
  if ((expr.startsWith("'") && expr.endsWith("'")) || 
      (expr.startsWith('"') && expr.endsWith('"'))) {
    return expr;
  }
  
  // Handle boolean values
  if (expr.toLowerCase() === 'true' || expr.toLowerCase() === 'false') {
    return expr.toLowerCase();
  }
  
  // Handle numbers
  if (/^\d+(\.\d+)?$/.test(expr)) {
    return expr;
  }
  
  // Handle function calls - convert to Sequelize.literal
  if (expr.includes('()') || expr.includes('now') || expr.includes('uuid')) {
    return `Sequelize.literal('${expr}')`;
  }
  
  // Default: wrap in quotes
  return `'${expr}'`;
}