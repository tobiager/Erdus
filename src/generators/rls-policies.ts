import { z } from 'zod';
import { IRDiagram, IRTable, IRColumn } from '../ir';
import { RLSPolicy, RLSPolicySchema } from '../types';

export interface RLSOptions {
  includeComments?: boolean;
  enableRLS?: boolean;
  defaultRole?: string;
  generateSelectPolicies?: boolean;
  generateInsertPolicies?: boolean;
  generateUpdatePolicies?: boolean;
  generateDeletePolicies?: boolean;
}

const RLSOptionsSchema = z.object({
  includeComments: z.boolean().optional().default(true),
  enableRLS: z.boolean().optional().default(true),
  defaultRole: z.string().optional().default('authenticated'),
  generateSelectPolicies: z.boolean().optional().default(true),
  generateInsertPolicies: z.boolean().optional().default(true),
  generateUpdatePolicies: z.boolean().optional().default(true),
  generateDeletePolicies: z.boolean().optional().default(false),
});

/**
 * Generate Row Level Security (RLS) policies for PostgreSQL/Supabase
 * Creates basic policies based on table structure and common patterns
 */
export function generateRLSPolicies(diagram: IRDiagram, options: RLSOptions = {}): string {
  const opts = RLSOptionsSchema.parse(options);
  const statements: string[] = [];

  // Add header comment if enabled
  if (opts.includeComments) {
    statements.push('-- Generated Row Level Security (RLS) Policies');
    statements.push('-- Created by Erdus Migration Tool');
    statements.push('-- Customize these policies based on your security requirements');
    statements.push('');
  }

  for (const table of diagram.tables) {
    statements.push(...generateTableRLSPolicies(table, opts));
    statements.push('');
  }

  return statements.join('\n');
}

function generateTableRLSPolicies(table: IRTable, options: RLSOptions): string[] {
  const statements: string[] = [];
  
  if (options.includeComments) {
    statements.push(`-- RLS policies for table: ${table.name}`);
  }

  // Enable RLS on the table
  if (options.enableRLS) {
    statements.push(`ALTER TABLE "${table.name}" ENABLE ROW LEVEL SECURITY;`);
    statements.push('');
  }

  // Analyze table structure to determine policy patterns
  const hasUserIdColumn = table.columns.some(col => 
    col.name.toLowerCase().includes('user') && col.name.toLowerCase().includes('id')
  );
  const hasCreatedByColumn = table.columns.some(col => 
    col.name.toLowerCase().includes('created') && col.name.toLowerCase().includes('by')
  );
  const hasOwnerColumn = table.columns.some(col => 
    col.name.toLowerCase().includes('owner')
  );

  // Determine the user identification column
  let userColumn: string | undefined;
  if (hasUserIdColumn) {
    userColumn = table.columns.find(col => 
      col.name.toLowerCase().includes('user') && col.name.toLowerCase().includes('id')
    )?.name;
  } else if (hasCreatedByColumn) {
    userColumn = table.columns.find(col => 
      col.name.toLowerCase().includes('created') && col.name.toLowerCase().includes('by')
    )?.name;
  } else if (hasOwnerColumn) {
    userColumn = table.columns.find(col => 
      col.name.toLowerCase().includes('owner')
    )?.name;
  }

  // Generate SELECT policy
  if (options.generateSelectPolicies) {
    if (userColumn) {
      statements.push(`CREATE POLICY "Users can view own ${table.name}" ON "${table.name}"`);
      statements.push(`  FOR SELECT USING ("${userColumn}" = auth.uid());`);
    } else {
      statements.push(`CREATE POLICY "Users can view ${table.name}" ON "${table.name}"`);
      statements.push(`  FOR SELECT USING (auth.role() = '${options.defaultRole}');`);
    }
    statements.push('');
  }

  // Generate INSERT policy
  if (options.generateInsertPolicies) {
    if (userColumn) {
      statements.push(`CREATE POLICY "Users can insert own ${table.name}" ON "${table.name}"`);
      statements.push(`  FOR INSERT WITH CHECK ("${userColumn}" = auth.uid());`);
    } else {
      statements.push(`CREATE POLICY "Users can insert ${table.name}" ON "${table.name}"`);
      statements.push(`  FOR INSERT WITH CHECK (auth.role() = '${options.defaultRole}');`);
    }
    statements.push('');
  }

  // Generate UPDATE policy
  if (options.generateUpdatePolicies) {
    if (userColumn) {
      statements.push(`CREATE POLICY "Users can update own ${table.name}" ON "${table.name}"`);
      statements.push(`  FOR UPDATE USING ("${userColumn}" = auth.uid())`);
      statements.push(`  WITH CHECK ("${userColumn}" = auth.uid());`);
    } else {
      statements.push(`CREATE POLICY "Users can update ${table.name}" ON "${table.name}"`);
      statements.push(`  FOR UPDATE USING (auth.role() = '${options.defaultRole}')`);
      statements.push(`  WITH CHECK (auth.role() = '${options.defaultRole}');`);
    }
    statements.push('');
  }

  // Generate DELETE policy
  if (options.generateDeletePolicies) {
    if (userColumn) {
      statements.push(`CREATE POLICY "Users can delete own ${table.name}" ON "${table.name}"`);
      statements.push(`  FOR DELETE USING ("${userColumn}" = auth.uid());`);
    } else {
      statements.push(`CREATE POLICY "Users can delete ${table.name}" ON "${table.name}"`);
      statements.push(`  FOR DELETE USING (auth.role() = '${options.defaultRole}');`);
    }
    statements.push('');
  }

  return statements;
}

