import type { IRDiagram, IRTable, IRColumn } from './ir';

type TypeOrmType = { type: string; decorators?: string[] };

function toPascalCase(str: string): string {
  return str
    .split(/[_\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function mapType(raw: string): TypeOrmType {
  const t = raw.toUpperCase();
  
  if (t.startsWith('INT') || t === 'INTEGER') {
    return { type: 'number', decorators: ['@Column("int")'] };
  }
  
  if (t.startsWith('BIGINT')) {
    return { type: 'number', decorators: ['@Column("bigint")'] };
  }
  
  if (t.startsWith('SMALLINT')) {
    return { type: 'number', decorators: ['@Column("smallint")'] };
  }
  
  if (t.startsWith('DOUBLE') || t.startsWith('FLOAT') || t.startsWith('REAL')) {
    return { type: 'number', decorators: ['@Column("float")'] };
  }

  const dec = t.match(/^(DECIMAL|NUMERIC)\((\d+),(\d+)\)$/);
  if (dec) {
    return { 
      type: 'number', 
      decorators: [`@Column("decimal", { precision: ${dec[2]}, scale: ${dec[3]} })`] 
    };
  }
  if (t === 'DECIMAL' || t === 'NUMERIC') {
    return { type: 'number', decorators: ['@Column("decimal")'] };
  }

  const varchar = t.match(/^VARCHAR\((\d+)\)$/);
  if (varchar) {
    return { 
      type: 'string', 
      decorators: [`@Column("varchar", { length: ${varchar[1]} })`] 
    };
  }

  const char = t.match(/^CHAR\((\d+)\)$/);
  if (char) {
    return { 
      type: 'string', 
      decorators: [`@Column("char", { length: ${char[1]} })`] 
    };
  }

  if (t === 'TEXT') {
    return { type: 'string', decorators: ['@Column("text")'] };
  }

  if (t === 'DATE') {
    return { type: 'Date', decorators: ['@Column("date")'] };
  }
  
  if (t === 'TIMESTAMPTZ') {
    return { type: 'Date', decorators: ['@Column("timestamptz")'] };
  }
  
  if (t === 'DATETIME' || t === 'TIMESTAMP') {
    return { type: 'Date', decorators: ['@Column("timestamp")'] };
  }

  if (t === 'SERIAL') {
    return { 
      type: 'number', 
      decorators: ['@PrimaryGeneratedColumn("increment")'] 
    };
  }
  
  if (t === 'BIGSERIAL') {
    return { 
      type: 'number', 
      decorators: ['@PrimaryGeneratedColumn("increment")', '@Column("bigint")'] 
    };
  }

  if (t === 'BOOLEAN' || t === 'BOOL') {
    return { type: 'boolean', decorators: ['@Column("boolean")'] };
  }

  // Default fallback
  return { type: 'string', decorators: ['@Column()'] };
}

interface RelationMeta {
  child: IRTable;
  parent: IRTable;
  column: IRColumn;
  propertyName: string;
  index: number;
}

/** Convert canonical IR to TypeORM entities. */
export function irToTypeorm(diagram: IRDiagram): string {
  const tableMap = new Map<string, IRTable>(diagram.tables.map(t => [t.name, t]));

  // Group FK columns by child->parent to determine relation names when needed
  const groups = new Map<string, { child: IRTable; parent: IRTable; cols: IRColumn[] }>();
  for (const table of diagram.tables) {
    for (const col of table.columns) {
      if (!col.references) continue;
      const parent = tableMap.get(col.references.table);
      if (!parent) continue;
      const key = `${table.name}->${parent.name}`;
      const g = groups.get(key) || { child: table, parent, cols: [] };
      g.cols.push(col);
      groups.set(key, g);
    }
  }

  const relations: RelationMeta[] = [];
  for (const g of groups.values()) {
    g.cols.forEach((col, idx) => {
      const propertyName = g.cols.length > 1 
        ? `${g.parent.name.toLowerCase()}_${idx + 1}` 
        : g.parent.name.toLowerCase();
      relations.push({ 
        child: g.child, 
        parent: g.parent, 
        column: col, 
        propertyName,
        index: idx + 1 
      });
    });
  }

  const relByChildCol = new Map<string, RelationMeta>();
  const backRelations = new Map<string, RelationMeta[]>();
  for (const r of relations) {
    relByChildCol.set(`${r.child.name}.${r.column.name}`, r);
    const list = backRelations.get(r.parent.name) || [];
    list.push(r);
    backRelations.set(r.parent.name, list);
  }

  // Generate import statement once at the top
  const imports = `import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';`;
  
  const entities = diagram.tables
    .map(table => {
      const pkCols = table.columns.filter(c => c.isPrimaryKey);
      const lines: string[] = [];
      
      // Add entity decorator (no imports here)
      lines.push(`@Entity('${table.name}')`);
      
      // Add indexes if any
      if (table.indexes && table.indexes.length > 0) {
        for (const idx of table.indexes) {
          const cols = idx.columns.map(col => `'${col}'`).join(', ');
          if (idx.unique) {
            lines.push(`@Index([${cols}], { unique: true })`);
          } else {
            lines.push(`@Index([${cols}])`);
          }
        }
      }
      
      lines.push(`export class ${toPascalCase(table.name)} {`);

      // Add columns
      for (const col of table.columns) {
        const mapped = mapType(col.type);
        const isRelation = !!col.references;
        const isPk = col.isPrimaryKey;
        const optional = col.isOptional && !col.isPrimaryKey && !isRelation;
        
        if (isRelation) {
          // Skip FK columns - they will be handled by relations
          continue;
        }

        let decorators: string[] = [];
        
        if (isPk) {
          if (col.type.toUpperCase() === 'SERIAL' || col.type.toUpperCase() === 'BIGSERIAL') {
            decorators = mapped.decorators || ['@PrimaryGeneratedColumn()'];
          } else {
            decorators = ['@PrimaryColumn()'];
            if (mapped.decorators && mapped.decorators[0] !== '@PrimaryGeneratedColumn("increment")') {
              decorators.push(...(mapped.decorators || ['@Column()']));
            }
          }
        } else {
          decorators = mapped.decorators || ['@Column()'];
        }

        // Add nullable option for optional columns
        if (optional && decorators.length > 0) {
          const lastDecorator = decorators[decorators.length - 1];
          if (lastDecorator.includes('@Column(')) {
            if (lastDecorator.includes('{ ')) {
              decorators[decorators.length - 1] = lastDecorator.replace(' })', ', nullable: true })');
            } else {
              decorators[decorators.length - 1] = lastDecorator.replace(')', ', { nullable: true })');
            }
          }
        }

        // Add unique constraint
        if (col.isUnique && !col.isPrimaryKey) {
          const lastDecorator = decorators[decorators.length - 1];
          if (lastDecorator.includes('@Column(')) {
            if (lastDecorator.includes('{ ')) {
              decorators[decorators.length - 1] = lastDecorator.replace(' })', ', unique: true })');
            } else {
              decorators[decorators.length - 1] = lastDecorator.replace(')', ', { unique: true })');
            }
          }
        }

        // Add default value
        if (col.default && !col.type.toUpperCase().includes('SERIAL')) {
          const lastDecorator = decorators[decorators.length - 1];
          if (lastDecorator.includes('@Column(')) {
            const defaultValue = col.default.includes("'") ? col.default : `'${col.default}'`;
            if (lastDecorator.includes('{ ')) {
              decorators[decorators.length - 1] = lastDecorator.replace(' })', `, default: ${defaultValue} })`);
            } else {
              decorators[decorators.length - 1] = lastDecorator.replace(')', `, { default: ${defaultValue} })`);
            }
          }
        }

        decorators.forEach(decorator => lines.push(`  ${decorator}`));
        const typeAnnotation = optional ? `${mapped.type} | null` : mapped.type;
        lines.push(`  ${col.name}: ${typeAnnotation};`);
        lines.push('');
      }

      // Add ManyToOne relations (FK side)
      for (const col of table.columns) {
        if (!col.references) continue;
        const meta = relByChildCol.get(`${table.name}.${col.name}`);
        if (!meta) continue; // Skip if no relation metadata found
        const optional = col.isOptional;
        
        lines.push(`  @ManyToOne(() => ${toPascalCase(meta.parent.name)}${optional ? ', { nullable: true }' : ''})`);
        lines.push(`  @JoinColumn({ name: '${col.name}' })`);
        const typeAnnotation = optional ? `${toPascalCase(meta.parent.name)} | null` : toPascalCase(meta.parent.name);
        lines.push(`  ${meta.propertyName}: ${typeAnnotation};`);
        lines.push('');
      }

      // Add OneToMany relations (reverse side)
      const backRels = backRelations.get(table.name) || [];
      for (const r of backRels) {
        const propertyName = r.index > 1 
          ? `${r.child.name.toLowerCase()}s_${r.index}` 
          : `${r.child.name.toLowerCase()}s`;
        lines.push(`  @OneToMany(() => ${toPascalCase(r.child.name)}, ${r.child.name.toLowerCase()} => ${r.child.name.toLowerCase()}.${r.propertyName})`);
        lines.push(`  ${propertyName}: ${toPascalCase(r.child.name)}[];`);
        lines.push('');
      }

      // Handle composite primary keys
      if (pkCols.length > 1) {
        // For composite keys, we need to remove individual @PrimaryColumn decorators 
        // and add them as regular columns, then use a custom approach
        const pkNames = pkCols.map(c => c.name);
        lines.push(`  // Composite primary key: [${pkNames.join(', ')}]`);
        lines.push(`  // Note: TypeORM composite keys require additional configuration`);
      }

      lines.push('}');
      return lines.join('\n');
    })
    .join('\n\n');
  
  // Combine imports with entities
  return `${imports}\n\n${entities}`;
}
