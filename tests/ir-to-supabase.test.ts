import { describe, it, expect } from 'vitest';
import { irToSupabase } from '../src/ir-to-supabase';
import type { IRDiagram } from '../src/ir';

describe('IR to Supabase', () => {
  it('should convert basic table to Supabase SQL', () => {
    const diagram: IRDiagram = {
      tables: [{
        name: 'user',
        columns: [
          { name: 'id', type: 'SERIAL', isPrimaryKey: true },
          { name: 'name', type: 'VARCHAR(255)' },
          { name: 'email', type: 'VARCHAR(255)', isUnique: true },
          { name: 'age', type: 'INTEGER', isOptional: true }
        ]
      }]
    };

    const result = irToSupabase(diagram);

    expect(result).toContain('-- Supabase SQL Schema');
    expect(result).toContain('CREATE TABLE user (');
    expect(result).toContain('id serial PRIMARY KEY');
    expect(result).toContain('name varchar(255) NOT NULL');
    expect(result).toContain('email varchar(255) NOT NULL');
    expect(result).toContain('UNIQUE');
    expect(result).toContain('age integer');
    expect(result).not.toContain('age integer NOT NULL'); // Should be nullable
    expect(result).toContain('CREATE OR REPLACE FUNCTION update_updated_at_column()');
  });

  it('should handle foreign key relationships', () => {
    const diagram: IRDiagram = {
      tables: [
        {
          name: 'user',
          columns: [
            { name: 'id', type: 'SERIAL', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR(255)' }
          ]
        },
        {
          name: 'post',
          columns: [
            { name: 'id', type: 'SERIAL', isPrimaryKey: true },
            { name: 'title', type: 'VARCHAR(255)' },
            { name: 'user_id', type: 'INTEGER', references: { table: 'user', column: 'id', onDelete: 'CASCADE', onUpdate: 'RESTRICT' } }
          ]
        }
      ]
    };

    const result = irToSupabase(diagram);

    expect(result).toContain('CONSTRAINT post_user_id_fkey FOREIGN KEY (user_id) REFERENCES user(id) ON UPDATE RESTRICT ON DELETE CASCADE');
  });

  it('should generate RLS policies when enabled', () => {
    const diagram: IRDiagram = {
      tables: [{
        name: 'user',
        columns: [
          { name: 'id', type: 'SERIAL', isPrimaryKey: true },
          { name: 'name', type: 'VARCHAR(255)' },
          { name: 'user_id', type: 'UUID', references: { table: 'auth.users', column: 'id' } }
        ]
      }]
    };

    const result = irToSupabase(diagram, { enableRLS: true });

    expect(result).toContain('-- Row Level Security (RLS) Policies');
    expect(result).toContain('ALTER TABLE user ENABLE ROW LEVEL SECURITY;');
    expect(result).toContain('CREATE POLICY "Enable read access for all users on user"');
    expect(result).toContain('CREATE POLICY "Enable insert for authenticated users only on user"');
    expect(result).toContain('CREATE POLICY "Enable update for users based on user_id on user"');
    expect(result).toContain('CREATE POLICY "Enable delete for users based on user_id on user"');
    expect(result).toContain('auth.uid() = user_id');
  });

  it('should handle various data types', () => {
    const diagram: IRDiagram = {
      tables: [{
        name: 'test_types',
        columns: [
          { name: 'id', type: 'SERIAL', isPrimaryKey: true },
          { name: 'bigint_field', type: 'BIGINT' },
          { name: 'text_field', type: 'TEXT' },
          { name: 'bool_field', type: 'BOOLEAN' },
          { name: 'date_field', type: 'DATE' },
          { name: 'timestamp_field', type: 'TIMESTAMPTZ' },
          { name: 'decimal_field', type: 'DECIMAL(10,2)' },
          { name: 'uuid_field', type: 'UUID' },
          { name: 'json_field', type: 'JSONB' }
        ]
      }]
    };

    const result = irToSupabase(diagram);

    expect(result).toContain('bigint_field bigint NOT NULL');
    expect(result).toContain('text_field text NOT NULL');
    expect(result).toContain('bool_field boolean NOT NULL');
    expect(result).toContain('date_field date NOT NULL');
    expect(result).toContain('timestamp_field timestamptz NOT NULL');
    expect(result).toContain('decimal_field numeric(10,2) NOT NULL');
    expect(result).toContain('uuid_field uuid NOT NULL');
    expect(result).toContain('json_field jsonb NOT NULL');
  });

  it('should handle indexes', () => {
    const diagram: IRDiagram = {
      tables: [{
        name: 'user',
        columns: [
          { name: 'id', type: 'SERIAL', isPrimaryKey: true },
          { name: 'email', type: 'VARCHAR(255)' },
          { name: 'name', type: 'VARCHAR(255)' }
        ],
        indexes: [
          { columns: ['email'], unique: true },
          { columns: ['name'], unique: false },
          { columns: ['name', 'email'], unique: true }
        ]
      }]
    };

    const result = irToSupabase(diagram);

    expect(result).toContain('CREATE INDEX idx_user_name ON user (name);');
    expect(result).toContain('CONSTRAINT user_name_email_unique UNIQUE (name, email)');
  });

  it('should handle default values', () => {
    const diagram: IRDiagram = {
      tables: [{
        name: 'test_defaults',
        columns: [
          { name: 'id', type: 'SERIAL', isPrimaryKey: true },
          { name: 'status', type: 'VARCHAR(20)', default: "'active'" },
          { name: 'created_at', type: 'TIMESTAMP', default: 'now()' }
        ]
      }]
    };

    const result = irToSupabase(diagram);

    expect(result).toContain('status varchar(20) NOT NULL DEFAULT \'active\'');
    expect(result).toContain('created_at timestamp NOT NULL DEFAULT now()');
  });
});