/**
 * Generate custom RLS policies from policy definitions
 */
export function generateCustomRLSPolicies(policies: RLSPolicy[], options: RLSOptions = {}): string {
  const opts = RLSOptionsSchema.parse(options);
  const statements: string[] = [];

  // Add header comment if enabled
  if (opts.includeComments) {
    statements.push('-- Custom Row Level Security (RLS) Policies');
    statements.push('-- Created by Erdus Migration Tool');
    statements.push('');
  }

  for (const policy of policies) {
    // Validate policy
    const validatedPolicy = RLSPolicySchema.parse(policy);
    
    if (opts.includeComments) {
      statements.push(`-- Policy: ${validatedPolicy.name}`);
    }

    let stmt = `CREATE POLICY "${validatedPolicy.name}" ON "${validatedPolicy.table}"`;
    
    if (validatedPolicy.role) {
      stmt += ` TO ${validatedPolicy.role}`;
    }
    
    stmt += ` FOR ${validatedPolicy.command}`;
    
    if (validatedPolicy.using) {
      stmt += ` USING (${validatedPolicy.using})`;
    }
    
    if (validatedPolicy.withCheck) {
      stmt += ` WITH CHECK (${validatedPolicy.withCheck})`;
    }
    
    stmt += ';';
    statements.push(stmt);
    statements.push('');
  }

  return statements.join('\n');
}

/**
 * Generate Supabase-specific RLS helper functions and policies
 */
export function generateSupabaseRLSHelpers(diagram: IRDiagram, options: RLSOptions = {}): string {
  const opts = RLSOptionsSchema.parse(options);
  const statements: string[] = [];

  // Add header comment if enabled
  if (opts.includeComments) {
    statements.push('-- Supabase RLS Helper Functions and Policies');
    statements.push('-- Created by Erdus Migration Tool');
    statements.push('');
  }

  // Create helper functions for common RLS patterns
  statements.push('-- Helper function to check if user is authenticated');
  statements.push('CREATE OR REPLACE FUNCTION auth.is_authenticated()');
  statements.push('RETURNS BOOLEAN AS $$');
  statements.push('BEGIN');
  statements.push('  RETURN auth.uid() IS NOT NULL;');
  statements.push('END;');
  statements.push('$$ LANGUAGE plpgsql SECURITY DEFINER;');
  statements.push('');

  statements.push('-- Helper function to check if user is admin');
  statements.push('CREATE OR REPLACE FUNCTION auth.is_admin()');
  statements.push('RETURNS BOOLEAN AS $$');
  statements.push('BEGIN');
  statements.push('  RETURN auth.jwt() ->> \'role\' = \'admin\';');
  statements.push('END;');
  statements.push('$$ LANGUAGE plpgsql SECURITY DEFINER;');
  statements.push('');

  // Generate policies using helper functions
  for (const table of diagram.tables) {
    if (opts.includeComments) {
      statements.push(`-- Supabase policies for table: ${table.name}`);
    }

    statements.push(`ALTER TABLE "${table.name}" ENABLE ROW LEVEL SECURITY;`);
    statements.push('');

    // Admin access policy
    statements.push(`CREATE POLICY "Admin full access to ${table.name}" ON "${table.name}"`);
    statements.push('  FOR ALL USING (auth.is_admin());');
    statements.push('');

    // Authenticated user policies
    const userColumn = table.columns.find(col => 
      col.name.toLowerCase().includes('user') && col.name.toLowerCase().includes('id')
    );

    if (userColumn) {
      statements.push(`CREATE POLICY "Users can manage own ${table.name}" ON "${table.name}"`);
      statements.push(`  FOR ALL USING ("${userColumn.name}" = auth.uid());`);
    } else {
      statements.push(`CREATE POLICY "Authenticated users can access ${table.name}" ON "${table.name}"`);
      statements.push('  FOR SELECT USING (auth.is_authenticated());');
    }
    statements.push('');
  }

  return statements.join('\n');
}

