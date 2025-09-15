import { Command } from 'commander';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Import generators and utilities
import { toJSONSchema, type JSONSchemaOptions } from './generators/json-schema/index.js';
import { toSequelize, type SequelizeOptions } from './generators/sequelize/index.js';
import { toSupabaseSQL, type SupabaseOptions } from './generators/supabase/index.js';
import { diffSchemas, emitAlterSQL } from './diff/index.js';
import { migrateScriptToSupabase, type SupportedEngine, type MigrationOptions } from './migrations/index.js';
import { validateIRSchema, validateIRDiagram, diagramToSchema } from './ir/validators.js';

const program = new Command();

// Get version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

program
  .name('erdus')
  .description('Universal ER diagram converter - Phase 3 ecosystem tools')
  .version(packageJson.version);

// JSON Schema command
program
  .command('jsonschema')
  .description('Convert IR schema to JSON Schema')
  .option('--in <path>', 'Input IR schema file (JSON)', 'stdin')
  .option('--out <path>', 'Output directory', 'stdout')
  .option('--id-prefix <prefix>', 'JSON Schema $id prefix')
  .option('--target <target>', 'Target format (openapi|ajv)', 'ajv')
  .action(async (options) => {
    try {
      const input = readInput(options.in);
      const ir = parseIRInput(input);
      
      const jsonSchemaOptions: JSONSchemaOptions = {
        $idPrefix: options.idPrefix,
        target: options.target
      };
      
      const schemas = toJSONSchema(ir, jsonSchemaOptions);
      
      if (options.out === 'stdout') {
        console.log(JSON.stringify(schemas, null, 2));
      } else {
        writeOutput(options.out, schemas);
      }
    } catch (error) {
      console.error('Error generating JSON Schema:', error);
      process.exit(1);
    }
  });

// Sequelize command
program
  .command('sequelize')
  .description('Convert IR schema to Sequelize models')
  .option('--in <path>', 'Input IR schema file (JSON)', 'stdin')
  .option('--out <path>', 'Output directory', './out/sequelize')
  .option('--dialect <dialect>', 'Database dialect (postgres|mysql|mssql|sqlite)', 'postgres')
  .option('--no-decorators', 'Use traditional Sequelize syntax')
  .option('--format <format>', 'Export format (esm|commonjs)', 'esm')
  .action(async (options) => {
    try {
      const input = readInput(options.in);
      const ir = parseIRInput(input);
      
      const sequelizeOptions: SequelizeOptions = {
        dialect: options.dialect,
        useDecorators: options.decorators,
        exportFormat: options.format
      };
      
      const files = toSequelize(ir, sequelizeOptions);
      
      // Write files to output directory
      for (const file of files) {
        const fullPath = join(options.out, file.path);
        mkdirSync(dirname(fullPath), { recursive: true });
        writeFileSync(fullPath, file.contents, 'utf-8');
      }
      
      console.log(`Generated ${files.length} Sequelize model files in ${options.out}`);
    } catch (error) {
      console.error('Error generating Sequelize models:', error);
      process.exit(1);
    }
  });

// Supabase command
program
  .command('supabase')
  .description('Convert IR schema to Supabase SQL')
  .option('--in <path>', 'Input IR schema file (JSON)', 'stdin')
  .option('--out <path>', 'Output SQL file', 'stdout')
  .option('--with-rls', 'Include Row Level Security policies')
  .option('--schema <schema>', 'PostgreSQL schema name', 'public')
  .action(async (options) => {
    try {
      const input = readInput(options.in);
      const ir = parseIRInput(input);
      
      const supabaseOptions: SupabaseOptions = {
        withRLS: options.withRls,
        schema: options.schema
      };
      
      const sql = toSupabaseSQL(ir, supabaseOptions);
      
      if (options.out === 'stdout') {
        console.log(sql);
      } else {
        mkdirSync(dirname(options.out), { recursive: true });
        writeFileSync(options.out, sql, 'utf-8');
        console.log(`Generated Supabase SQL schema: ${options.out}`);
      }
    } catch (error) {
      console.error('Error generating Supabase schema:', error);
      process.exit(1);
    }
  });

