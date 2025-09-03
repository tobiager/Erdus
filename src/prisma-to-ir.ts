import { IRDiagram, IRTable, IRColumn } from './ir';

/** Minimal parser for Prisma schema models */
export function prismaToIR(schema: string): IRDiagram {
  const tables: IRTable[] = [];
  const modelRegex = /model\s+(\w+)\s+{([\s\S]*?)}/g;
  let m: RegExpExecArray | null;
  while ((m = modelRegex.exec(schema))) {
    const name = m[1];
    const body = m[2];
    const lines = body.split(/\n/).map(l => l.trim()).filter(l => l && !l.startsWith('//'));
    const tableAttrs = lines.filter(l => l.startsWith('@@'));
    const columns: IRColumn[] = [];
    const relations: { field: string; target: string; referenced: string }[] = [];
    for (const line of lines) {
      if (line.startsWith('@@')) continue;
      const tokens = line.split(/\s+/);
      const field = tokens[0];
      const type = tokens[1];
      const rest = tokens.slice(2).join(' ');
      if (type.endsWith('[]')) continue; // skip relation arrays
      const rel = rest.match(/@relation\(([^)]*)\)/);
      if (rel) {
        const fields = rel[1].match(/fields:\s*\[(\w+)\]/);
        const refs = rel[1].match(/references:\s*\[(\w+)\]/);
        if (fields && refs) {
          relations.push({ field: fields[1], target: type, referenced: refs[1] });
        }
        continue; // do not emit object relation field as column
      }
      const col: IRColumn = {
        name: field,
        type,
        isPrimaryKey: /@id/.test(rest),
        isOptional: /\?/.test(type),
        isUnique: /@unique/.test(rest)
      };
      const def = rest.match(/@default\((.+)\)/);
      if (def) col.default = def[1];
      columns.push(col);
    }
    for (const r of relations) {
      const col = columns.find(c => c.name === r.field);
      if (col) col.references = { table: r.target, column: r.referenced };
    }
    const idAttr = tableAttrs.find(a => a.startsWith('@@id'));
    let pkOrder: string[] | undefined;
    if (idAttr) {
      const ids = idAttr.match(/\[([^\]]+)\]/)?.[1].split(',').map(s => s.trim());
      if (ids) {
        pkOrder = ids;
        for (const id of ids) {
          const col = columns.find(c => c.name === id);
          if (col) col.isPrimaryKey = true;
        }
      }
    }
    tables.push({ name, columns, primaryKey: pkOrder });
  }
  return { tables };
}
