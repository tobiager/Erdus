import type { IRDiagram, IRTable, IRColumn } from './ir';

interface SupabaseTableOptions {
  rls?: boolean;
  policies?: SupabasePolicy[];
}

interface SupabasePolicy {
  name: string;
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  role?: string;
  using?: string;
  withCheck?: string;
}

function mapSqlTypeToSupabase(sqlType: string): string {
  const upperType = sqlType.toUpperCase();
  
  // Integer types
  if (upperType.startsWith('BIGINT') || upperType === 'BIGSERIAL') {
    return 'bigint';
  }
  if (upperType.startsWith('SMALLINT')) {
    return 'smallint';
  }
  if (upperType.startsWith('INT') || upperType === 'INTEGER' || upperType === 'SERIAL') {
    return 'integer';
  }
  
  // Decimal/numeric types
  const decimalMatch = upperType.match(/^(DECIMAL|NUMERIC)\((\d+),(\d+)\)$/);
  if (decimalMatch) {
    return `numeric(${decimalMatch[2]},${decimalMatch[3]})`;
  }
  if (upperType === 'DECIMAL' || upperType === 'NUMERIC') {
    return 'numeric';
  }
  if (upperType.startsWith('FLOAT') || upperType.startsWith('DOUBLE')) {
    return 'double precision';
  }
  if (upperType.startsWith('REAL')) {
    return 'real';
  }
  
  // String types
  const varcharMatch = upperType.match(/^VARCHAR\((\d+)\)$/);
  if (varcharMatch) {
    return `varchar(${varcharMatch[1]})`;
  }
  
  const charMatch = upperType.match(/^CHAR\((\d+)\)$/);
  if (charMatch) {
    return `char(${charMatch[1]})`;
  }
  
  if (upperType === 'TEXT') {
    return 'text';
  }
  
  // Date/time types
  if (upperType === 'DATE') {
    return 'date';
  }
  if (upperType === 'DATETIME' || upperType === 'TIMESTAMP') {
    return 'timestamp';
  }
  if (upperType === 'TIMESTAMPTZ') {
    return 'timestamptz';
  }
  
  // Boolean type
  if (upperType === 'BOOLEAN' || upperType === 'BOOL') {
    return 'boolean';
  }
  
  // UUID type (common in Supabase)
  if (upperType === 'UUID') {
    return 'uuid';
  }
  
  // JSON types (PostgreSQL/Supabase specific)
  if (upperType === 'JSON') {
    return 'json';
  }
  if (upperType === 'JSONB') {
    return 'jsonb';
  }
  
  // Default fallback
  return 'text';
}

function generateConstraintName(tableName: string, columnName: string, constraintType: string): string {
  return `${tableName}_${columnName}_${constraintType}`;
}

function generateDefaultRLSPolicies(tableName: string): SupabasePolicy[] {
  return [
    {
      name: `Enable read access for all users on ${tableName}`,
      command: 'SELECT',
      role: 'public',
      using: 'true'
    },
    {
      name: `Enable insert for authenticated users only on ${tableName}`,
      command: 'INSERT',
      role: 'authenticated',
      withCheck: 'true'
    },
    {
      name: `Enable update for users based on user_id on ${tableName}`,
      command: 'UPDATE',
      role: 'authenticated',
      using: 'auth.uid() = user_id',
      withCheck: 'auth.uid() = user_id'
    },
    {
      name: `Enable delete for users based on user_id on ${tableName}`,
      command: 'DELETE',
      role: 'authenticated',
      using: 'auth.uid() = user_id'
    }
  ];
}

/**
 * Convert canonical IR to Supabase SQL schema with optional RLS policies.
 */