// Diff command
program
  .command('diff')
  .description('Generate migration plan between two IR schemas')
  .option('--from <path>', 'Source IR schema file (JSON)')
  .option('--to <path>', 'Target IR schema file (JSON)')
  .option('--out <path>', 'Output SQL migration file', 'stdout')
  .option('--schema <schema>', 'PostgreSQL schema name', 'public')
  .action(async (options) => {
    try {
      if (!options.from || !options.to) {
        console.error('Both --from and --to are required');
        process.exit(1);
      }
      
      const fromInput = readFileSync(options.from, 'utf-8');
      const toInput = readFileSync(options.to, 'utf-8');
      
      const fromIR = parseIRInput(fromInput);
      const toIR = parseIRInput(toInput);
      
      const migrationPlan = diffSchemas(fromIR, toIR);
      const sql = emitAlterSQL(migrationPlan, { schema: options.schema });
      
      if (options.out === 'stdout') {
        console.log(sql);
      } else {
        mkdirSync(dirname(options.out), { recursive: true });
        writeFileSync(options.out, sql, 'utf-8');
        console.log(`Generated migration script: ${options.out}`);
      }
    } catch (error) {
      console.error('Error generating migration:', error);
      process.exit(1);
    }
  });

// Migration command
program
  .command('migrar-db')
  .description('Migrate SQL script from one database engine to Supabase/PostgreSQL')
  .option('--engine <engine>', 'Source database engine (oracle|mysql|sqlserver|postgresql|mongodb|sqlite)')
  .option('--in <path>', 'Input SQL script file', 'stdin')
  .option('--out <path>', 'Output SQL file', 'stdout')
  .option('--schema <schema>', 'PostgreSQL schema name', 'public')
  .option('--with-rls', 'Include Row Level Security policies')
  .action(async (options) => {
    try {
      if (!options.engine) {
        console.error('--engine is required');
        process.exit(1);
      }
      
      const validEngines: SupportedEngine[] = ['oracle', 'mysql', 'sqlserver', 'postgresql', 'mongodb', 'sqlite'];
      if (!validEngines.includes(options.engine)) {
        console.error(`Invalid engine. Must be one of: ${validEngines.join(', ')}`);
        process.exit(1);
      }
      
      const input = readInput(options.in);
      
      const migrationOptions: MigrationOptions = {
        schema: options.schema,
        withRLS: options.withRls
      };
      
      const sql = migrateScriptToSupabase(input, options.engine, migrationOptions);
      
      if (options.out === 'stdout') {
        console.log(sql);
      } else {
        mkdirSync(dirname(options.out), { recursive: true });
        writeFileSync(options.out, sql, 'utf-8');
        console.log(`Migrated ${options.engine} script to PostgreSQL: ${options.out}`);
      }
    } catch (error) {
      console.error('Error migrating database script:', error);
      process.exit(1);
    }
  });

// Helper functions
function readInput(path: string): string {
  if (path === 'stdin') {
    // For stdin, we'd normally read from process.stdin, but for simplicity just throw
    throw new Error('stdin input not implemented yet - please provide a file path');
  }
  
  return readFileSync(path, 'utf-8');
}

function parseIRInput(input: string): any {
  try {
    const parsed = JSON.parse(input);
    
    // Try to validate as IR Schema first
    try {
      return validateIRSchema(parsed);
    } catch {
      // Fall back to IR Diagram (backward compatibility)
      const diagram = validateIRDiagram(parsed);
      return diagramToSchema(diagram);
    }
  } catch (error) {
    throw new Error(`Invalid JSON input: ${error}`);
  }
}

function writeOutput(outputPath: string, data: any): void {
  mkdirSync(dirname(outputPath), { recursive: true });
  
  if (typeof data === 'string') {
    writeFileSync(outputPath, data, 'utf-8');
  } else {
    // For objects, write each as separate JSON files
    for (const [key, value] of Object.entries(data)) {
      const filePath = join(outputPath, `${key}.json`);
      writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8');
    }
  }
}

// Parse command line arguments
program.parse();