import { describe, it, expect } from 'vitest';
import { irToSupabase, generateRLSPolicyTemplates } from '../src/ecosystem/supabase';
import type { IRDiagram } from '../src/ir';

const testDiagram: IRDiagram = {
  tables: [
    {
      name: 'User',
      columns: [
        { name: 'id', type: 'UUID', isPrimaryKey: true },
        { name: 'name', type: 'VARCHAR(100)' },
        { name: 'email', type: 'VARCHAR(255)', isUnique: true },
        { name: 'age', type: 'INTEGER', isOptional: true },
        { name: 'is_active', type: 'BOOLEAN', default: 'true' },
      ],
    },
    {
      name: 'Post',
      columns: [
        { name: 'id', type: 'UUID', isPrimaryKey: true },
        { name: 'title', type: 'VARCHAR(200)' },
        { name: 'content', type: 'TEXT', isOptional: true },
        { name: 'user_id', type: 'UUID', references: { table: 'User', column: 'id', onDelete: 'CASCADE' } },
        { name: 'published_at', type: 'TIMESTAMPTZ', isOptional: true },
      ],
    },
  ],
};

describe('Supabase Generator', () => {
  describe('irToSupabase', () => {
    it('generates PostgreSQL-compatible SQL with Supabase extensions', () => {
      const result = irToSupabase(testDiagram);
      
      expect(result).toContain('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      expect(result).toContain('CREATE TABLE "User"');
      expect(result).toContain('CREATE TABLE "Post"');
      expect(result).toContain('ALTER TABLE "User" ENABLE ROW LEVEL SECURITY');
    });

    it('maps SQL types to PostgreSQL/Supabase types correctly', () => {
      const result = irToSupabase(testDiagram);
      
      expect(result).toContain('"id" UUID'); // UUID type
      expect(result).toContain('"name" VARCHAR(100)'); // VARCHAR with length
      expect(result).toContain('"age" INTEGER'); // INTEGER
      expect(result).toContain('"is_active" BOOLEAN'); // BOOLEAN
      expect(result).toContain('"published_at" TIMESTAMPTZ'); // TIMESTAMPTZ for timestamps
    });

    it('handles primary keys correctly', () => {
      const result = irToSupabase(testDiagram);
      
      expect(result).toContain('PRIMARY KEY ("id")');
    });

    it('handles NOT NULL constraints', () => {
      const result = irToSupabase(testDiagram);
      
      expect(result).toContain('"name" VARCHAR(100) NOT NULL');
      expect(result).toContain('"email" VARCHAR(255) NOT NULL UNIQUE');
      expect(result).toContain('"age" INTEGER'); // optional, no NOT NULL
    });

    it('handles UNIQUE constraints', () => {
      const result = irToSupabase(testDiagram);
      
      expect(result).toContain('"email" VARCHAR(255) NOT NULL UNIQUE');
    });

    it('handles DEFAULT values', () => {
      const result = irToSupabase(testDiagram);
      
      expect(result).toContain('"is_active" BOOLEAN NOT NULL DEFAULT TRUE');
    });

    it('handles foreign key constraints', () => {
      const result = irToSupabase(testDiagram);
      
      expect(result).toContain('FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE');
    });

    it('includes audit columns when enabled', () => {
      const result = irToSupabase(testDiagram, { includeAuditColumns: true });
      
      expect(result).toContain('"created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL');
      expect(result).toContain('"updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL');
    });

    it('excludes audit columns when disabled', () => {
      const result = irToSupabase(testDiagram, { includeAuditColumns: false });
      
      expect(result).not.toContain('"created_at" TIMESTAMPTZ DEFAULT NOW()');
      expect(result).not.toContain('"updated_at" TIMESTAMPTZ DEFAULT NOW()');
    });

    it('generates RLS policies when enabled', () => {
      const result = irToSupabase(testDiagram, { includeRLS: true, defaultRLSPolicy: 'authenticated' });
      
      expect(result).toContain('ALTER TABLE "User" ENABLE ROW LEVEL SECURITY');
      expect(result).toContain('ALTER TABLE "Post" ENABLE ROW LEVEL SECURITY');
      expect(result).toContain('CREATE POLICY "User_select_policy"');
      expect(result).toContain('FOR SELECT TO authenticated');
    });

    it('excludes RLS when disabled', () => {
      const result = irToSupabase(testDiagram, { includeRLS: false });
      
      expect(result).not.toContain('ENABLE ROW LEVEL SECURITY');
      expect(result).not.toContain('CREATE POLICY');
    });

    it('generates public RLS policies', () => {
      const result = irToSupabase(testDiagram, { defaultRLSPolicy: 'public' });
      
      expect(result).toContain('FOR SELECT');
      expect(result).toContain('USING (true)'); // public access
      expect(result).not.toContain('TO authenticated'); // no role restriction
    });

    it('generates authenticated RLS policies', () => {
      const result = irToSupabase(testDiagram, { defaultRLSPolicy: 'authenticated' });
      
      expect(result).toContain('FOR SELECT TO authenticated');
      expect(result).toContain('FOR INSERT TO authenticated');
      expect(result).toContain('FOR UPDATE TO authenticated');
      expect(result).toContain('FOR DELETE TO authenticated');
    });

    it('generates owner-only RLS policies when user column exists', () => {
      const ownerDiagram: IRDiagram = {
        tables: [{
          name: 'UserPost',
          columns: [
            { name: 'id', type: 'UUID', isPrimaryKey: true },
            { name: 'title', type: 'VARCHAR(100)' },
            { name: 'user_id', type: 'UUID' }, // owner column
          ],
        }],
      };
      
      const result = irToSupabase(ownerDiagram, { defaultRLSPolicy: 'owner-only' });
      
      expect(result).toContain('USING ("user_id" = auth.uid())');
      expect(result).toContain('WITH CHECK ("user_id" = auth.uid())');
    });

    it('includes database functions when enabled', () => {
      const result = irToSupabase(testDiagram, { 
        includeFunctions: true,
        includeUpdatedAtTriggers: true 
      });
      
      expect(result).toContain('CREATE OR REPLACE FUNCTION update_updated_at_column()');
      expect(result).toContain('RETURNS TRIGGER');
      expect(result).toContain('LANGUAGE plpgsql');
    });

    it('generates indexes for foreign keys', () => {
      const result = irToSupabase(testDiagram);
      
      expect(result).toContain('CREATE INDEX "idx_Post_user_id" ON "Post" ("user_id")');
    });

    it('generates indexes for unique columns', () => {
      const result = irToSupabase(testDiagram);
      
      expect(result).toContain('CREATE UNIQUE INDEX "idx_User_email_unique" ON "User" ("email")');
    });

    it('generates triggers for updated_at when enabled', () => {
      const result = irToSupabase(testDiagram, { 
        includeUpdatedAtTriggers: true,
        includeAuditColumns: true 
      });
      
      expect(result).toContain('CREATE TRIGGER "update_User_updated_at"');
      expect(result).toContain('BEFORE UPDATE ON "User"');
      expect(result).toContain('EXECUTE FUNCTION update_updated_at_column()');
    });

    it('handles custom schema names', () => {
      const result = irToSupabase(testDiagram, { schemaName: 'custom_schema' });
      
      expect(result).toContain('CREATE TABLE "custom_schema"."User"');
      expect(result).toContain('CREATE TABLE "custom_schema"."Post"');
      expect(result).toContain('REFERENCES "custom_schema"."User"');
    });

    it('handles SERIAL types with identity columns', () => {
      const serialDiagram: IRDiagram = {
        tables: [{
          name: 'Counter',
          columns: [
            { name: 'id', type: 'SERIAL', isPrimaryKey: true },
            { name: 'value', type: 'INTEGER' },
          ],
        }],
      };
      
      const result = irToSupabase(serialDiagram);
      
      expect(result).toContain('"id" BIGINT GENERATED BY DEFAULT AS IDENTITY');
    });

    it('prefers JSONB over JSON', () => {
      const jsonDiagram: IRDiagram = {
        tables: [{
          name: 'Document',
          columns: [
            { name: 'id', type: 'UUID', isPrimaryKey: true },
            { name: 'data', type: 'JSON' },
            { name: 'metadata', type: 'JSONB' },
          ],
        }],
      };
      
      const result = irToSupabase(jsonDiagram);
      
      expect(result).toContain('"data" JSONB'); // JSON -> JSONB
      expect(result).toContain('"metadata" JSONB'); // JSONB -> JSONB
    });
  });

  describe('generateRLSPolicyTemplates', () => {
    it('generates policy templates for all tables', () => {
      const templates = generateRLSPolicyTemplates(testDiagram);
      
      expect(templates).toContain('-- Policies for User table');
      expect(templates).toContain('-- Policies for Post table');
      expect(templates).toContain('CREATE POLICY "User_select_policy"');
      expect(templates).toContain('CREATE POLICY "Post_insert_policy"');
    });

    it('includes all CRUD operations', () => {
      const templates = generateRLSPolicyTemplates(testDiagram);
      
      expect(templates).toContain('FOR SELECT');
      expect(templates).toContain('FOR INSERT');
      expect(templates).toContain('FOR UPDATE');
      expect(templates).toContain('FOR DELETE');
    });

    it('includes customization comments', () => {
      const templates = generateRLSPolicyTemplates(testDiagram);
      
      expect(templates).toContain('-- Customize this condition');
      expect(templates).toContain('-- Who can read User records?');
      expect(templates).toContain('-- Who can create Post records?');
    });
  });

  describe('edge cases', () => {
    it('handles empty diagram', () => {
      const emptyDiagram: IRDiagram = { tables: [] };
      const result = irToSupabase(emptyDiagram);
      
      expect(result).toContain('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      expect(result).not.toContain('CREATE TABLE');
    });

    it('handles table with no columns', () => {
      const diagram: IRDiagram = {
        tables: [{ name: 'Empty', columns: [] }],
      };
      const result = irToSupabase(diagram);
      
      expect(result).toContain('CREATE TABLE "Empty" (');
      expect(result).toContain(');'); // Empty table
    });
  });

  describe('snapshot tests', () => {
    it('matches expected Supabase output', () => {
      const result = irToSupabase({
        tables: [testDiagram.tables[0]] // Just User table
      }, {
        includeRLS: true,
        defaultRLSPolicy: 'authenticated',
        includeAuditColumns: true,
        includeUpdatedAtTriggers: true,
      });

      expect(result).toMatchInlineSnapshot(`
        "-- Enable UUID extension
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        -- Database functions

        -- Function to automatically update updated_at column
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create tables
        CREATE TABLE "User" (
          "id" UUID NOT NULL,
          "name" VARCHAR(100) NOT NULL,
          "email" VARCHAR(255) NOT NULL UNIQUE,
          "age" INTEGER,
          "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
          "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          PRIMARY KEY ("id")
        );

        -- Create indexes
        CREATE UNIQUE INDEX "idx_User_email_unique" ON "User" ("email");

        -- Enable Row Level Security
        ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        CREATE POLICY "User_select_policy" ON "User" FOR SELECT TO authenticated USING (true);
        CREATE POLICY "User_insert_policy" ON "User" FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "User_update_policy" ON "User" FOR UPDATE TO authenticated USING (true);
        CREATE POLICY "User_delete_policy" ON "User" FOR DELETE TO authenticated USING (true);

        -- Create triggers
        CREATE TRIGGER "update_User_updated_at"
          BEFORE UPDATE ON "User"
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();"
      `);
    });
  });
});