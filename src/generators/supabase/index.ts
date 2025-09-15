import type { IRSchema, IREntity, IRAttribute } from '../../ir';
import { validateIRSchema } from '../../ir/validators';

export interface SupabaseOptions {
  withRLS?: boolean;
  schema?: string;
  includeComments?: boolean;
  createSchema?: boolean;
}

/**
 * Generate Supabase SQL schema from IR
 */
export function toSupabaseSQL(
  ir: IRSchema,
  options: SupabaseOptions = {}
): string {
  const validated = validateIRSchema(ir);
  const {
    withRLS = false,
    schema = 'public',
    includeComments = true,
    createSchema = false
  } = options;

  const lines: string[] = [];
  
  // Add header comment
  lines.push('-- Generated Supabase schema');
  lines.push('-- Generated on: ' + new Date().toISOString());
  lines.push('');

  // Create schema if requested
  if (createSchema && schema !== 'public') {
    lines.push(`CREATE SCHEMA IF NOT EXISTS ${schema};`);
    lines.push('');
  }

  // Create enums first
  if (validated.enums?.length) {
    lines.push('-- Enums');
    for (const enumDef of validated.enums) {
      lines.push(generateEnum(enumDef, schema));
    }
    lines.push('');
  }

  // Create tables
  lines.push('-- Tables');
  for (const entity of validated.entities) {
    lines.push(generateTable(entity, schema, includeComments));
    lines.push('');
  }

  // Add indexes
  const customIndexes = generateIndexes(validated.entities, schema);
  if (customIndexes.length > 0) {
    lines.push('-- Indexes');
    lines.push(...customIndexes);
    lines.push('');
  }

  // Add foreign key constraints
  const foreignKeys = generateForeignKeys(validated.entities, schema);
  if (foreignKeys.length > 0) {
    lines.push('-- Foreign Key Constraints');
    lines.push(...foreignKeys);
    lines.push('');
  }

  // Add check constraints
  if (validated.checks?.length) {
    lines.push('-- Check Constraints');
    for (const check of validated.checks) {
      lines.push(generateCheckConstraint(check, schema));
    }
    lines.push('');
  }

  // Add comments
  if (includeComments && validated.comments?.length) {
    lines.push('-- Comments');
    for (const comment of validated.comments) {
      lines.push(generateComment(comment, schema));
    }
    lines.push('');
  }

  // Add RLS policies if requested
  if (withRLS) {
    lines.push('-- Row Level Security');
    for (const entity of validated.entities) {
      lines.push(...generateRLSPolicies(entity, schema));
    }
    lines.push('');
  }

  return lines.join('\n');
}

function generateEnum(enumDef: any, schema: string): string {
  const schemaPrefix = schema !== 'public' ? `${schema}.` : '';
  const values = enumDef.values.map((v: string) => `'${v}'`).join(', ');
  return `CREATE TYPE ${schemaPrefix}${enumDef.name} AS ENUM (${values});`;
}

function generateTable(entity: IREntity, schema: string, includeComments: boolean): string {
  const schemaPrefix = schema !== 'public' ? `${schema}.` : '';
  const lines: string[] = [];
  
  lines.push(`CREATE TABLE ${schemaPrefix}"${entity.name}" (`);
  
  const columnDefs: string[] = [];
  const constraints: string[] = [];
  
  // Generate column definitions
  for (const attr of entity.attributes || entity.columns) {
    const columnDef = generateColumnDefinition(attr);
    columnDefs.push(`  ${columnDef}`);
  }
  
  // Add primary key constraint
  const pkColumns = (entity.attributes || entity.columns)
    .filter(attr => attr.isPrimaryKey)
    .map(attr => `"${attr.name}"`);
  
  if (pkColumns.length > 0) {
    constraints.push(`  CONSTRAINT "${entity.name}_pkey" PRIMARY KEY (${pkColumns.join(', ')})`);
  }
  
  // Add unique constraints
  if (entity.uniques?.length) {
    for (let i = 0; i < entity.uniques.length; i++) {
      const uniqueCols = entity.uniques[i].map(col => `"${col}"`).join(', ');
      constraints.push(`  CONSTRAINT "${entity.name}_unique_${i + 1}" UNIQUE (${uniqueCols})`);
    }
  }
  
  // Combine columns and constraints
  const allDefinitions = [...columnDefs, ...constraints];
  lines.push(allDefinitions.join(',\n'));
  lines.push(');');
  
  // Add table comment
  if (includeComments) {
    lines.push(`COMMENT ON TABLE ${schemaPrefix}"${entity.name}" IS 'Table ${entity.name}';`);
  }
  
  return lines.join('\n');
}

