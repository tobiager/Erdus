import { describe, it, expect } from 'vitest';
import { sqlToIR } from '../src/sql-to-ir';
import { irToPrisma } from '../src/ir-to-prisma';

describe('SQL to Prisma mapping', () => {
  it('handles PK, unique and defaults', () => {
    const sql = `CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );`;
    const prisma = irToPrisma(sqlToIR(sql));
    expect(prisma).toContain('model users');
    expect(prisma).toContain('id Int @default(autoincrement()) @id');
    expect(prisma).toContain('email String @db.VarChar(255) @unique');
    expect(prisma).toContain('created_at DateTime @db.Timestamptz @default(now())');
  });
});
