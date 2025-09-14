import type { IRDiagram, IRTable, IRColumn } from '../../ir';

/**
 * Types of changes that can occur between schemas
 */
export type ChangeType = 
  | 'table_added' 
  | 'table_removed' 
  | 'table_renamed'
  | 'column_added' 
  | 'column_removed' 
  | 'column_renamed'
  | 'column_type_changed'
  | 'column_constraint_added'
  | 'column_constraint_removed'
  | 'index_added'
  | 'index_removed'
  | 'foreign_key_added'
  | 'foreign_key_removed';

/**
 * Represents a single database schema change
 */
export interface SchemaChange {
  type: ChangeType;
  table: string;
  column?: string;
  oldValue?: unknown;
  newValue?: unknown;
  sql: string;
  /** Risk level for the operation (low, medium, high) */
  risk: 'low' | 'medium' | 'high';
  /** Human-readable description of the change */
  description: string;
  /** Potential issues or warnings about this change */
  warnings?: string[];
}

/**
 * Migration plan containing all changes to transform old schema to new
 */
export interface MigrationPlan {
  changes: SchemaChange[];
  /** Estimated complexity (simple, moderate, complex) */
  complexity: 'simple' | 'moderate' | 'complex';
  /** Total number of potentially breaking changes */
  breakingChanges: number;
  /** Migration SQL script */
  sql: string;
  /** Rollback SQL script (best effort) */
  rollbackSql?: string;
}

/**
 * Options for migration generation
 */
