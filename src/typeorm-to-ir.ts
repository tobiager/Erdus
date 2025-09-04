import { IRDiagram, IRTable, IRColumn } from './ir';

/** Minimal parser for TypeORM entity classes */
export function typeormToIR(source: string): IRDiagram {
  const tables: IRTable[] = [];
  const classToTableMap = new Map<string, string>();
  const entityRegex = /@Entity\s*\(\s*['"](.*?)['"]\s*\)\s*(?:@Index.*?\s*)*export\s+class\s+(\w+)\s*{([\s\S]*?)^}/gm;
  let match: RegExpExecArray | null;
  while ((match = entityRegex.exec(source))) {
    const tableName = match[1] || match[2];
    const className = match[2];
    classToTableMap.set(className, tableName);
    const body = match[3];
    const columns: IRColumn[] = [];
    const relations: { property: string; targetEntity: string; joinColumn?: string; nullable?: boolean }[] = [];
    const lines = body.split(/\n/).map(l => l.trim()).filter(l => l && !l.startsWith('//'));
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line || line.startsWith('//')) {
        i++;
        continue;
      }
      if (line.includes(':') && line.endsWith(';')) {
        const decorators: string[] = [];
        let j = i - 1;
        while (j >= 0 && lines[j].startsWith('@')) {
          decorators.unshift(lines[j]);
          j--;
        }
        const propDeclaration = line;
        const [propName, propType] = propDeclaration.split(':').map(s => s.trim());
        const cleanPropName = propName.trim();
        const cleanPropType = propType.replace(';', '').trim();
        const isManyToOne = decorators.some(d => d.includes('@ManyToOne'));
        const isOneToMany = decorators.some(d => d.includes('@OneToMany'));
        const isPrimaryColumn = decorators.some(d => d.includes('@PrimaryColumn'));
        const isPrimaryGenerated = decorators.some(d => d.includes('@PrimaryGeneratedColumn'));
        if ((isPrimaryColumn || isPrimaryGenerated) && !decorators.some(d => d.includes('@Column'))) {
          const col = parseColumn(cleanPropName, cleanPropType, decorators);
          if (col) {
            columns.push(col);
          }
        } else if (isManyToOne) {
          const joinColumnDecorator = decorators.find(d => d.includes('@JoinColumn'));
          let joinColumn: string | undefined;
          if (joinColumnDecorator) {
            const match = joinColumnDecorator.match(/name:\s*['"](.*?)['"]/);
            joinColumn = match ? match[1] : undefined;
          }
          const nullable = decorators.some(d => d.includes('nullable: true')) || cleanPropType.includes('| null');
          // Extract the target entity class name from function expression like () => Cliente
          let targetEntityClass = cleanPropType.replace(/\s*\|\s*null/, '');
          const functionMatch = targetEntityClass.match(/\(\)\s*=>\s*(\w+)/);
          if (functionMatch) {
            targetEntityClass = functionMatch[1];
          }
          relations.push({
            property: cleanPropName,
            targetEntity: targetEntityClass,
            joinColumn,
            nullable
          });
        } else if (!isOneToMany) {
          const col = parseColumn(cleanPropName, cleanPropType, decorators);
          if (col) {
            columns.push(col);
          }
        }
      }
      i++;
    }
    
    for (const rel of relations) {
      if (rel.joinColumn) {
        const existingCol = columns.find(c => c.name === rel.joinColumn);
        // Map class name to table name
        const targetTableName = classToTableMap.get(rel.targetEntity) || rel.targetEntity;
        if (!existingCol) {
          columns.push({
            name: rel.joinColumn,
            type: 'INT',
            isPrimaryKey: false, // Foreign key columns are not primary keys by default
            isOptional: rel.nullable,
            isUnique: false, // Foreign key columns are not unique by default
            references: {
              table: targetTableName,
              column: 'id'
            }
          });
        } else {
          existingCol.references = {
            table: targetTableName,
            column: 'id'
          };
        }
      }
    }
    tables.push({
      name: tableName,
      columns
    });
  }
  
  return { tables };
}

function parseColumn(name: string, typeAnnotation: string, decorators: string[]): IRColumn | null {
  const isOptional = typeAnnotation.includes('| null') || typeAnnotation.endsWith('?');
  const baseType = typeAnnotation.replace(/\s*\|\s*null/, '').replace('?', '').trim();
  const columnDecorator = decorators.find(d => d.includes('@Column') || d.includes('@PrimaryColumn') || d.includes('@PrimaryGeneratedColumn'));
  const isPrimaryKey = decorators.some(d => d.includes('@PrimaryColumn') || d.includes('@PrimaryGeneratedColumn'));
  const primaryGenDecorator = decorators.find(d => d.includes('@PrimaryGeneratedColumn'));
  if (primaryGenDecorator) {
    return {
      name,
      type: 'SERIAL',
      isPrimaryKey: true,
      isOptional: false,
      isUnique: false
    };
  }
  if (!columnDecorator) {
    return null;
  }
  let dbType = 'VARCHAR';
  let isUnique = false;
  let defaultValue: string | undefined;
  if (columnDecorator.includes('@PrimaryGeneratedColumn')) {
    dbType = 'SERIAL';
  } else {
    const typeMatch = columnDecorator.match(/["'](\w+)["']/);
    if (typeMatch) {
      dbType = mapTypeormTypeToSql(typeMatch[1]);
    } else {
      dbType = inferSqlTypeFromTs(baseType);
    }
    const lengthMatch = columnDecorator.match(/length:\s*(\d+)/);
    if (lengthMatch && (dbType === 'VARCHAR' || dbType === 'CHAR')) {
      dbType = `${dbType}(${lengthMatch[1]})`;
    }
    const precisionMatch = columnDecorator.match(/precision:\s*(\d+)/);
    const scaleMatch = columnDecorator.match(/scale:\s*(\d+)/);
    if (precisionMatch && scaleMatch && dbType === 'DECIMAL') {
      dbType = `DECIMAL(${precisionMatch[1]},${scaleMatch[1]})`;
    }
    isUnique = columnDecorator.includes('unique: true');
    const defaultMatch = columnDecorator.match(/default:\s*([^,}]+)/);
    if (defaultMatch) {
      defaultValue = defaultMatch[1].trim().replace(/^['"]|['"]$/g, '');
    }
  }
  
  return {
    name,
    type: dbType,
    isPrimaryKey,
    isOptional,
    isUnique,
    default: defaultValue
  };
}

function mapTypeormTypeToSql(typeormType: string): string {
  const typeMap: Record<string, string> = {
    'int': 'INT',
    'bigint': 'BIGINT',
    'smallint': 'SMALLINT',
    'float': 'FLOAT',
    'double': 'DOUBLE',
    'decimal': 'DECIMAL',
    'varchar': 'VARCHAR',
    'char': 'CHAR',
    'text': 'TEXT',
    'boolean': 'BOOLEAN',
    'date': 'DATE',
    'timestamp': 'TIMESTAMP',
    'timestamptz': 'TIMESTAMPTZ',
    'datetime': 'DATETIME'
  };
  return typeMap[typeormType.toLowerCase()] || 'VARCHAR';
}

function inferSqlTypeFromTs(tsType: string): string {
  switch (tsType.toLowerCase()) {
    case 'number':
      return 'INT';
    case 'string':
      return 'VARCHAR';
    case 'boolean':
      return 'BOOLEAN';
    case 'date':
      return 'TIMESTAMP';
    default:
      return 'VARCHAR';
  }
}
