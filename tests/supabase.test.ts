import { describe, it, expect } from 'vitest';
import { toSupabaseSQL } from '../src/generators/supabase';
import type { IRSchema } from '../src/ir';

describe('Supabase Generator', () => {
  it('should generate PostgreSQL schema for simple entity', () => {
    const ir: IRSchema = {
      entities: [
        {
          name: 'users',
          attributes: [
            { name: 'id', type: 'uuid', pk: true, nullable: false },
            { name: 'email', type: 'string', unique: true, nullable: false, length: 255 },
            { name: 'name', type: 'string', nullable: true },
            { name: 'created_at', type: 'timestamp', default: 'now()', nullable: false },
          ],
        },
      ],
      relations: [],
    };

    const sql = toSupabaseSQL(ir);
    
    expect(sql).toContain('CREATE TABLE users');
    expect(sql).toContain('id uuid NOT NULL PRIMARY KEY');
    expect(sql).toContain('email varchar(255) NOT NULL UNIQUE');
    expect(sql).toContain('name varchar');
    expect(sql).toContain('created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP');
    expect(sql).toContain('uuid-ossp');
    expect(sql).toContain('pgcrypto');
  });

  it('should generate RLS policies when enabled', () => {
    const ir: IRSchema = {
      entities: [
        {
          name: 'posts',
          attributes: [
            { name: 'id', type: 'uuid', pk: true, nullable: false },
            { name: 'title', type: 'string', nullable: false },
            { name: 'owner_id', type: 'uuid', nullable: false },
          ],
        },
      ],
      relations: [],
    };

    const sql = toSupabaseSQL(ir, { withRLS: true });
    
    expect(sql).toContain('ALTER TABLE posts ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('CREATE POLICY "owner_can_select_posts"');
    expect(sql).toContain('auth.uid() = owner_id');
  });

  it('should handle foreign key constraints', () => {
    const ir: IRSchema = {
      entities: [
        {
          name: 'users',
          attributes: [
            { name: 'id', type: 'uuid', pk: true, nullable: false },
            { name: 'email', type: 'string', nullable: false },
          ],
        },
        {
          name: 'posts',
          attributes: [
            { name: 'id', type: 'uuid', pk: true, nullable: false },
            { name: 'title', type: 'string', nullable: false },
            { 
              name: 'user_id', 
              type: 'uuid', 
              nullable: false,
              references: { table: 'users', column: 'id', onDelete: 'CASCADE' }
            },
          ],
        },
      ],
      relations: [],
    };

    const sql = toSupabaseSQL(ir);
    
    expect(sql).toContain('ALTER TABLE posts ADD CONSTRAINT fk_posts_user_id');
    expect(sql).toContain('FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE');
  });
});