export interface DiffOptions {
  /** Include DROP operations for removed items */
  includeDrops?: boolean;
  /** Generate rollback SQL */
  generateRollback?: boolean;
  /** Schema name prefix */
  schemaName?: string;
  /** Allow destructive operations */
  allowDestructive?: boolean;
  /** Similarity threshold for detecting renames (0-1) */
  renameThreshold?: number;
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Find the best match for a table/column name in a list of candidates
 */
function findBestMatch(target: string, candidates: string[], threshold: number): string | null {
  let bestMatch: string | null = null;
  let bestSimilarity = 0;
  
  for (const candidate of candidates) {
    const similarity = calculateSimilarity(target, candidate);
    if (similarity > bestSimilarity && similarity >= threshold) {
      bestSimilarity = similarity;
      bestMatch = candidate;
    }
  }
  
  return bestMatch;
}

/**
 * Detect table changes between two schemas
 */
function detectTableChanges(
  oldDiagram: IRDiagram, 
  newDiagram: IRDiagram, 
  options: DiffOptions
): SchemaChange[] {
  const changes: SchemaChange[] = [];
  const oldTableNames = oldDiagram.tables.map(t => t.name);
  const newTableNames = newDiagram.tables.map(t => t.name);
  const oldTableMap = new Map(oldDiagram.tables.map(t => [t.name, t]));
  const newTableMap = new Map(newDiagram.tables.map(t => [t.name, t]));
  
  // Find removed tables
  for (const oldTable of oldDiagram.tables) {
    if (!newTableMap.has(oldTable.name)) {
      // Check if it might be renamed
      const bestMatch = findBestMatch(oldTable.name, newTableNames, options.renameThreshold || 0.7);
      
      if (bestMatch && !oldTableMap.has(bestMatch)) {
        // Likely a rename
        changes.push({
          type: 'table_renamed',
          table: oldTable.name,
          oldValue: oldTable.name,
          newValue: bestMatch,
          sql: `ALTER TABLE "${oldTable.name}" RENAME TO "${bestMatch}";`,
          risk: 'medium',
          description: `Rename table '${oldTable.name}' to '${bestMatch}'`,
          warnings: ['Table rename may break existing queries and application code'],
        });
      } else if (options.includeDrops) {
        // Actually removed
        changes.push({
          type: 'table_removed',
          table: oldTable.name,
          sql: `DROP TABLE "${oldTable.name}";`,
          risk: 'high',
          description: `Drop table '${oldTable.name}'`,
          warnings: ['This will permanently delete all data in the table'],
        });
      }
    }
  }
  
  // Find added tables
  for (const newTable of newDiagram.tables) {
    if (!oldTableMap.has(newTable.name)) {
      // Check if this is the target of a rename we already detected
      const isRenameTarget = changes.some(c => 
        c.type === 'table_renamed' && c.newValue === newTable.name
      );
      
      if (!isRenameTarget) {
        const createTableSQL = generateCreateTableSQL(newTable, options);
        changes.push({
          type: 'table_added',
          table: newTable.name,
          sql: createTableSQL,
          risk: 'low',
          description: `Create table '${newTable.name}'`,
        });
      }
    }
  }
  
  return changes;
}

/**
 * Detect column changes between two tables
 */
function detectColumnChanges(
  oldTable: IRTable, 
  newTable: IRTable, 
  options: DiffOptions
): SchemaChange[] {
  const changes: SchemaChange[] = [];
  const oldColumnNames = oldTable.columns.map(c => c.name);
  const newColumnNames = newTable.columns.map(c => c.name);
  const oldColumnMap = new Map(oldTable.columns.map(c => [c.name, c]));
  const newColumnMap = new Map(newTable.columns.map(c => [c.name, c]));
  
  // Find removed columns
  for (const oldColumn of oldTable.columns) {
    if (!newColumnMap.has(oldColumn.name)) {
      // Check if it might be renamed
      const bestMatch = findBestMatch(oldColumn.name, newColumnNames, options.renameThreshold || 0.7);
      
      if (bestMatch && !oldColumnMap.has(bestMatch)) {
        // Likely a rename
        changes.push({
          type: 'column_renamed',
          table: oldTable.name,
          column: oldColumn.name,
          oldValue: oldColumn.name,
          newValue: bestMatch,
          sql: `ALTER TABLE "${oldTable.name}" RENAME COLUMN "${oldColumn.name}" TO "${bestMatch}";`,
          risk: 'medium',
          description: `Rename column '${oldColumn.name}' to '${bestMatch}' in table '${oldTable.name}'`,
          warnings: ['Column rename may break existing queries and application code'],
        });
      } else if (options.includeDrops) {
        // Actually removed
        changes.push({
          type: 'column_removed',
          table: oldTable.name,
          column: oldColumn.name,
          sql: `ALTER TABLE "${oldTable.name}" DROP COLUMN "${oldColumn.name}";`,
          risk: 'high',
          description: `Drop column '${oldColumn.name}' from table '${oldTable.name}'`,
          warnings: ['This will permanently delete all data in the column'],
        });
      }
    }
  }
  
  // Find added columns
  for (const newColumn of newTable.columns) {
    if (!oldColumnMap.has(newColumn.name)) {
      // Check if this is the target of a rename we already detected
      const isRenameTarget = changes.some(c => 
        c.type === 'column_renamed' && c.newValue === newColumn.name
      );
      
      if (!isRenameTarget) {
        const addColumnSQL = generateAddColumnSQL(oldTable.name, newColumn, options);
        const risk = newColumn.isOptional ? 'low' : 'medium';
        const warnings = newColumn.isOptional ? [] : ['Adding NOT NULL column may fail if table contains data'];
        
        changes.push({
          type: 'column_added',
          table: oldTable.name,
          column: newColumn.name,
          sql: addColumnSQL,
          risk,
          description: `Add column '${newColumn.name}' to table '${oldTable.name}'`,
          warnings,
        });
      }
    }
  }
  
  // Find modified columns
  for (const newColumn of newTable.columns) {
    const oldColumn = oldColumnMap.get(newColumn.name);
    if (oldColumn && !isRenameTarget(changes, newColumn.name)) {
      const columnChanges = detectColumnModifications(oldTable.name, oldColumn, newColumn, options);
      changes.push(...columnChanges);
    }
  }
  
  return changes;
}

/**
 * Check if a column is the target of a rename operation
 */
function isRenameTarget(changes: SchemaChange[], columnName: string): boolean {
  return changes.some(c => 
    (c.type === 'column_renamed' || c.type === 'table_renamed') && 
    c.newValue === columnName
  );
}

/**
 * Detect modifications to a single column
 */
function detectColumnModifications(
  tableName: string,
  oldColumn: IRColumn, 
  newColumn: IRColumn, 
  options: DiffOptions
): SchemaChange[] {
  const changes: SchemaChange[] = [];
  
  // Type changes
  if (oldColumn.type !== newColumn.type) {
    const alterTypeSQL = `ALTER TABLE "${tableName}" ALTER COLUMN "${newColumn.name}" TYPE ${newColumn.type};`;
    changes.push({
      type: 'column_type_changed',
      table: tableName,
      column: newColumn.name,
      oldValue: oldColumn.type,
      newValue: newColumn.type,
      sql: alterTypeSQL,
      risk: 'high',
      description: `Change column '${newColumn.name}' type from ${oldColumn.type} to ${newColumn.type}`,
      warnings: ['Type changes may cause data loss or application errors'],
    });
  }
  
  // Nullable changes
  if (oldColumn.isOptional !== newColumn.isOptional) {
    if (newColumn.isOptional) {
      // Making column nullable (safe)
      changes.push({
        type: 'column_constraint_removed',
        table: tableName,
        column: newColumn.name,
        sql: `ALTER TABLE "${tableName}" ALTER COLUMN "${newColumn.name}" DROP NOT NULL;`,
        risk: 'low',
        description: `Make column '${newColumn.name}' nullable`,
      });
    } else {
      // Making column NOT NULL (risky)
      changes.push({
        type: 'column_constraint_added',
        table: tableName,
        column: newColumn.name,
        sql: `ALTER TABLE "${tableName}" ALTER COLUMN "${newColumn.name}" SET NOT NULL;`,
        risk: 'high',
        description: `Make column '${newColumn.name}' NOT NULL`,
        warnings: ['Adding NOT NULL constraint may fail if table contains NULL values'],
      });
    }
  }
  
  // Unique constraint changes
  if (oldColumn.isUnique !== newColumn.isUnique) {
    if (newColumn.isUnique) {
      changes.push({
        type: 'column_constraint_added',
        table: tableName,
        column: newColumn.name,
        sql: `ALTER TABLE "${tableName}" ADD CONSTRAINT "uk_${tableName}_${newColumn.name}" UNIQUE ("${newColumn.name}");`,
        risk: 'medium',
        description: `Add unique constraint to column '${newColumn.name}'`,
        warnings: ['Adding unique constraint may fail if table contains duplicate values'],
      });
    } else {
      changes.push({
        type: 'column_constraint_removed',
        table: tableName,
        column: newColumn.name,
        sql: `ALTER TABLE "${tableName}" DROP CONSTRAINT "uk_${tableName}_${newColumn.name}";`,
        risk: 'low',
        description: `Remove unique constraint from column '${newColumn.name}'`,
      });
    }
  }
  
  // Foreign key changes
  const oldFk = oldColumn.references;
  const newFk = newColumn.references;
  
  if (!oldFk && newFk) {
    // Adding foreign key
    const fkName = `fk_${tableName}_${newColumn.name}`;
    const onDelete = newFk.onDelete ? ` ON DELETE ${newFk.onDelete}` : '';
    const onUpdate = newFk.onUpdate ? ` ON UPDATE ${newFk.onUpdate}` : '';
    
    changes.push({
      type: 'foreign_key_added',
      table: tableName,
      column: newColumn.name,
      sql: `ALTER TABLE "${tableName}" ADD CONSTRAINT "${fkName}" FOREIGN KEY ("${newColumn.name}") REFERENCES "${newFk.table}" ("${newFk.column}")${onDelete}${onUpdate};`,
      risk: 'medium',
      description: `Add foreign key constraint to column '${newColumn.name}'`,
      warnings: ['Adding foreign key may fail if referential integrity is violated'],
    });
  } else if (oldFk && !newFk) {
    // Removing foreign key
    const fkName = `fk_${tableName}_${newColumn.name}`;
    changes.push({
      type: 'foreign_key_removed',
      table: tableName,
      column: newColumn.name,
      sql: `ALTER TABLE "${tableName}" DROP CONSTRAINT "${fkName}";`,
      risk: 'low',
      description: `Remove foreign key constraint from column '${newColumn.name}'`,
    });
  } else if (oldFk && newFk && (
    oldFk.table !== newFk.table || 
    oldFk.column !== newFk.column ||
    oldFk.onDelete !== newFk.onDelete ||
    oldFk.onUpdate !== newFk.onUpdate
  )) {
    // Modifying foreign key (drop and recreate)
    const fkName = `fk_${tableName}_${newColumn.name}`;
    const onDelete = newFk.onDelete ? ` ON DELETE ${newFk.onDelete}` : '';
    const onUpdate = newFk.onUpdate ? ` ON UPDATE ${newFk.onUpdate}` : '';
    
    changes.push({
      type: 'foreign_key_removed',
      table: tableName,
      column: newColumn.name,
      sql: `ALTER TABLE "${tableName}" DROP CONSTRAINT "${fkName}";`,
      risk: 'low',
      description: `Remove old foreign key constraint from column '${newColumn.name}'`,
    });
    
    changes.push({
      type: 'foreign_key_added',
      table: tableName,
      column: newColumn.name,
      sql: `ALTER TABLE "${tableName}" ADD CONSTRAINT "${fkName}" FOREIGN KEY ("${newColumn.name}") REFERENCES "${newFk.table}" ("${newFk.column}")${onDelete}${onUpdate};`,
      risk: 'medium',
      description: `Add new foreign key constraint to column '${newColumn.name}'`,
      warnings: ['Adding foreign key may fail if referential integrity is violated'],
    });
  }
  
  return changes;
}

/**
 * Generate CREATE TABLE SQL for a new table
 */
function generateCreateTableSQL(table: IRTable, options: DiffOptions): string {
  const schemaPrefix = (options.schemaName && options.schemaName !== 'public') ? `"${options.schemaName}".` : '';
  const lines: string[] = [];
  
  lines.push(`CREATE TABLE ${schemaPrefix}"${table.name}" (`);
  
  const columnDefs: string[] = [];
  const primaryKeyColumns: string[] = [];
  
  for (const column of table.columns) {
    const parts: string[] = [`"${column.name}" ${column.type}`];
    
    if (!column.isOptional) {
      parts.push('NOT NULL');
    }
    
    if (column.isUnique) {
      parts.push('UNIQUE');
    }
    
    if (column.default !== undefined) {
      parts.push(`DEFAULT ${column.default}`);
    }
    
    columnDefs.push(`  ${parts.join(' ')}`);
    
    if (column.isPrimaryKey) {
      primaryKeyColumns.push(`"${column.name}"`);
    }
  }
  
  if (primaryKeyColumns.length > 0) {
    columnDefs.push(`  PRIMARY KEY (${primaryKeyColumns.join(', ')})`);
  }
  
  lines.push(columnDefs.join(',\n'));
  lines.push(');');
  
  return lines.join('\n');
}

/**
 * Generate ADD COLUMN SQL
 */
function generateAddColumnSQL(tableName: string, column: IRColumn, options: DiffOptions): string {
  const schemaPrefix = (options.schemaName && options.schemaName !== 'public') ? `"${options.schemaName}".` : '';
  const parts: string[] = [`ALTER TABLE ${schemaPrefix}"${tableName}" ADD COLUMN "${column.name}" ${column.type}`];
  
  if (!column.isOptional) {
    parts.push('NOT NULL');
  }
  
  if (column.isUnique) {
    parts.push('UNIQUE');
  }
  
  if (column.default !== undefined) {
    parts.push(`DEFAULT ${column.default}`);
  }
  
  return parts.join(' ') + ';';
}

/**
 * Calculate migration complexity based on changes
 */
function calculateComplexity(changes: SchemaChange[]): 'simple' | 'moderate' | 'complex' {
  const highRiskCount = changes.filter(c => c.risk === 'high').length;
  const mediumRiskCount = changes.filter(c => c.risk === 'medium').length;
  const totalChanges = changes.length;
  
  if (highRiskCount > 5 || totalChanges > 20) {
    return 'complex';
  } else if (highRiskCount > 0 || mediumRiskCount > 5 || totalChanges > 10) {
    return 'moderate';
  } else {
    return 'simple';
  }
}

/**
 * Generate rollback SQL (best effort)
 */
function generateRollbackSQL(changes: SchemaChange[]): string {
  const rollbackStatements: string[] = [];
  
  // Process changes in reverse order for rollback
  const reversedChanges = [...changes].reverse();
  
  for (const change of reversedChanges) {
    switch (change.type) {
      case 'table_added':
        rollbackStatements.push(`DROP TABLE "${change.table}";`);
        break;
        
      case 'table_removed':
        rollbackStatements.push(`-- Cannot automatically rollback table drop: ${change.table}`);
        break;
        
      case 'table_renamed':
        rollbackStatements.push(`ALTER TABLE "${change.newValue}" RENAME TO "${change.oldValue}";`);
        break;
        
      case 'column_added':
        rollbackStatements.push(`ALTER TABLE "${change.table}" DROP COLUMN "${change.column}";`);
        break;
        
      case 'column_removed':
        rollbackStatements.push(`-- Cannot automatically rollback column drop: ${change.table}.${change.column}`);
        break;
        
      case 'column_renamed':
        rollbackStatements.push(`ALTER TABLE "${change.table}" RENAME COLUMN "${change.newValue}" TO "${change.oldValue}";`);
        break;
        
      case 'column_type_changed':
        rollbackStatements.push(`ALTER TABLE "${change.table}" ALTER COLUMN "${change.column}" TYPE ${change.oldValue};`);
        break;
        
      default:
        rollbackStatements.push(`-- Rollback for ${change.type} not implemented`);
    }
  }
  
  return rollbackStatements.join('\n');
}

/**
 * Compare two IR diagrams and generate a migration plan
 * 
 * @param oldDiagram - The current (old) schema
 * @param newDiagram - The target (new) schema
 * @param options - Configuration options for diff generation
 * @returns Migration plan with all necessary changes
 * 
 * @example
 * ```typescript
 * const oldSchema: IRDiagram = {
 *   tables: [
 *     {
 *       name: 'User',
 *       columns: [
 *         { name: 'id', type: 'SERIAL', isPrimaryKey: true },
 *         { name: 'name', type: 'VARCHAR(100)' }
 *       ]
 *     }
 *   ]
 * };
 * 
 * const newSchema: IRDiagram = {
 *   tables: [
 *     {
 *       name: 'User',
 *       columns: [
 *         { name: 'id', type: 'SERIAL', isPrimaryKey: true },
 *         { name: 'name', type: 'VARCHAR(100)' },
 *         { name: 'email', type: 'VARCHAR(255)', isUnique: true }
 *       ]
 *     }
 *   ]
 * };
 * 
 * const migration = diffIRDiagrams(oldSchema, newSchema);
 * console.log(migration.sql);
 * ```
 */
export function diffIRDiagrams(
  oldDiagram: IRDiagram, 
  newDiagram: IRDiagram, 
  options: DiffOptions = {}
): MigrationPlan {
  const defaultOptions: Required<DiffOptions> = {
    includeDrops: false,
    generateRollback: true,
    schemaName: 'public',
    allowDestructive: false,
    renameThreshold: 0.7,
    ...options,
  };
  
  const changes: SchemaChange[] = [];
  
  // Detect table-level changes
  changes.push(...detectTableChanges(oldDiagram, newDiagram, defaultOptions));
  
  // Detect column-level changes for existing tables
  const oldTableMap = new Map(oldDiagram.tables.map(t => [t.name, t]));
  const newTableMap = new Map(newDiagram.tables.map(t => [t.name, t]));
  
  for (const newTable of newDiagram.tables) {
    const oldTable = oldTableMap.get(newTable.name);
    if (oldTable) {
      changes.push(...detectColumnChanges(oldTable, newTable, defaultOptions));
    }
  }
  
  // Calculate complexity and breaking changes
  const complexity = calculateComplexity(changes);
  const breakingChanges = changes.filter(c => c.risk === 'high').length;
  
  // Generate SQL
  const sql = changes.map(c => c.sql).join('\n');
  
  // Generate rollback SQL if requested
  const rollbackSql = defaultOptions.generateRollback ? generateRollbackSQL(changes) : undefined;
  
  return {
    changes,
    complexity,
    breakingChanges,
    sql,
    rollbackSql,
  };
}

/**
 * Format migration plan as human-readable report
 */
export function formatMigrationReport(plan: MigrationPlan): string {
  const lines: string[] = [];
  
  lines.push('# Database Migration Report');
  lines.push('');
  lines.push(`**Complexity:** ${plan.complexity}`);
  lines.push(`**Total Changes:** ${plan.changes.length}`);
  lines.push(`**Breaking Changes:** ${plan.breakingChanges}`);
  lines.push('');
  
  if (plan.changes.length === 0) {
    lines.push('No changes detected between schemas.');
    return lines.join('\n');
  }
  
  // Group changes by risk level
  const changesByRisk = {
    high: plan.changes.filter(c => c.risk === 'high'),
    medium: plan.changes.filter(c => c.risk === 'medium'),
    low: plan.changes.filter(c => c.risk === 'low'),
  };
  
  for (const [risk, changes] of Object.entries(changesByRisk)) {
    if (changes.length === 0) continue;
    
    lines.push(`## ${risk.toUpperCase()} Risk Changes (${changes.length})`);
    lines.push('');
    
    for (const change of changes) {
      lines.push(`- **${change.description}**`);
      if (change.warnings && change.warnings.length > 0) {
        for (const warning of change.warnings) {
          lines.push(`  - ⚠️ ${warning}`);
        }
      }
      lines.push(`  - SQL: \`${change.sql}\``);
      lines.push('');
    }
  }
  
  lines.push('## Migration SQL');
  lines.push('');
  lines.push('```sql');
  lines.push(plan.sql);
  lines.push('```');
  
  if (plan.rollbackSql) {
    lines.push('');
    lines.push('## Rollback SQL');
    lines.push('');
    lines.push('```sql');
    lines.push(plan.rollbackSql);
    lines.push('```');
  }
  
  return lines.join('\n');
}