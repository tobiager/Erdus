import type { IRSchema } from '../../ir';
import { toSupabaseSQL } from '../../generators/supabase';
import type { MigrationOptions } from '../index';

/**
 * Emit PostgreSQL SQL from IR Schema
 * Reuses the Supabase generator for consistency
 */
export function emitPostgresSQL(
  ir: IRSchema,
  options: MigrationOptions = {}
): string {
  const { schema = 'public', withRLS = false } = options;
  
  // Use the Supabase generator as it produces standard PostgreSQL
  const sql = toSupabaseSQL(ir, {
    withRLS,
    schema,
    includeComments: options.preserveComments !== false
  });
  
  return sql;
}