import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { sqlToIR } from '../src/sql-to-ir';
import { prismaToIR } from '../src/prisma-to-ir';
import { irToNew } from '../src/ir-to-new';
import { newToOld } from '../src/convert';

const sql = readFileSync(__dirname + '/fixtures/schema.sql', 'utf8');
const prisma = readFileSync(__dirname + '/fixtures/schema.prisma', 'utf8');

describe('reverse conversions', () => {
  it('parses SQL and builds IR', () => {
    const ir = sqlToIR(sql);
    expect(ir.tables.length).toBe(2);
    const dom = ir.tables.find(t => t.name === 'DOMICILIO')!;
    const fk = dom.columns.find(c => c.name === 'IdCliente')!;
    expect(fk.references?.table).toBe('CLIENTE');
  });

  it('parses Prisma and builds IR', () => {
    const ir = prismaToIR(prisma);
    const dom = ir.tables.find(t => t.name === 'DOMICILIO')!;
    const fk = dom.columns.find(c => c.name === 'IdCliente')!;
    expect(fk.references?.table).toBe('CLIENTE');
  });

  it('IR → new → old', () => {
    const ir = sqlToIR(sql);
    const newDoc = irToNew(ir);
    const oldDoc = newToOld(newDoc);
    expect(oldDoc.shapes.length).toBe(2);
  });
});
