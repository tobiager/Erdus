import { sqlToIR } from './sql-to-ir';
import { irToPrisma } from './ir-to-prisma';
import { prismaToIR } from './prisma-to-ir';
import { irToPostgres } from './ir-to-sql';
import { oldToNew, newToOld } from './convert';
import { newToIR } from './ir';
import { irToNew } from './ir-to-new';

export { sqlToIR, irToPrisma, prismaToIR, irToPostgres, oldToNew, newToOld, newToIR, irToNew };

export function sqlToPrisma(sql: string) {
  return irToPrisma(sqlToIR(sql));
}

export function prismaToSql(prismaSchema: string) {
  return irToPostgres(prismaToIR(prismaSchema));
}

export function oldToSql(oldInput: any) {
  const oldDoc = typeof oldInput === 'string' ? JSON.parse(oldInput) : oldInput;
  const newDoc = oldToNew(oldDoc);
  const ir = newToIR(newDoc);
  const pkByName = new Map<string, string[]>();
  for (const table of ir.tables) {
    const pk = table.columns.find(c => c.isPrimaryKey);
    if (pk) {
      const list = pkByName.get(pk.name) || [];
      list.push(table.name);
      pkByName.set(pk.name, list);
    }
  }
  for (const table of ir.tables) {
    for (const col of table.columns) {
      if (!col.references) {
        const list = pkByName.get(col.name) || [];
        const refTable = list.find(t => t !== table.name);
        if (refTable && table.columns.length > 1) {
          col.references = { table: refTable, column: col.name };
        }
      }
    }
  }
  return irToPostgres(ir);
}

export type Format = 'sql' | 'prisma' | 'erdplus-old' | 'erdplus-new';
export interface LossReport { lossy: boolean }
export interface ConvertOpts { from: Format; to: Format; }

export async function convert(input: string, opts: ConvertOpts) {
  const { from, to } = opts;
  if (from === 'sql' && to === 'prisma') {
    const output = await sqlToPrisma(input);
    const lossy = /CHECK/i.test(input);
    return { output, lossReport: { lossy } };
  }
  if (from === 'prisma' && to === 'sql') {
    return { output: await prismaToSql(input), lossReport: { lossy: false } };
  }
  if (from === 'erdplus-old' && to === 'sql') {
    return { output: await oldToSql(input), lossReport: { lossy: false } };
  }
  // TODO: wire remaining routes when ready.
  throw new Error(`Route not implemented: ${from} → ${to}`);
}

export default convert;
