import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { sqlToIR } from '../src/sql-to-ir';
import { prismaToIR } from '../src/prisma-to-ir';
import { irToNew } from '../src/ir-to-new';
import { newToOld } from '../src/convert';

const sql = readFileSync(__dirname + '/fixtures/schema.sql', 'utf8');
const prisma = readFileSync(__dirname + '/fixtures/schema.prisma', 'utf8');
const multilineSql = readFileSync(
  __dirname + '/fixtures/multiline-constraints.sql',
  'utf8',
);

describe('reverse conversions', () => {
  it('parses SQL and builds IR', () => {
    const ir = sqlToIR(sql);
    expect(ir.tables.length).toBe(2);
    const dom = ir.tables.find((t) => t.name === 'DOMICILIO')!;
    const fk = dom.columns.find((c) => c.name === 'IdCliente')!;
    expect(fk.references?.table).toBe('CLIENTE');
  });

  it('parses Prisma and builds IR', () => {
    const ir = prismaToIR(prisma);
    const dom = ir.tables.find((t) => t.name === 'DOMICILIO')!;
    const fk = dom.columns.find((c) => c.name === 'IdCliente')!;
    expect(fk.references?.table).toBe('CLIENTE');
  });

  it('IR → new → old', () => {
    const ir = sqlToIR(sql);
    const newDoc = irToNew(ir);
    const oldDoc = newToOld(newDoc);
    expect(oldDoc.shapes.length).toBe(2);
  });
});

describe('sqlToIR multi-line constraints', () => {
  const ir = sqlToIR(multilineSql);
  const orders = ir.tables.find((t) => t.name === 'orders')!;
  const users = ir.tables.find((t) => t.name === 'users')!;

  it('drops table-level CHECK without creating spurious columns', () => {
    expect(orders.columns.map((c) => c.name)).toEqual([
      'id',
      'user_id',
      'product_id',
      'qty',
      'unit_price',
      'total_amount',
      'status',
    ]);
    expect(users.columns.map((c) => c.name)).toEqual(['id', 'email', 'status']);
    const ghost = [...orders.columns, ...users.columns].find(
      (c) =>
        /^chk_|^fk_|^uq_|^CONSTRAINT$/i.test(c.name) ||
        c.type === 'CONSTRAINT' ||
        c.type === 'GENERATED' ||
        c.type === 'ON',
    );
    expect(ghost).toBeUndefined();
  });

  it('attaches ON DELETE / ON UPDATE from named FOREIGN KEY constraints', () => {
    const userFk = orders.columns.find((c) => c.name === 'user_id')!;
    expect(userFk.references).toEqual({
      table: 'users',
      column: 'id',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
    const productFk = orders.columns.find((c) => c.name === 'product_id')!;
    expect(productFk.references?.table).toBe('products');
    expect(productFk.references?.onDelete).toBe('RESTRICT');
  });

  it('preserves GENERATED ALWAYS AS columns with their declared type', () => {
    const total = orders.columns.find((c) => c.name === 'total_amount')!;
    expect(total.type.toLowerCase()).toContain('numeric');
    expect(total.type).not.toMatch(/GENERATED/i);
  });

  it('records table-level UNIQUE as an index, not a column', () => {
    expect(orders.indexes).toBeDefined();
    const unique = orders.indexes!.find((i) => i.unique);
    expect(unique?.columns).toEqual(['user_id', 'product_id']);
  });
});