export function irToSupabase(diagram: IRDiagram, options?: { enableRLS?: boolean }): string {
  const enableRLS = options?.enableRLS ?? false;
  const statements: string[] = [];
  
  // Add header comment
  statements.push('-- Supabase SQL Schema');
  statements.push('-- Generated from IR');
  statements.push('');
  
  // Create tables
  for (const table of diagram.tables) {
    const tableName = table.name;
    const columns: string[] = [];
    const constraints: string[] = [];
    
    // Process columns
    for (const column of table.columns) {
      const columnDef: string[] = [];
      columnDef.push(column.name);
      
      // Map type
      let supabaseType = mapSqlTypeToSupabase(column.type);
      
      // Handle auto-increment
      if (column.type.toUpperCase() === 'SERIAL') {
        supabaseType = 'serial';
      } else if (column.type.toUpperCase() === 'BIGSERIAL') {
        supabaseType = 'bigserial';
      }
      
      columnDef.push(supabaseType);
      
      // Handle constraints
      if (column.isPrimaryKey) {
        columnDef.push('PRIMARY KEY');
      }
      
      if (!column.isOptional && !column.isPrimaryKey) {
        columnDef.push('NOT NULL');
      }
      
      if (column.isUnique && !column.isPrimaryKey) {
        columnDef.push('UNIQUE');
      }
      
      if (column.default && !column.type.toUpperCase().includes('SERIAL')) {
        columnDef.push(`DEFAULT ${column.default}`);
      }
      
      columns.push('  ' + columnDef.join(' '));
    }
    
    // Add foreign key constraints
    for (const column of table.columns) {
      if (column.references) {
        const constraintName = generateConstraintName(tableName, column.name, 'fkey');
        let fkConstraint = `  CONSTRAINT ${constraintName} FOREIGN KEY (${column.name}) REFERENCES ${column.references.table}(${column.references.column})`;
        
        if (column.references.onUpdate) {
          fkConstraint += ` ON UPDATE ${column.references.onUpdate}`;
        }
        
        if (column.references.onDelete) {
          fkConstraint += ` ON DELETE ${column.references.onDelete}`;
        }
        
        constraints.push(fkConstraint);
      }
    }
    
    // Add indexes as constraints if needed
    if (table.indexes) {
      for (const index of table.indexes) {
        if (index.unique && index.columns.length > 1) {
          const constraintName = generateConstraintName(tableName, index.columns.join('_'), 'unique');
          constraints.push(`  CONSTRAINT ${constraintName} UNIQUE (${index.columns.join(', ')})`);
        }
      }
    }
    
    // Combine columns and constraints
    const allElements = [...columns, ...constraints];
    
    statements.push(`CREATE TABLE ${tableName} (`);
    statements.push(allElements.join(',\n'));
    statements.push(');');
    statements.push('');
    
    // Add indexes (non-unique)
    if (table.indexes) {
      for (const index of table.indexes) {
        if (!index.unique) {
          const indexName = `idx_${tableName}_${index.columns.join('_')}`;
          statements.push(`CREATE INDEX ${indexName} ON ${tableName} (${index.columns.join(', ')});`);
        }
      }
    }
    
    statements.push('');
  }
  
  // Add RLS policies if enabled
  if (enableRLS) {
    statements.push('-- Row Level Security (RLS) Policies');
    statements.push('');
    
    for (const table of diagram.tables) {
      const tableName = table.name;
      
      // Enable RLS
      statements.push(`ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`);
      statements.push('');
      
      // Check if table has user_id column for user-based policies
      const hasUserId = table.columns.some(col => col.name === 'user_id');
      
      if (hasUserId) {
        // Generate user-based policies
        const policies = generateDefaultRLSPolicies(tableName);
        
        for (const policy of policies) {
          statements.push(`CREATE POLICY "${policy.name}"`);
          statements.push(`  ON ${tableName}`);
          statements.push(`  FOR ${policy.command}`);
          
          if (policy.role) {
            statements.push(`  TO ${policy.role}`);
          }
          
          if (policy.using) {
            statements.push(`  USING (${policy.using})`);
          }
          
          if (policy.withCheck) {
            statements.push(`  WITH CHECK (${policy.withCheck})`);
          }
          
          statements.push(';');
          statements.push('');
        }
      } else {
        // Generate basic public read policy for tables without user_id
        statements.push(`CREATE POLICY "Enable read access for all users"`);
        statements.push(`  ON ${tableName}`);
        statements.push(`  FOR SELECT`);
        statements.push(`  TO public`);
        statements.push(`  USING (true);`);
        statements.push('');
        
        statements.push(`CREATE POLICY "Enable all operations for authenticated users"`);
        statements.push(`  ON ${tableName}`);
        statements.push(`  FOR ALL`);
        statements.push(`  TO authenticated`);
        statements.push(`  USING (true)`);
        statements.push(`  WITH CHECK (true);`);
        statements.push('');
      }
    }
  }
  
  // Add helpful functions for Supabase
  statements.push('-- Helpful functions for Supabase');
  statements.push('');
  statements.push('-- Function to update updated_at timestamp (if you have updated_at columns)');
  statements.push(`CREATE OR REPLACE FUNCTION update_updated_at_column()`);
  statements.push(`RETURNS TRIGGER AS $$`);
  statements.push(`BEGIN`);
  statements.push(`  NEW.updated_at = NOW();`);
  statements.push(`  RETURN NEW;`);
  statements.push(`END;`);
  statements.push(`$$ language 'plpgsql';`);
  statements.push('');
  
  statements.push('-- Example trigger for updated_at (uncomment and modify as needed)');
  statements.push('-- CREATE TRIGGER update_table_name_updated_at');
  statements.push('--   BEFORE UPDATE ON table_name');
  statements.push('--   FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();');
  statements.push('');
  
  return statements.join('\n');
}