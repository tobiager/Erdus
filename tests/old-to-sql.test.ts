import { describe, it, expect } from 'vitest';
import oldDoc from './fixtures/old-complex.json';
import { oldToNew } from '../src/convert';
import { newToIR } from '../src/ir';
import { irToPostgres } from '../src/ir-to-sql';

describe('old JSON to PostgreSQL SQL', () => {
  const newDoc = oldToNew(oldDoc as any);
  const ir = newToIR(newDoc);
  const sql = irToPostgres(ir);

  it('maps VARCHARN to VARCHAR with size', () => {
    expect(sql).toContain('"nombre_completo" VARCHAR(200) NOT NULL');
  });

  it('creates proper foreign keys', () => {
    expect(sql).toContain('FOREIGN KEY ("id_cargo") REFERENCES "cargo"("id_cargo")');
    expect(sql).toContain('FOREIGN KEY ("id_tag") REFERENCES "tag"("id_tag")');
    expect(sql).toContain('FOREIGN KEY ("id_proyecto") REFERENCES "proyecto"("id_proyecto")');
  });

  it('does not create spurious FKs for tag', () => {
    const tagTable = /CREATE TABLE "tag"([\s\S]*?)\);/i.exec(sql)?.[1] || '';
    expect(tagTable).not.toMatch(/FOREIGN KEY/);
  });

  it('adds composite primary key for bridge table', () => {
    const projTag = /CREATE TABLE "proyecto_tag"([\s\S]*?)\);/i.exec(sql)?.[1] || '';
    expect(projTag).toContain('PRIMARY KEY ("id_tag","id_proyecto")');
  });
});
