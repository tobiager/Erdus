import { describe, it, expect } from 'vitest';
import { generateRLSPolicies, generateSupabaseRLSHelpers, generatePatternBasedRLS } from '../generators/rls-policies';

describe('RLS Policy Generator', () => {
  const sampleDiagram = {
    tables: [
      {
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'String',
            isPrimaryKey: true,
            isOptional: false
          },
          {
            name: 'email',
            type: 'String',
            isOptional: false,
            isUnique: true
          }
        ]
      },
      {
        name: 'posts',
        columns: [
          {
            name: 'id',
            type: 'String',
            isPrimaryKey: true,
            isOptional: false
          },
          {
            name: 'user_id',
            type: 'String',
            isOptional: false,
            references: {
              table: 'users',
              column: 'id'
            }
          },
          {
            name: 'title',
            type: 'String',
            isOptional: false
          },
          {
            name: 'content',
            type: 'String',
            isOptional: true
          }
        ]
      }
    ]
  };

  describe('Basic RLS Policies', () => {
    it('should generate basic RLS policies', () => {
      const policies = generateRLSPolicies(sampleDiagram, {
        includeComments: true
      });

      expect(policies).toContain('ALTER TABLE "users" ENABLE ROW LEVEL SECURITY');
      expect(policies).toContain('ALTER TABLE "posts" ENABLE ROW LEVEL SECURITY');
      expect(policies).toContain('CREATE POLICY');
      expect(policies).toContain('FOR SELECT');
      expect(policies).toContain('FOR INSERT');
      expect(policies).toContain('FOR UPDATE');
    });

    it('should detect user ownership patterns', () => {
      const policies = generateRLSPolicies(sampleDiagram, {
        includeComments: true
      });

      // Should detect user_id column in posts table
      expect(policies).toContain('"user_id" = auth.uid()');
    });

    it('should include comments when requested', () => {
      const policies = generateRLSPolicies(sampleDiagram, {
        includeComments: true
      });

      expect(policies).toContain('-- Generated Row Level Security');
      expect(policies).toContain('-- RLS policies for table:');
    });
  });

  describe('Supabase RLS Helpers', () => {
    it('should generate helper functions', () => {
      const helpers = generateSupabaseRLSHelpers(sampleDiagram, {
        includeComments: true
      });

      expect(helpers).toContain('CREATE OR REPLACE FUNCTION auth.is_authenticated()');
      expect(helpers).toContain('CREATE OR REPLACE FUNCTION auth.is_admin()');
      expect(helpers).toContain('auth.uid() IS NOT NULL');
      expect(helpers).toContain('auth.jwt()');
    });

    it('should generate admin and user policies', () => {
      const helpers = generateSupabaseRLSHelpers(sampleDiagram, {
        includeComments: true
      });

      expect(helpers).toContain('Admin full access');
      expect(helpers).toContain('auth.is_admin()');
      expect(helpers).toContain('auth.is_authenticated()');
    });
  });

  describe('Pattern-based RLS', () => {
    it('should generate multi-tenant policies', () => {
      const multiTenantDiagram = {
        tables: [
          {
            name: 'organizations',
            columns: [
              {
                name: 'id',
                type: 'String',
                isPrimaryKey: true,
                isOptional: false
              },
              {
                name: 'tenant_id',
                type: 'String',
                isOptional: false
              },
              {
                name: 'name',
                type: 'String',
                isOptional: false
              }
            ]
          }
        ]
      };

      const policies = generatePatternBasedRLS(multiTenantDiagram, 'multi-tenant', {
        includeComments: true
      });

      expect(policies).toContain('MULTI-TENANT RLS Pattern');
      expect(policies).toContain('tenant_id');
      expect(policies).toContain('auth.jwt()');
    });

    it('should generate user-owned policies', () => {
      const policies = generatePatternBasedRLS(sampleDiagram, 'user-owned', {
        includeComments: true
      });

      expect(policies).toContain('USER-OWNED RLS Pattern');
      expect(policies).toContain('user_id');
      expect(policies).toContain('auth.uid()');
    });

    it('should generate public-read policies', () => {
      const policies = generatePatternBasedRLS(sampleDiagram, 'public-read', {
        includeComments: true
      });

      expect(policies).toContain('PUBLIC-READ RLS Pattern');
      expect(policies).toContain('FOR SELECT USING (true)');
      expect(policies).toContain('auth.is_authenticated()');
    });
  });

  describe('Policy Options', () => {
    it('should respect policy generation options', () => {
      const policies = generateRLSPolicies(sampleDiagram, {
        generateSelectPolicies: true,
        generateInsertPolicies: false,
        generateUpdatePolicies: false,
        generateDeletePolicies: false
      });

      expect(policies).toContain('FOR SELECT');
      expect(policies).not.toContain('FOR INSERT');
      expect(policies).not.toContain('FOR UPDATE');
      expect(policies).not.toContain('FOR DELETE');
    });

    it('should use custom default role', () => {
      const policies = generateRLSPolicies(sampleDiagram, {
        defaultRole: 'custom_role'
      });

      expect(policies).toContain('custom_role');
    });
  });
});