function generateColumnDefinition(attr: IRAttribute): string {
  const parts: string[] = [];
  
  // Column name
  parts.push(`"${attr.name}"`);
  
  // Data type
  const sqlType = mapToPostgresType(attr.type);
  parts.push(sqlType);
  
  // NOT NULL constraint
  if (!attr.isOptional) {
    parts.push('NOT NULL');
  }
  
  // UNIQUE constraint
  if (attr.isUnique) {
    parts.push('UNIQUE');
  }
  
  // DEFAULT value
  if (attr.default) {
    const defaultValue = formatDefaultValue(attr.default);
    parts.push(`DEFAULT ${defaultValue}`);
  }
  
  return parts.join(' ');
}

function generateIndexes(entities: IREntity[], schema: string): string[] {
  const schemaPrefix = schema !== 'public' ? `${schema}.` : '';
  const lines: string[] = [];
  
  for (const entity of entities) {
    if (!entity.indexes?.length) continue;
    
    for (let i = 0; i < entity.indexes.length; i++) {
      const index = entity.indexes[i];
      const indexName = `idx_${entity.name}_${index.columns.join('_')}`;
      const columns = index.columns.map(col => `"${col}"`).join(', ');
      const unique = index.unique ? 'UNIQUE ' : '';
      
      lines.push(`CREATE ${unique}INDEX "${indexName}" ON ${schemaPrefix}"${entity.name}" (${columns});`);
    }
  }
  
  return lines;
}

function generateForeignKeys(entities: IREntity[], schema: string): string[] {
  const schemaPrefix = schema !== 'public' ? `${schema}.` : '';
  const lines: string[] = [];
  
  for (const entity of entities) {
    for (const attr of entity.attributes || entity.columns) {
      if (!attr.references) continue;
      
      const constraintName = `fk_${entity.name}_${attr.name}`;
      const onDelete = attr.references.onDelete ? ` ON DELETE ${attr.references.onDelete}` : '';
      const onUpdate = attr.references.onUpdate ? ` ON UPDATE ${attr.references.onUpdate}` : '';
      
      lines.push(
        `ALTER TABLE ${schemaPrefix}"${entity.name}" ` +
        `ADD CONSTRAINT "${constraintName}" ` +
        `FOREIGN KEY ("${attr.name}") ` +
        `REFERENCES ${schemaPrefix}"${attr.references.table}" ("${attr.references.column}")` +
        `${onDelete}${onUpdate};`
      );
    }
  }
  
  return lines;
}

function generateCheckConstraint(check: any, schema: string): string {
  const schemaPrefix = schema !== 'public' ? `${schema}.` : '';
  const constraintName = check.name || `check_${check.table}`;
  
  return `ALTER TABLE ${schemaPrefix}"${check.table}" ADD CONSTRAINT "${constraintName}" CHECK (${check.expression});`;
}

function generateComment(comment: any, schema: string): string {
  const schemaPrefix = schema !== 'public' ? `${schema}.` : '';
  
  if (comment.column) {
    return `COMMENT ON COLUMN ${schemaPrefix}"${comment.table}"."${comment.column}" IS '${comment.text}';`;
  } else {
    return `COMMENT ON TABLE ${schemaPrefix}"${comment.table}" IS '${comment.text}';`;
  }
}

