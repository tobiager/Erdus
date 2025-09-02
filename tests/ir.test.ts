import { describe, it, expect } from 'vitest';
import newDoc from './fixtures/new.json';
import { newToIR } from '../src/ir';
import { irToPostgres } from '../src/ir-to-sql';
import { irToPrisma } from '../src/ir-to-prisma';

describe('IR conversions', () => {
  const ir = newToIR(newDoc as any);

  it('builds tables with FK references', () => {
    expect(ir.tables.length).toBe(2);
    const dom = ir.tables.find(t => t.name === 'DOMICILIO')!;
    const fk = dom.columns.find(c => c.name === 'IdCliente')!;
    expect(fk.references?.table).toBe('CLIENTE');
  });

  it('generates PostgreSQL DDL', () => {
    const sql = irToPostgres(ir);
    expect(sql).toContain('CREATE TABLE "CLIENTE"');
    expect(sql).toContain('FOREIGN KEY ("IdCliente") REFERENCES "CLIENTE"("IdCliente")');
  });

  it('generates Prisma schema', () => {
    const prisma = irToPrisma(ir);
    expect(prisma).toContain('model CLIENTE');
    expect(prisma).toContain('model DOMICILIO');
  });
});

