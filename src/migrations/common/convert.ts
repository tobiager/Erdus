import type { IRSchema, IREntity, IRAttribute } from '../../ir';
import type { ParsedSchema, ParsedTable, ParsedColumn } from './normalize';
import { getPostgresType } from '../../ir/mapping';

export function convertParsedSchemaToIR(parsedSchema: ParsedSchema): IRSchema {
  const entities: IREntity[] = [];

  for (const table of parsedSchema.tables) {
    const entity = convertTableToEntity(table);
    entities.push(entity);
  }

  return {
    entities,
    relations: [], // Relations are inferred from foreign keys
    enums: [],
    comment: parsedSchema.comment,
  };
}

function convertTableToEntity(table: ParsedTable): IREntity {
  const attributes: IRAttribute[] = [];

  for (const column of table.columns) {
    const attribute = convertColumnToAttribute(column);
    attributes.push(attribute);
  }

  // Add foreign key references from constraints
  for (const constraint of table.constraints) {
    if (constraint.type === 'foreign_key' && constraint.referencedTable) {
      for (let i = 0; i < constraint.columns.length; i++) {
        const columnName = constraint.columns[i];
        const referencedColumn = constraint.referencedColumns?.[i] || constraint.referencedColumns?.[0] || 'id';
        
        const attribute = attributes.find(attr => attr.name === columnName);
        if (attribute) {
          attribute.references = {
            table: constraint.referencedTable,
            column: referencedColumn,
            onDelete: constraint.onDelete as any,
            onUpdate: constraint.onUpdate as any,
          };
        }
      }
    }
  }

  // Generate indexes from constraints and explicit indexes
  const indexes = table.indexes.map(idx => ({
    name: idx.name,
    columns: idx.columns,
    unique: idx.unique,
    type: idx.type as any,
  }));

  // Add unique constraints as indexes
  for (const constraint of table.constraints) {
    if (constraint.type === 'unique') {
      indexes.push({
        name: `uq_${table.name}_${constraint.columns.join('_')}`,
        columns: constraint.columns,
        unique: true,
        type: 'btree' as any,
      });
    }
  }

  return {
    name: table.name,
    attributes,
    indexes: indexes.length > 0 ? indexes : undefined,
    comment: table.comment,
  };
}

function convertColumnToAttribute(column: ParsedColumn): IRAttribute {
  return {
    name: column.name,
    type: mapTypeToIRType(column.type),
    nullable: column.nullable,
    pk: column.isPrimaryKey,
    unique: column.isUnique,
    default: column.defaultValue,
    precision: column.precision,
    scale: column.scale,
    length: column.length,
  };
}

function mapTypeToIRType(sqlType: string): any {
  const upperType = sqlType.toUpperCase();
  
  // Map SQL types to IR types
  if (upperType.includes('VARCHAR') || upperType.includes('NVARCHAR') || upperType.includes('CHAR')) {
    return 'string';
  }
  if (upperType.includes('TEXT') || upperType.includes('NTEXT')) {
    return 'text';
  }
  if (upperType.includes('INT') && !upperType.includes('BIGINT')) {
    return 'integer';
  }
  if (upperType.includes('BIGINT')) {
    return 'bigint';
  }
  if (upperType.includes('DECIMAL') || upperType.includes('NUMERIC') || upperType.includes('MONEY')) {
    return 'decimal';
  }
  if (upperType.includes('FLOAT') || upperType.includes('DOUBLE') || upperType.includes('REAL')) {
    return 'number';
  }
  if (upperType.includes('BIT') || upperType.includes('BOOLEAN') || upperType.includes('BOOL')) {
    return 'boolean';
  }
  if (upperType.includes('DATE') && !upperType.includes('TIME')) {
    return 'date';
  }
  if (upperType.includes('DATETIME') || upperType.includes('TIMESTAMP')) {
    return 'timestamp';
  }
  if (upperType.includes('TIME')) {
    return 'timestamp';
  }
  if (upperType.includes('UUID') || upperType.includes('UNIQUEIDENTIFIER') || upperType.includes('GUID')) {
    return 'uuid';
  }
  if (upperType.includes('JSON') || upperType.includes('JSONB')) {
    return 'json';
  }
  if (upperType.includes('BINARY') || upperType.includes('VARBINARY') || upperType.includes('IMAGE') || upperType.includes('BLOB')) {
    return 'binary';
  }
  
  // Default to string for unknown types
  return 'string';
}