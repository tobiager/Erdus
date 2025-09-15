import { z } from 'zod';
import { IRDiagram } from '../ir';
import { DatabaseEngine, MigrationOptions, MigrationResult, MigrationOptionsSchema } from '../types';

// Parser imports
import { parsePostgreSQL, generatePostgreSQL } from '../parsers/postgresql';
import { parseMySQL, generateMySQL } from '../parsers/mysql';
import { parseSQLite, generateSQLite } from '../parsers/sqlite';
import { parseMongoDB, generateMongoDB } from '../parsers/mongodb';
import { parseOracle, generateOracle } from '../parsers/oracle';
import { parseSQLServer, generateSQLServer } from '../parsers/sqlserver';

// Generator imports
import { generateRLSPolicies, generateSupabaseRLSHelpers, generatePatternBasedRLS } from '../generators/rls-policies';

// Migration imports
import { diffIRDiagrams, generateMigrationSQL } from './diff';

export interface MigrationConfig extends MigrationOptions {
  sourceEngine: DatabaseEngine;
  targetEngine: DatabaseEngine;
  generateRLS?: boolean;
  rlsPattern?: 'multi-tenant' | 'user-owned' | 'public-read' | 'custom';
}

const MigrationConfigSchema = MigrationOptionsSchema.extend({
  sourceEngine: z.enum(['oracle', 'mysql', 'sqlserver', 'postgresql', 'mongodb', 'sqlite']),
  targetEngine: z.enum(['oracle', 'mysql', 'sqlserver', 'postgresql', 'mongodb', 'sqlite']),
  generateRLS: z.boolean().optional().default(false),
  rlsPattern: z.enum(['multi-tenant', 'user-owned', 'public-read', 'custom']).optional().default('user-owned'),
});

/**
 * Main migration class that orchestrates the entire migration process
 */
export class DatabaseMigrator {
  private config: MigrationConfig;

  constructor(config: MigrationConfig) {
    this.config = MigrationConfigSchema.parse(config);
  }