/**
 * Generate RLS policies for common application patterns
 */
export function generatePatternBasedRLS(diagram: IRDiagram, pattern: 'multi-tenant' | 'user-owned' | 'public-read', options: RLSOptions = {}): string {
  const opts = RLSOptionsSchema.parse(options);
  const statements: string[] = [];

  // Add header comment if enabled
  if (opts.includeComments) {
    statements.push(`-- ${pattern.toUpperCase()} RLS Pattern Policies`);
    statements.push('-- Created by Erdus Migration Tool');
    statements.push('');
  }

  switch (pattern) {
    case 'multi-tenant':
      statements.push(...generateMultiTenantRLS(diagram, opts));
      break;
    case 'user-owned':
      statements.push(...generateUserOwnedRLS(diagram, opts));
      break;
    case 'public-read':
      statements.push(...generatePublicReadRLS(diagram, opts));
      break;
  }

  return statements.join('\n');
}

function generateMultiTenantRLS(diagram: IRDiagram, options: RLSOptions): string[] {
  const statements: string[] = [];

  for (const table of diagram.tables) {
    const tenantColumn = table.columns.find(col => 
      col.name.toLowerCase().includes('tenant') || 
      col.name.toLowerCase().includes('organization') ||
      col.name.toLowerCase().includes('company')
    );

    if (tenantColumn) {
      statements.push(`ALTER TABLE "${table.name}" ENABLE ROW LEVEL SECURITY;`);
      statements.push('');
      
      statements.push(`CREATE POLICY "Tenant isolation for ${table.name}" ON "${table.name}"`);
      statements.push(`  FOR ALL USING ("${tenantColumn.name}" = auth.jwt() ->> 'tenant_id');`);
      statements.push('');
    }
  }

  return statements;
}

function generateUserOwnedRLS(diagram: IRDiagram, options: RLSOptions): string[] {
  const statements: string[] = [];

  for (const table of diagram.tables) {
    const userColumn = table.columns.find(col => 
      col.name.toLowerCase().includes('user') && col.name.toLowerCase().includes('id')
    );

    if (userColumn) {
      statements.push(`ALTER TABLE "${table.name}" ENABLE ROW LEVEL SECURITY;`);
      statements.push('');
      
      statements.push(`CREATE POLICY "User ownership for ${table.name}" ON "${table.name}"`);
      statements.push(`  FOR ALL USING ("${userColumn.name}" = auth.uid());`);
      statements.push('');
    }
  }

  return statements;
}

function generatePublicReadRLS(diagram: IRDiagram, options: RLSOptions): string[] {
  const statements: string[] = [];

  for (const table of diagram.tables) {
    statements.push(`ALTER TABLE "${table.name}" ENABLE ROW LEVEL SECURITY;`);
    statements.push('');
    
    statements.push(`CREATE POLICY "Public read access to ${table.name}" ON "${table.name}"`);
    statements.push('  FOR SELECT USING (true);');
    statements.push('');
    
    statements.push(`CREATE POLICY "Authenticated write access to ${table.name}" ON "${table.name}"`);
    statements.push('  FOR INSERT WITH CHECK (auth.is_authenticated());');
    statements.push('');
    
    statements.push(`CREATE POLICY "Authenticated update access to ${table.name}" ON "${table.name}"`);
    statements.push('  FOR UPDATE USING (auth.is_authenticated());');
    statements.push('');
  }

  return statements;
}