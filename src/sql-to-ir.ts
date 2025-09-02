import { IRDiagram, IRTable, IRColumn } from './ir';

/** Very small parser for CREATE TABLE statements */
export function sqlToIR(sql: string): IRDiagram {
  const tables: IRTable[] = [];
  const tableRegex = /CREATE TABLE\s+"?(\w+)"?\s*\(([\s\S]*?)\);/gi;
  let m: RegExpExecArray | null;
  while ((m = tableRegex.exec(sql))) {
    const name = m[1];
    const body = m[2];
    const lines = body.split(/\n/).map(l => l.trim()).filter(l => l);
    const columns: IRColumn[] = [];
    const pendingFks: { column: string; refTable: string; refColumn: string }[] = [];
    for (const line of lines) {
      if (/^PRIMARY KEY/i.test(line)) {
        const cols = line.match(/\(([^)]+)\)/);
        if (cols) {
          for (const c of cols[1].split(',').map(s => s.replace(/["`]/g, '').trim())) {
            const col = columns.find(col => col.name === c);
            if (col) col.isPrimaryKey = true;
          }
        }
      } else if (/^FOREIGN KEY/i.test(line)) {
        const fk = line.match(/FOREIGN KEY \(([^)]+)\) REFERENCES "?([\w]+)"?\(([^)]+)\)/i);
        if (fk) {
          pendingFks.push({
            column: fk[1].replace(/["`]/g, '').trim(),
            refTable: fk[2],
            refColumn: fk[3].replace(/["`]/g, '').trim()
          });
        }
      } else {
        const parts = line.replace(/,$/, '').split(/\s+/);
        const colName = parts.shift()!.replace(/["`]/g, '');
        const type = parts.shift() || 'TEXT';
        const rest = parts.join(' ');
        const col: IRColumn = {
          name: colName,
          type,
          isPrimaryKey: /PRIMARY KEY/i.test(rest),
          isOptional: !/NOT NULL/i.test(rest),
          isUnique: /UNIQUE/i.test(rest)
        };
        const ref = rest.match(/REFERENCES\s+"?([\w]+)"?\(([^)]+)\)/i);
        if (ref) {
          pendingFks.push({ column: colName, refTable: ref[1], refColumn: ref[2].replace(/["`]/g, '').trim() });
        }
        columns.push(col);
      }
    }
    for (const fk of pendingFks) {
      const col = columns.find(c => c.name === fk.column);
      if (col) col.references = { table: fk.refTable, column: fk.refColumn };
    }
    tables.push({ name, columns });
  }
  return { tables };
}