function generateRLSPolicies(entity: IREntity, schema: string): string[] {
  const schemaPrefix = schema !== 'public' ? `${schema}.` : '';
  const lines: string[] = [];
  
  // Enable RLS on table
  lines.push(`ALTER TABLE ${schemaPrefix}"${entity.name}" ENABLE ROW LEVEL SECURITY;`);
  lines.push('');
  
  // Check if table has an owner_id column for owner-based policies
  const hasOwnerId = (entity.attributes || entity.columns).some(
    attr => attr.name.toLowerCase() === 'owner_id' || attr.name.toLowerCase() === 'user_id'
  );
  
  if (hasOwnerId) {
    const ownerColumn = (entity.attributes || entity.columns).find(
      attr => attr.name.toLowerCase() === 'owner_id' || attr.name.toLowerCase() === 'user_id'
    )!.name;
    
    // Owner can select their own records
    lines.push(
      `CREATE POLICY "${entity.name}_owner_select" ON ${schemaPrefix}"${entity.name}" ` +
      `FOR SELECT USING (auth.uid()::text = "${ownerColumn}"::text);`
    );
    
    // Owner can update their own records
    lines.push(
      `CREATE POLICY "${entity.name}_owner_update" ON ${schemaPrefix}"${entity.name}" ` +
      `FOR UPDATE USING (auth.uid()::text = "${ownerColumn}"::text);`
    );
    
    // Owner can delete their own records
    lines.push(
      `CREATE POLICY "${entity.name}_owner_delete" ON ${schemaPrefix}"${entity.name}" ` +
      `FOR DELETE USING (auth.uid()::text = "${ownerColumn}"::text);`
    );
    
    // Authenticated users can insert (owner_id will be set to auth.uid())
    lines.push(
      `CREATE POLICY "${entity.name}_authenticated_insert" ON ${schemaPrefix}"${entity.name}" ` +
      `FOR INSERT WITH CHECK (auth.role() = 'authenticated');`
    );
  } else {
    // Generic authenticated user policies
    lines.push(
      `CREATE POLICY "${entity.name}_authenticated_all" ON ${schemaPrefix}"${entity.name}" ` +
      `FOR ALL USING (auth.role() = 'authenticated');`
    );
  }
  
  lines.push('');
  return lines;
}

