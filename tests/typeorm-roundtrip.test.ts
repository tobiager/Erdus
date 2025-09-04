import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { typeormToIR } from '../src/typeorm-to-ir';
import { irToTypeorm } from '../src/ir-to-typeorm';
import { irToPostgres } from '../src/ir-to-sql';
import { sqlToIR } from '../src/sql-to-ir';

const typeormSource = readFileSync(join(__dirname, 'fixtures/typeorm-entities.ts'), 'utf8');

describe('TypeORM roundtrip conversion', () => {
  it('maintains entity structure through TypeORM -> IR -> TypeORM', () => {
    const originalIR = typeormToIR(typeormSource);
    const generatedTypeorm = irToTypeorm(originalIR);
    const roundtripIR = typeormToIR(generatedTypeorm);
    
    // Should have same number of tables
    expect(roundtripIR.tables).toHaveLength(originalIR.tables.length);
    
    // Check each table is preserved
    for (const originalTable of originalIR.tables) {
      const roundtripTable = roundtripIR.tables.find(t => t.name === originalTable.name);
      expect(roundtripTable).toBeDefined();
      
      // Should have similar column structure (some normalization expected)
      expect(roundtripTable?.columns.length).toBeGreaterThan(0);
    }
    
    // Basic structure should be maintained
    expect(generatedTypeorm).toContain('@Entity');
    expect(generatedTypeorm).toContain('@Column');
    expect(generatedTypeorm).toContain('@PrimaryGeneratedColumn');
  });

  it('maintains consistency through TypeORM -> SQL -> TypeORM', () => {
    const originalIR = typeormToIR(typeormSource);
    const sql = irToPostgres(originalIR);
    const sqlIR = sqlToIR(sql);
    const finalTypeorm = irToTypeorm(sqlIR);
    
    // Should generate valid TypeORM code
    expect(finalTypeorm).toContain('@Entity');
    expect(finalTypeorm).toContain('export class');
    expect(finalTypeorm).toContain('@Column');
    
    // Should preserve table names
    expect(finalTypeorm).toContain('Usuario');
    expect(finalTypeorm).toContain('Rol');
    expect(finalTypeorm).toContain('UsuarioRol');
    expect(finalTypeorm).toContain('Product');
  });

  it('preserves foreign key relationships', () => {
    const originalIR = typeormToIR(typeormSource);
    const sql = irToPostgres(originalIR);
    const sqlIR = sqlToIR(sql);
    const finalTypeorm = irToTypeorm(sqlIR);
    
    // Should have ManyToOne relationships
    expect(finalTypeorm).toContain('@ManyToOne');
    expect(finalTypeorm).toContain('@JoinColumn');
    
    // Should have OneToMany relationships
    expect(finalTypeorm).toContain('@OneToMany');
  });
});
