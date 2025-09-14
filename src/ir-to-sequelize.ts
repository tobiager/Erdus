import type { IRDiagram, IRTable, IRColumn } from './ir';

interface SequelizeFieldOptions {
  type: string;
  allowNull?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  unique?: boolean;
  defaultValue?: string;
  references?: {
    model: string;
    key: string;
  };
  onUpdate?: string;
  onDelete?: string;
}

function toPascalCase(str: string): string {
  return str
    .split(/[_\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function mapSqlTypeToSequelize(sqlType: string): string {
  const upperType = sqlType.toUpperCase();
  
  // Integer types
  if (upperType.startsWith('BIGINT')) {
    return 'DataTypes.BIGINT';
  }
  if (upperType.startsWith('SMALLINT')) {
    return 'DataTypes.SMALLINT';
  }
  if (upperType.startsWith('INT') || upperType === 'INTEGER') {
    return 'DataTypes.INTEGER';
  }
  if (upperType === 'SERIAL') {
    return 'DataTypes.INTEGER';
  }
  if (upperType === 'BIGSERIAL') {
    return 'DataTypes.BIGINT';
  }
  
  // Decimal/numeric types
  const decimalMatch = upperType.match(/^(DECIMAL|NUMERIC)\((\d+),(\d+)\)$/);
  if (decimalMatch) {
    return `DataTypes.DECIMAL(${decimalMatch[2]}, ${decimalMatch[3]})`;
  }
  if (upperType === 'DECIMAL' || upperType === 'NUMERIC') {
    return 'DataTypes.DECIMAL';
  }
  if (upperType.startsWith('FLOAT') || upperType.startsWith('DOUBLE') || upperType.startsWith('REAL')) {
    return 'DataTypes.FLOAT';
  }
  
  // String types
  const varcharMatch = upperType.match(/^VARCHAR\((\d+)\)$/);
  if (varcharMatch) {
    return `DataTypes.STRING(${varcharMatch[1]})`;
  }
  
  const charMatch = upperType.match(/^CHAR\((\d+)\)$/);
  if (charMatch) {
    return `DataTypes.CHAR(${charMatch[1]})`;
  }
  
  if (upperType === 'TEXT') {
    return 'DataTypes.TEXT';
  }
  
  // Date/time types
  if (upperType === 'DATE') {
    return 'DataTypes.DATEONLY';
  }
  if (upperType === 'DATETIME' || upperType === 'TIMESTAMP' || upperType === 'TIMESTAMPTZ') {
    return 'DataTypes.DATE';
  }
  
  // Boolean type
  if (upperType === 'BOOLEAN' || upperType === 'BOOL') {
    return 'DataTypes.BOOLEAN';
  }
  
  // Default fallback
  return 'DataTypes.STRING';
}

function mapConstraintAction(action: string): string {
  const upperAction = action.toUpperCase();
  if (upperAction === 'NO ACTION') return 'NO ACTION';
  if (upperAction === 'SET NULL') return 'SET NULL';
  if (upperAction === 'SET DEFAULT') return 'SET DEFAULT';
  if (upperAction === 'CASCADE') return 'CASCADE';
  if (upperAction === 'RESTRICT') return 'RESTRICT';
  return upperAction;
}

/**
 * Convert canonical IR to Sequelize model definitions.
 */
export function irToSequelize(diagram: IRDiagram): string {
  const modelDefinitions: string[] = [];
  const associationDefinitions: string[] = [];
  
  // Generate import statement
  const imports = `const { DataTypes } = require('sequelize');`;
  
  // Create a map for easy lookup
  const tableMap = new Map<string, IRTable>(diagram.tables.map(t => [t.name, t]));
  
  for (const table of diagram.tables) {
    const modelName = toPascalCase(table.name);
    const attributes: string[] = [];
    
    for (const column of table.columns) {
      const fieldOptions: SequelizeFieldOptions = {
        type: mapSqlTypeToSequelize(column.type),
        allowNull: !!column.isOptional && !column.isPrimaryKey
      };
      
      if (column.isPrimaryKey) {
        fieldOptions.primaryKey = true;
        
        // Check if it's an auto-incrementing type
        if (column.type.toUpperCase() === 'SERIAL' || column.type.toUpperCase() === 'BIGSERIAL') {
          fieldOptions.autoIncrement = true;
        }
      }
      
      if (column.isUnique && !column.isPrimaryKey) {
        fieldOptions.unique = true;
      }
      
      if (column.default && !column.type.toUpperCase().includes('SERIAL')) {
        fieldOptions.defaultValue = column.default;
      }
      
      // Handle foreign key references
      if (column.references) {
        fieldOptions.references = {
          model: column.references.table,
          key: column.references.column
        };
        
        if (column.references.onUpdate) {
          fieldOptions.onUpdate = mapConstraintAction(column.references.onUpdate);
        }
        
        if (column.references.onDelete) {
          fieldOptions.onDelete = mapConstraintAction(column.references.onDelete);
        }
      }
      
      // Build the field definition
      const optionsString = Object.entries(fieldOptions)
        .map(([key, value]) => {
          if (key === 'type') {
            return `type: ${value}`;
          }
          if (typeof value === 'boolean') {
            return `${key}: ${value}`;
          }
          if (typeof value === 'object' && value !== null) {
            const nestedOptions = Object.entries(value)
              .map(([nestedKey, nestedValue]) => `${nestedKey}: '${nestedValue}'`)
              .join(', ');
            return `${key}: { ${nestedOptions} }`;
          }
          return `${key}: '${value}'`;
        })
        .join(',\n      ');
      
      attributes.push(`    ${column.name}: {\n      ${optionsString}\n    }`);
    }
    
    // Generate the model definition
    const modelDefinition = `
const ${modelName} = sequelize.define('${modelName}', {
${attributes.join(',\n')}
}, {
  tableName: '${table.name}',
  timestamps: false // Set to true if you want createdAt/updatedAt
});`;
    
    modelDefinitions.push(modelDefinition);
    
    // Generate associations for foreign keys
    for (const column of table.columns) {
      if (column.references) {
        const referencedTable = tableMap.get(column.references.table);
        if (referencedTable) {
          const referencedModelName = toPascalCase(referencedTable.name);
          
          // belongsTo relationship (many-to-one from current table perspective)
          const belongsToAlias = toCamelCase(referencedTable.name);
          associationDefinitions.push(
            `${modelName}.belongsTo(${referencedModelName}, { foreignKey: '${column.name}', as: '${belongsToAlias}' });`
          );
          
          // hasMany relationship (one-to-many from referenced table perspective)
          const hasManyAlias = toCamelCase(table.name) + 's';
          associationDefinitions.push(
            `${referencedModelName}.hasMany(${modelName}, { foreignKey: '${column.name}', as: '${hasManyAlias}' });`
          );
        }
      }
    }
  }
  
  // Add indexes if any
  const indexDefinitions: string[] = [];
  for (const table of diagram.tables) {
    if (table.indexes && table.indexes.length > 0) {
      const modelName = toPascalCase(table.name);
      for (const index of table.indexes) {
        const fields = index.columns.map(col => `'${col}'`).join(', ');
        const uniqueOption = index.unique ? ', unique: true' : '';
        indexDefinitions.push(
          `${modelName}.addIndex({ fields: [${fields}]${uniqueOption} });`
        );
      }
    }
  }
  
  // Combine all parts
  const result = [
    imports,
    '',
    '// Assuming you have a sequelize instance available',
    '// const sequelize = new Sequelize(...);',
    '',
    ...modelDefinitions,
    '',
    '// Associations',
    ...associationDefinitions,
    '',
    '// Indexes',
    ...indexDefinitions,
    '',
    '// Export models',
    `module.exports = {`,
    ...diagram.tables.map(table => `  ${toPascalCase(table.name)}`),
    '};'
  ].join('\n');
  
  return result;
}