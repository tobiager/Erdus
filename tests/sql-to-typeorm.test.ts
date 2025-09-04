import { describe, it, expect } from 'vitest';
import { sqlToIR } from '../src/sql-to-ir';
import { irToTypeorm } from '../src/ir-to-typeorm';

describe('SQL to TypeORM mapping', () => {
  it('handles PK, unique and defaults', () => {
    const sql = `CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      active BOOLEAN DEFAULT true
    );`;
    
    const ir = sqlToIR(sql);
    const typeorm = irToTypeorm(ir);
    
    expect(typeorm).toContain('@Entity(\'users\')');
    expect(typeorm).toContain('export class Users');
    expect(typeorm).toContain('@PrimaryGeneratedColumn("increment")');
    expect(typeorm).toContain('@Column("varchar", { length: 255, unique: true })');
    expect(typeorm).toContain('@Column("timestamptz", { default: \'now()\' })');
    expect(typeorm).toContain('@Column("boolean", { nullable: true, default: \'true\' })');
  });

  it('handles foreign keys and relationships', () => {
    const sql = `
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );
      
      CREATE TABLE posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        user_id INT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `;
    
    const ir = sqlToIR(sql);
    const typeorm = irToTypeorm(ir);
    
    expect(typeorm).toContain('@ManyToOne(() => Users)');
    expect(typeorm).toContain('@JoinColumn({ name: \'user_id\' })');
    expect(typeorm).toContain('@OneToMany(() => Posts, posts => posts.users');
  });

  it('handles composite primary keys', () => {
    const sql = `
      CREATE TABLE user_roles (
        user_id INT NOT NULL,
        role_id INT NOT NULL,
        PRIMARY KEY (user_id, role_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (role_id) REFERENCES roles(id)
      );
    `;
    
    const ir = sqlToIR(sql);
    const typeorm = irToTypeorm(ir);
    
    expect(typeorm).toContain('// Composite primary key: [user_id, role_id]');
    expect(typeorm).toContain('// Note: TypeORM composite keys require additional configuration');
  });

  it('handles various data types', () => {
    const sql = `CREATE TABLE products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      description TEXT
    );`;
    
    const ir = sqlToIR(sql);
    const typeorm = irToTypeorm(ir);
    
    expect(typeorm).toContain('@Column("varchar", { length: 255 })');
    expect(typeorm).toContain('@Column("decimal", { precision: 10, scale: 2 })');
    expect(typeorm).toContain('@Column("boolean", { nullable: true, default: \'true\' })');
    expect(typeorm).toContain('@Column("timestamp", { nullable: true, default: \'CURRENT_TIMESTAMP\' })');
    expect(typeorm).toContain('@Column("text", { nullable: true })');
  });

  it('handles nullable columns', () => {
    const sql = `CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      nickname VARCHAR(255)
    );`;
    
    const ir = sqlToIR(sql);
    const typeorm = irToTypeorm(ir);
    
    expect(typeorm).toContain('name: string;');
    expect(typeorm).toContain('nickname: string | null;');
    expect(typeorm).toContain('nullable: true');
  });

  it('handles foreign key constraints with CASCADE and NO ACTION', () => {
    const sql = `CREATE TABLE cliente ( id SERIAL PRIMARY KEY );
CREATE TABLE pedido (
  id SERIAL PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES cliente(id) ON DELETE CASCADE ON UPDATE NO ACTION
);`;
    
    const ir = sqlToIR(sql);
    const typeorm = irToTypeorm(ir);
    
    expect(typeorm).toContain('@ManyToOne(() => Cliente, { onDelete: \'CASCADE\', onUpdate: \'NO ACTION\' })');
    expect(typeorm).toContain('@JoinColumn({ name: \'cliente_id\' })');
    expect(typeorm).toContain('cliente: Cliente;');
  });
});
