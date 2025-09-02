import type { IRDiagram } from './ir';

function mapType(t: string): string {
  const u = t.toUpperCase();
  if (u.startsWith('INT')) return 'Int';
  if (u.startsWith('VARCHAR') || u === 'TEXT') return 'String';
  if (u === 'DATE' || u === 'TIMESTAMP') return 'DateTime';
  return 'String';
}

/** Convert canonical IR to a Prisma schema. */
export function irToPrisma(diagram: IRDiagram): string {
  return diagram.tables
    .map(table => {
      const lines = table.columns.map(col => {
        let type = mapType(col.type);
        if (col.isOptional) type += '?';
        let line = `  ${col.name} ${type}`;
        if (col.isPrimaryKey) line += ' @id';
        if (col.isUnique && !col.isPrimaryKey) line += ' @unique';
        if (col.references) {
          line += ` @relation(fields: [${col.name}], references: [${col.references.column}])`;
        }
        return line;
      });
      return `model ${table.name} {\n${lines.join('\n')}\n}`;
    })
    .join('\n\n');
}

