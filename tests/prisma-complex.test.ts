import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import oldDoc from './fixtures/old-complex.json';
import { oldToNew } from '../src/convert';
import { newToIR } from '../src/ir';
import { irToPrisma } from '../src/ir-to-prisma';

describe('Prisma conversion - complex ERDPlus example', () => {
  it('produces the expected schema with PK, FK and relations', () => {
    const newDoc = oldToNew(oldDoc as any);
    const ir = newToIR(newDoc);
    const prisma = irToPrisma(ir).trim();
    const expected = readFileSync(new URL('./fixtures/old-complex.prisma', import.meta.url), 'utf8').trim();
    expect(prisma).toBe(expected);
  });
});
