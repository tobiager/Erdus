import { IRDiagram, IRTable, IRColumn } from './ir';

/** Very small parser for CREATE TABLE statements */
export function sqlToIR(sql: string): IRDiagram {
  const tables: IRTable[] = [];
  const tableRegex = /CREATE TABLE\s+(?:[\w"`]+\.)?"?(\w+)"?\s*\(([\s\S]*?)\);/gi;
  let m: RegExpExecArray | null;
  while ((m = tableRegex.exec(sql))) {
    const name = m[1];
    const body = m[2];
    const lines = body.split(/\n/).map(l => l.trim()).filter(l => l);
    const columns: IRColumn[] = [];
    const pendingFks: {
      column: string;
      refTable: string;
      refColumn: string;
      onDelete?: string;
      onUpdate?: string;
    }[] = [];
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
        const fk = line.match(
          /FOREIGN KEY \(([^)]+)\) REFERENCES "?([\w]+)"?\(([^)]+)\)(?:\s+ON DELETE\s+([A-Z ]+?)(?=\s+ON UPDATE|$))?(?:\s+ON UPDATE\s+([A-Z ]+))?/i
        );
        if (fk) {
          pendingFks.push({
            column: fk[1].replace(/["`]/g, '').trim(),
            refTable: fk[2],
            refColumn: fk[3].replace(/["`]/g, '').trim(),
            onDelete: fk[4]?.trim(),
            onUpdate: fk[5]?.trim()
          });
        }
      } else {
        const parts = line.replace(/,$/, '').split(/\s+/);
        const colName = parts.shift()!.replace(/["`]/g, '');
        const type = parts.shift() || 'TEXT';
        const rest = parts.join(' ');
        const upperType = type.toUpperCase();
        const isSerial = upperType === 'SERIAL' || upperType === 'BIGSERIAL';
        const defaultMatch = rest.match(/DEFAULT\s+([^\s,]+)/i);
        const col: IRColumn = {
          name: colName,
          type,
          isPrimaryKey: /PRIMARY KEY/i.test(rest),
          // SERIAL columns are implicitly NOT NULL
          isOptional: isSerial ? false : !/NOT NULL/i.test(rest),
          isUnique: /UNIQUE/i.test(rest),
          default: defaultMatch ? defaultMatch[1] : undefined
        };
        const ref = rest.match(
          /REFERENCES\s+"?([\w]+)"?\(([^)]+)\)(?:\s+ON DELETE\s+([A-Z ]+?)(?=\s+ON UPDATE|$))?(?:\s+ON UPDATE\s+([A-Z ]+))?/i
        );
        if (ref) {
          pendingFks.push({
            column: colName,
            refTable: ref[1],
            refColumn: ref[2].replace(/["`]/g, '').trim(),
            onDelete: ref[3]?.trim(),
            onUpdate: ref[4]?.trim()
          });
        }
        columns.push(col);
      }
    }
    for (const fk of pendingFks) {
      const col = columns.find(c => c.name === fk.column);
      if (col) col.references = { table: fk.refTable, column: fk.refColumn, onDelete: fk.onDelete, onUpdate: fk.onUpdate };
    }
    tables.push({ name, columns });
  }
  const indexRegex = /CREATE\s+(UNIQUE\s+)?INDEX\s+\w+\s+ON\s+(?:[\w"`]+\.)?(\w+)\s*\(([^)]+)\);/gi;
  let im: RegExpExecArray | null;
  while ((im = indexRegex.exec(sql))) {
    const table = tables.find(t => t.name === im![2]);
    if (!table) continue;
    const cols = im![3].split(',').map(c => c.replace(/["`]/g, '').trim());
    (table.indexes ||= []).push({ columns: cols, unique: !!im![1] });
  }
  return { tables };
}
