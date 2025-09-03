import type { IRDiagram, IRTable, IRColumn } from './ir';

type MappedType = { type: string; attr?: string };

function mapType(raw: string): MappedType {
  const t = raw.toUpperCase();
  if (t.startsWith('INT')) return { type: 'Int' };
  if (t.startsWith('DOUBLE') || t.startsWith('FLOAT') || t.startsWith('REAL')) return { type: 'Float' };

  const dec = t.match(/^(DECIMAL|NUMERIC)\((\d+),(\d+)\)$/);
  if (dec) return { type: 'Decimal', attr: `@db.Decimal(${dec[2]}, ${dec[3]})` };
  if (t === 'DECIMAL' || t === 'NUMERIC') return { type: 'Decimal' };

  const varchar = t.match(/^VARCHAR\((\d+)\)$/);
  if (varchar) return { type: 'String', attr: `@db.VarChar(${varchar[1]})` };

  const char = t.match(/^CHAR\((\d+)\)$/);
  if (char) return { type: 'String', attr: `@db.Char(${char[1]})` };

  if (t === 'TEXT') return { type: 'String' };

  if (t === 'DATE') return { type: 'DateTime', attr: '@db.Date' };
  if (t === 'TIMESTAMPTZ') return { type: 'DateTime', attr: '@db.Timestamptz' };
  if (t === 'DATETIME' || t === 'TIMESTAMP') return { type: 'DateTime' };

  if (t === 'SERIAL' || t === 'BIGSERIAL') return { type: 'Int', attr: '@default(autoincrement())' };

  if (t === 'BOOLEAN' || t === 'BOOL') return { type: 'Boolean' };

  return { type: 'String' };
}

interface RelationMeta {
  child: IRTable;
  parent: IRTable;
  column: IRColumn;
  name?: string;
  index: number;
}

/** Convert canonical IR to a Prisma schema. */
export function irToPrisma(diagram: IRDiagram): string {
  const tableMap = new Map<string, IRTable>(diagram.tables.map(t => [t.name, t]));

  // group FK columns by child->parent to determine relation names when needed
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
      const name = g.cols.length > 1 ? `Rel_${g.child.name}_${g.parent.name}_${idx + 1}` : undefined;
      relations.push({ child: g.child, parent: g.parent, column: col, name, index: idx + 1 });
    });
  }

  const relNameByChildCol = new Map<string, RelationMeta>();
  const backRelations = new Map<string, RelationMeta[]>();
  for (const r of relations) {
    relNameByChildCol.set(`${r.child.name}.${r.column.name}`, r);
    const list = backRelations.get(r.parent.name) || [];
    list.push(r);
    backRelations.set(r.parent.name, list);
  }

  return diagram.tables
    .map(table => {
      const pkCols = table.columns.filter(c => c.isPrimaryKey).map(c => c.name);
      const lines: string[] = [];

      for (const col of table.columns) {
        const mapped = mapType(col.type);
        const isRelation = !!col.references;
        const isId = pkCols.length === 1 && col.isPrimaryKey;
        const optional = col.isOptional && !col.isPrimaryKey && !isRelation;
        let line = `  ${col.name} ${mapped.type}${optional ? '?' : ''}`;
        if (mapped.attr) line += ` ${mapped.attr}`;
        if (isId) line += ' @id';
        if (col.isUnique && !col.isPrimaryKey) line += ' @unique';
        if (col.default && !/@default\(/.test(line)) line += ` @default(${col.default})`;
        lines.push(line);
      }

      // relation fields
      for (const col of table.columns) {
        if (!col.references) continue;
        const meta = relNameByChildCol.get(`${table.name}.${col.name}`)!;
        const fieldName = meta.name ? `${meta.parent.name}_${meta.index}` : meta.parent.name;
        const opt = col.isOptional ? '?' : '';
        const relAttr = `@relation(${meta.name ? `"${meta.name}", ` : ''}fields: [${col.name}], references: [${col.references.column}])`;
        lines.push(`  ${fieldName} ${meta.parent.name}${opt} ${relAttr}`);
      }

      // back-relations
      for (const r of backRelations.get(table.name) || []) {
        const fieldName = r.name ? `${r.child.name}_${r.index}` : r.child.name;
        const relAttr = r.name ? ` @relation("${r.name}")` : '';
        lines.push(`  ${fieldName} ${r.child.name}[]${relAttr}`);
      }

      if (pkCols.length > 1) {
        lines.push(`  @@id([${pkCols.join(', ')}])`);
      } else if (pkCols.length === 0) {
        const fkCols = table.columns.filter(c => c.references).map(c => c.name);
        if (fkCols.length === 2) {
          lines.push(`  @@id([${fkCols.join(', ')}])`);
        }
      }

      return `model ${table.name} {\n${lines.join('\n')}\n}`;
    })
    .join('\n\n');
}

