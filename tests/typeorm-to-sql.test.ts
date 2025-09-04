import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { typeormToIR } from '../src/typeorm-to-ir';
import { irToPostgres } from '../src/ir-to-sql';

const typeormSource = readFileSync(join(__dirname, 'fixtures/typeorm-entities.ts'), 'utf8');

describe('TypeORM to SQL', () => {
  const ir = typeormToIR(typeormSource);
  const sql = irToPostgres(ir);

  it('parses TypeORM entities correctly', () => {
    expect(ir.tables).toHaveLength(4);
    
    const usuario = ir.tables.find(t => t.name === 'Usuario');
    expect(usuario).toBeDefined();
    expect(usuario?.columns).toHaveLength(4);
    
    const idCol = usuario?.columns.find(c => c.name === 'id');
    expect(idCol?.isPrimaryKey).toBe(true);
    expect(idCol?.type).toBe('SERIAL');
    
    const emailCol = usuario?.columns.find(c => c.name === 'email');
    expect(emailCol?.isUnique).toBe(true);
    expect(emailCol?.type).toBe('VARCHAR(255)');
  });

  it('handles foreign key relationships', () => {
    const usuarioRol = ir.tables.find(t => t.name === 'UsuarioRol');
    expect(usuarioRol).toBeDefined();
    
    const usuarioIdCol = usuarioRol?.columns.find(c => c.name === 'usuario_id');
    expect(usuarioIdCol?.references).toEqual({
      table: 'Usuario',
      column: 'id'
    });
    
    const rolIdCol = usuarioRol?.columns.find(c => c.name === 'rol_id');
    expect(rolIdCol?.references).toEqual({
      table: 'Rol',
      column: 'id'
    });
  });

  it('generates correct SQL output', () => {
    expect(sql).toContain('CREATE TABLE "Usuario"');
    expect(sql).toContain('CREATE TABLE "Rol"');
    expect(sql).toContain('CREATE TABLE "UsuarioRol"');
    expect(sql).toContain('CREATE TABLE "Product"');
  });

  it('handles composite primary keys', () => {
    const usuarioRol = ir.tables.find(t => t.name === 'UsuarioRol');
    const pkCols = usuarioRol?.columns.filter(c => c.isPrimaryKey);
    expect(pkCols).toHaveLength(2);
    expect(pkCols?.map(c => c.name)).toEqual(['usuario_id', 'rol_id']);
  });

  it('handles nullable columns', () => {
    const product = ir.tables.find(t => t.name === 'Product');
    const descCol = product?.columns.find(c => c.name === 'description');
    expect(descCol?.isOptional).toBe(true);
  });

  it('handles decimal precision and scale', () => {
    const product = ir.tables.find(t => t.name === 'Product');
    const priceCol = product?.columns.find(c => c.name === 'price');
    expect(priceCol?.type).toBe('DECIMAL(10,2)');
  });

  it('matches expected SQL snapshot', () => {
    expect(sql).toMatchInlineSnapshot(`
      "CREATE TABLE "Usuario" (
        "id" SERIAL NOT NULL,
        "nombre" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "created_at" TIMESTAMPTZ NOT NULL,
        PRIMARY KEY ("id")
      );
      CREATE TABLE "Rol" (
        "id" SERIAL NOT NULL,
        "nombre" VARCHAR(255) NOT NULL UNIQUE,
        PRIMARY KEY ("id")
      );
      CREATE TABLE "UsuarioRol" (
        "usuario_id" INT NOT NULL,
        "rol_id" INT NOT NULL,
        PRIMARY KEY ("usuario_id","rol_id"),
        FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id"),
        FOREIGN KEY ("rol_id") REFERENCES "Rol"("id")
      );
      CREATE TABLE "Product" (
        "id" SERIAL NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "category" VARCHAR(100) NOT NULL,
        "price" DECIMAL(10,2) NOT NULL,
        "active" BOOLEAN NOT NULL,
        "description" TEXT,
        PRIMARY KEY ("id")
      );"
    `);
  });
});