function mapToPostgresType(sqlType: string): string {
  const type = sqlType.toLowerCase().trim();
  
  // Already PostgreSQL types
  if (isPostgresType(type)) {
    return sqlType;
  }
  
  // String types
  if (type.includes('varchar') || type.includes('nvarchar')) {
    const match = type.match(/\((\d+)\)/);
    return match ? `varchar(${match[1]})` : 'varchar';
  }
  
  if (type.includes('char') && !type.includes('var')) {
    const match = type.match(/\((\d+)\)/);
    return match ? `char(${match[1]})` : 'char';
  }
  
  if (type.includes('text') || type.includes('ntext')) {
    return 'text';
  }
  
  // Integer types
  if (type.includes('bigint')) {
    return 'bigint';
  }
  
  if (type.includes('smallint') || type.includes('tinyint')) {
    return 'smallint';
  }
  
  if (type.includes('int') || type.includes('integer')) {
    return 'integer';
  }
  
  // Serial types
  if (type.includes('bigserial')) {
    return 'bigserial';
  }
  
  if (type.includes('serial')) {
    return 'serial';
  }
  
  // Decimal types
  if (type.includes('decimal') || type.includes('numeric')) {
    const match = type.match(/\((\d+),(\d+)\)/);
    return match ? `numeric(${match[1]},${match[2]})` : 'numeric';
  }
  
  if (type.includes('money')) {
    return 'money';
  }
  
  if (type.includes('float') || type.includes('double')) {
    return 'double precision';
  }
  
  if (type.includes('real')) {
    return 'real';
  }
  
  // Boolean
  if (type.includes('bit') && !type.includes('orbit')) {
    return 'boolean';
  }
  
  if (type.includes('bool')) {
    return 'boolean';
  }
  
  // Date types
  if (type === 'date') {
    return 'date';
  }
  
  if (type === 'time') {
    return 'time';
  }
  
  if (type.includes('datetime') || type.includes('datetime2')) {
    return 'timestamp with time zone';
  }
  
  if (type.includes('timestamp')) {
    return type.includes('zone') ? 'timestamp with time zone' : 'timestamp';
  }
  
  // UUID
  if (type.includes('uniqueidentifier') || type.includes('guid')) {
    return 'uuid';
  }
  
  if (type.includes('uuid')) {
    return 'uuid';
  }
  
  // JSON
  if (type.includes('json')) {
    return 'jsonb';
  }
  
  // Binary
  if (type.includes('binary') || type.includes('varbinary') || 
      type.includes('blob') || type.includes('image')) {
    return 'bytea';
  }
  
  // XML
  if (type.includes('xml')) {
    return 'xml';
  }
  
  // Array types
  if (type.includes('[]')) {
    const baseType = type.replace('[]', '').trim();
    return `${mapToPostgresType(baseType)}[]`;
  }
  
  // Default fallback
  return 'text';
}

function isPostgresType(type: string): boolean {
  const postgresTypes = [
    'smallint', 'integer', 'bigint', 'decimal', 'numeric', 'real', 'double precision',
    'serial', 'bigserial', 'money', 'char', 'varchar', 'text', 'bytea',
    'timestamp', 'timestamp with time zone', 'timestamp without time zone',
    'date', 'time', 'time with time zone', 'time without time zone',
    'interval', 'boolean', 'point', 'line', 'lseg', 'box', 'path', 'polygon',
    'circle', 'cidr', 'inet', 'macaddr', 'macaddr8', 'bit', 'bit varying',
    'tsvector', 'tsquery', 'uuid', 'xml', 'json', 'jsonb', 'int4range',
    'int8range', 'numrange', 'tsrange', 'tstzrange', 'daterange'
  ];
  
  const baseType = type.split('(')[0].toLowerCase().trim();
  return postgresTypes.includes(baseType);
}

function formatDefaultValue(defaultExpr: string): string {
  if (!defaultExpr) return 'NULL';
  
  const expr = defaultExpr.trim();
  
  // Handle quoted strings (already properly formatted)
  if ((expr.startsWith("'") && expr.endsWith("'")) || 
      (expr.startsWith('"') && expr.endsWith('"'))) {
    return expr;
  }
  
  // Handle boolean values
  if (expr.toLowerCase() === 'true' || expr.toLowerCase() === 'false') {
    return expr.toLowerCase();
  }
  
  // Handle numbers
  if (/^\d+(\.\d+)?$/.test(expr)) {
    return expr;
  }
  
  // Handle common function calls
  const functionMappings: Record<string, string> = {
    'getdate()': 'now()',
    'getutcdate()': "now() AT TIME ZONE 'UTC'",
    'newid()': 'gen_random_uuid()',
    'uuid()': 'gen_random_uuid()',
    'current_timestamp': 'now()',
    'current_date': 'current_date',
    'current_time': 'current_time'
  };
  
  const lowerExpr = expr.toLowerCase();
  for (const [source, target] of Object.entries(functionMappings)) {
    if (lowerExpr === source) {
      return target;
    }
  }
  
  // If it looks like a function call, return as-is
  if (expr.includes('()') || expr.includes('(') || lowerExpr.includes('nextval')) {
    return expr;
  }
  
  // Default: wrap in single quotes
  return `'${expr}'`;
}