  /**
   * Parse source database schema into IR format
   */
  async parseSource(schema: string): Promise<MigrationResult & { diagram?: IRDiagram }> {
    try {
      let result: MigrationResult;
      let diagram: IRDiagram | undefined;

      switch (this.config.sourceEngine) {
        case 'postgresql':
          result = parsePostgreSQL(schema, {
            includeComments: this.config.includeComments,
            strictValidation: this.config.targetEngine !== 'postgresql' // Be stricter when converting between engines
          });
          if (result.success) {
            // Extract diagram from global variable or create it
            diagram = this.extractDiagramFromParseResult(schema, 'postgresql');
          }
          break;

        case 'mysql':
          result = parseMySQL(schema, {
            includeComments: this.config.includeComments,
            strictValidation: this.config.targetEngine !== 'mysql'
          });
          if (result.success) {
            diagram = this.extractDiagramFromParseResult(schema, 'mysql');
          }
          break;

        case 'sqlite':
          result = parseSQLite(schema, {
            includeComments: this.config.includeComments,
            strictValidation: this.config.targetEngine !== 'sqlite'
          });
          if (result.success) {
            diagram = this.extractDiagramFromParseResult(schema, 'sqlite');
          }
          break;

        case 'mongodb':
          result = parseMongoDB(schema, {
            includeComments: this.config.includeComments,
            strictValidation: this.config.targetEngine !== 'mongodb'
          });
          if (result.success) {
            diagram = this.extractDiagramFromParseResult(schema, 'mongodb');
          }
          break;

        case 'oracle':
          result = parseOracle(schema, {
            includeComments: this.config.includeComments,
            strictValidation: this.config.targetEngine !== 'oracle'
          });
          if (result.success) {
            diagram = this.extractDiagramFromParseResult(schema, 'oracle');
          }
          break;

        case 'sqlserver':
          result = parseSQLServer(schema, {
            includeComments: this.config.includeComments,
            strictValidation: this.config.targetEngine !== 'sqlserver'
          });
          if (result.success) {
            diagram = this.extractDiagramFromParseResult(schema, 'sqlserver');
          }
          break;

        default:
          return {
            success: false,
            warnings: [],
            errors: [`Unsupported source engine: ${this.config.sourceEngine}`]
          };
      }

      return {
        ...result,
        diagram
      };

    } catch (error) {
      return {
        success: false,
        warnings: [],
        errors: [`Error parsing source: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * Generate target database schema from IR format
   */
  generateTarget(diagram: IRDiagram): MigrationResult {
    try {
      let sql: string;

      switch (this.config.targetEngine) {
        case 'postgresql':
          sql = generatePostgreSQL(diagram, {
            includeComments: this.config.includeComments
          });
          break;

        case 'mysql':
          sql = generateMySQL(diagram, {
            includeComments: this.config.includeComments
          });
          break;

        case 'sqlite':
          sql = generateSQLite(diagram, {
            includeComments: this.config.includeComments
          });
          break;

        case 'mongodb':
          sql = generateMongoDB(diagram, {
            includeComments: this.config.includeComments
          });
          break;

        case 'oracle':
          sql = generateOracle(diagram, {
            includeComments: this.config.includeComments
          });
          break;

        case 'sqlserver':
          sql = generateSQLServer(diagram, {
            includeComments: this.config.includeComments
          });
          break;

        default:
          return {
            success: false,
            warnings: [],
            errors: [`Unsupported target engine: ${this.config.targetEngine}`]
          };
      }

      // Add RLS policies if requested and target is PostgreSQL
      if (this.config.generateRLS && this.config.targetEngine === 'postgresql') {
        sql += '\n\n';
        if (this.config.rlsPattern === 'custom') {
          sql += generateSupabaseRLSHelpers(diagram, { includeComments: this.config.includeComments });
        } else {
          sql += generatePatternBasedRLS(diagram, this.config.rlsPattern!, { includeComments: this.config.includeComments });
        }
      }

      return {
        success: true,
        sql,
        warnings: [],
        errors: []
      };

    } catch (error) {
      return {
        success: false,
        warnings: [],
        errors: [`Error generating target: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * Generate migration script between two schemas
   */
  generateMigration(oldSchema: string, newSchema: string): MigrationResult {
    try {
      // Parse old schema
      const oldResult = this.parseSource(oldSchema);
      if (!oldResult.success || !oldResult.diagram) {
        return {
          success: false,
          warnings: oldResult.warnings,
          errors: ['Failed to parse old schema', ...oldResult.errors]
        };
      }

      // Parse new schema (temporarily change source engine if needed)
      const originalSource = this.config.sourceEngine;
      // Use the same engine for both schemas
      const newResult = this.parseSource(newSchema);
      this.config.sourceEngine = originalSource;

      if (!newResult.success || !newResult.diagram) {
        return {
          success: false,
          warnings: [...oldResult.warnings, ...newResult.warnings],
          errors: ['Failed to parse new schema', ...newResult.errors]
        };
      }

      // Generate diff
      const diff = diffIRDiagrams(oldResult.diagram, newResult.diagram);

      // Generate migration SQL
      const migrationResult = generateMigrationSQL(diff, {
        dryRun: this.config.dryRun,
        includeComments: this.config.includeComments,
        targetEngine: this.config.targetEngine
      });

      return {
        success: migrationResult.success,
        sql: migrationResult.sql,
        warnings: [...oldResult.warnings, ...newResult.warnings, ...migrationResult.warnings],
        errors: [...migrationResult.errors]
      };

    } catch (error) {
      return {
        success: false,
        warnings: [],
        errors: [`Error generating migration: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * Full migration workflow: parse source, generate target
   */
  async migrate(sourceSchema: string): Promise<MigrationResult> {
    try {
      // Parse source
      const parseResult = await this.parseSource(sourceSchema);
      if (!parseResult.success || !parseResult.diagram) {
        return parseResult;
      }

      // Generate target
      const generateResult = this.generateTarget(parseResult.diagram);
      
      return {
        success: generateResult.success,
        sql: generateResult.sql,
        warnings: [...parseResult.warnings, ...generateResult.warnings],
        errors: [...generateResult.errors]
      };

    } catch (error) {
      return {
        success: false,
        warnings: [],
        errors: [`Migration error: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * Helper method to extract diagram from parse result
   * This is a simplified version - in a real implementation, you'd need to modify
   * the parsers to return the diagram directly
   */
  private extractDiagramFromParseResult(schema: string, engine: DatabaseEngine): IRDiagram {
    // Call the appropriate parser based on the engine
    switch (engine) {
      case 'postgresql':
        return parsePostgreSQL(schema);
      case 'mysql':
        return parseMySQL(schema);
      case 'sqlite':
        return parseSQLite(schema);
      case 'mongodb':
        return parseMongoDB(schema);
      case 'oracle':
        return parseOracle(schema);
      case 'sqlserver':
        return parseSQLServer(schema);
      default:
        throw new Error(`Unsupported source engine: ${engine}`);
    }
  }
}

/**
 * Convenience functions for common migration scenarios
 */

export function migrateToPostgreSQL(sourceSchema: string, sourceEngine: DatabaseEngine, options: Partial<MigrationConfig> = {}): Promise<MigrationResult> {
  const migrator = new DatabaseMigrator({
    sourceEngine,
    targetEngine: 'postgresql',
    includeComments: true,
    dryRun: false,
    ...options
  });
  return migrator.migrate(sourceSchema);
}

export function migrateToSupabase(sourceSchema: string, sourceEngine: DatabaseEngine, options: Partial<MigrationConfig> = {}): Promise<MigrationResult> {
  const migrator = new DatabaseMigrator({
    sourceEngine,
    targetEngine: 'postgresql',
    generateRLS: true,
    rlsPattern: 'user-owned',
    includeComments: true,
    dryRun: false,
    ...options
  });
  return migrator.migrate(sourceSchema);
}

export function generateSafeMigration(oldSchema: string, newSchema: string, targetEngine: DatabaseEngine = 'postgresql', options: Partial<MigrationConfig> = {}): MigrationResult {
  const migrator = new DatabaseMigrator({
    sourceEngine: targetEngine, // Assume both schemas are for the same engine
    targetEngine,
    includeComments: true,
    dryRun: true, // Safe by default
    ...options
  });
  return migrator.generateMigration(oldSchema, newSchema);
}

/**
 * Validate migration configuration
 */
export function validateMigrationConfig(config: Partial<MigrationConfig>): { valid: boolean; errors: string[] } {
  try {
    MigrationConfigSchema.parse(config);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}