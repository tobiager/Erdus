#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { oldToNew, newToOld } from './convert';
import { newToIR } from './ir';
import { irToPostgres } from './ir-to-sql';
import { irToPrisma } from './ir-to-prisma';
import { irToTypeorm } from './ir-to-typeorm';
import { sqlToIR } from './sql-to-ir';
import { prismaToIR } from './prisma-to-ir';
import { typeormToIR } from './typeorm-to-ir';
import { irToNew } from './ir-to-new';
import { toJSONSchema } from './generators/json-schema';
import { toSequelize } from './generators/sequelize';
import { toSupabaseSQL } from './generators/supabase';
import { diffSchemas, emitAlterSQL } from './diff';
import { migrateScriptToSupabase } from './migrations';
import { validateIRSchema, validateIRDiagram } from './ir/validators';
import type { IRDiagram, IRSchema } from './ir';

const program = new Command();

program
  .name('erdus')
  .description('Universal ER diagram converter and database migration tool')
  .version('1.0.0');

// Legacy convert command (backward compatibility)
program
  .command('convert')
  .description('Convert between different ER diagram formats')
  .argument('<input>', 'Input file path')
  .argument('<target>', 'Target format: sql|prisma|typeorm|old|new')
  .option('-o, --output <file>', 'Output file path')
  .action(async (inputFile: string, target: string, options) => {
    try {
      const raw = readFileSync(inputFile, 'utf8');
      const fmt = detectInput(raw);
      let ir: IRDiagram;
      let newDoc;
      
      if (fmt === 'old') {
        const data = JSON.parse(raw);
        newDoc = oldToNew(data);
        ir = newToIR(newDoc);
      } else if (fmt === 'new') {
        newDoc = JSON.parse(raw);
        ir = newToIR(newDoc);
      } else if (fmt === 'sql') {
        ir = sqlToIR(raw);
        newDoc = irToNew(ir);
      } else if (fmt === 'typeorm') {
        ir = typeormToIR(raw);
        newDoc = irToNew(ir);
      } else {
        ir = prismaToIR(raw);
        newDoc = irToNew(ir);
      }

      let output: string;
      if (target === 'sql') {
        output = irToPostgres(ir);
      } else if (target === 'prisma') {
        output = irToPrisma(ir);
      } else if (target === 'typeorm') {
        output = irToTypeorm(ir);
      } else if (target === 'old') {
        output = JSON.stringify(newToOld(newDoc), null, 2);
      } else if (target === 'new') {
        output = JSON.stringify(newDoc, null, 2);
      } else {
        throw new Error(`Unsupported target format: ${target}`);
      }

      if (options.output) {
        ensureDirectoryExists(options.output);
        writeFileSync(options.output, output);
        console.log(`✅ Converted ${fmt} → ${target}: ${options.output}`);
      } else {
        console.log(output);
      }
    } catch (error) {
      console.error('❌ Conversion failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// JSON Schema generator
program
  .command('jsonschema')
  .description('Generate JSON Schema from IR')
  .option('--in <file>', 'Input IR file (JSON)')
  .option('--out <dir>', 'Output directory')
  .option('--target <type>', 'Target type: openapi|ajv', 'ajv')
  .option('--id-prefix <prefix>', 'JSON Schema $id prefix')
  .action(async (options) => {
    try {
      const input = options.in ? readFileSync(options.in, 'utf8') : readStdin();
      const data = JSON.parse(input);
      
      // Validate and convert input
      let ir: IRSchema;
      if (isValidIRSchema(data)) {
        ir = validateIRSchema(data);
      } else {
        // Try legacy format
        const legacy = validateIRDiagram(data);
        ir = convertLegacyToNew(legacy);
      }

      const schemas = toJSONSchema(ir, {
        target: options.target as 'openapi' | 'ajv',
        $idPrefix: options.idPrefix,
      });

      if (options.out) {
        ensureDirectoryExists(options.out);
        for (const [name, schema] of Object.entries(schemas)) {
          const filePath = `${options.out}/${name}.json`;
          writeFileSync(filePath, JSON.stringify(schema, null, 2));
          console.log(`✅ Generated JSON Schema: ${filePath}`);
        }
      } else {
        console.log(JSON.stringify(schemas, null, 2));
      }
    } catch (error) {
      console.error('❌ JSON Schema generation failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Sequelize generator
program
  .command('sequelize')
  .description('Generate Sequelize models from IR')
  .option('--in <file>', 'Input IR file (JSON)')
  .option('--out <dir>', 'Output directory', './models')
  .option('--dialect <type>', 'Database dialect: postgres|mysql|mssql|sqlite', 'postgres')
  .action(async (options) => {
    try {
      const input = options.in ? readFileSync(options.in, 'utf8') : readStdin();
      const data = JSON.parse(input);
      
      // Validate and convert input
      let ir: IRSchema;
      if (isValidIRSchema(data)) {
        ir = validateIRSchema(data);
      } else {
        const legacy = validateIRDiagram(data);
        ir = convertLegacyToNew(legacy);
      }

      const files = toSequelize(ir, {
        dialect: options.dialect as any,
        outputDir: options.out,
      });

      for (const file of files) {
        ensureDirectoryExists(file.path);
        writeFileSync(file.path, file.contents);
        console.log(`✅ Generated Sequelize model: ${file.path}`);
      }
    } catch (error) {
      console.error('❌ Sequelize generation failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Supabase generator
program
  .command('supabase')
  .description('Generate Supabase schema from IR')
  .option('--in <file>', 'Input IR file (JSON)')
  .option('--out <file>', 'Output SQL file')
  .option('--with-rls', 'Include Row Level Security policies')
  .option('--schema <name>', 'Schema name', 'public')
  .action(async (options) => {
    try {
      const input = options.in ? readFileSync(options.in, 'utf8') : readStdin();
      const data = JSON.parse(input);
      
      // Validate and convert input
      let ir: IRSchema;
      if (isValidIRSchema(data)) {
        ir = validateIRSchema(data);
      } else {
        const legacy = validateIRDiagram(data);
        ir = convertLegacyToNew(legacy);
      }

      const sql = toSupabaseSQL(ir, {
        withRLS: options.withRls,
        schema: options.schema,
      });

      if (options.out) {
        ensureDirectoryExists(options.out);
        writeFileSync(options.out, sql);
        console.log(`✅ Generated Supabase schema: ${options.out}`);
      } else {
        console.log(sql);
      }
    } catch (error) {
      console.error('❌ Supabase generation failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Schema diff tool
program
  .command('diff')
  .description('Generate migration script between two schemas')
  .option('--from <file>', 'Source schema file (JSON)')
  .option('--to <file>', 'Target schema file (JSON)')
  .option('--out <file>', 'Output SQL file')
  .option('--detect-renames', 'Enable rename detection')
  .action(async (options) => {
    try {
      if (!options.from || !options.to) {
        throw new Error('Both --from and --to options are required');
      }

      const fromData = JSON.parse(readFileSync(options.from, 'utf8'));
      const toData = JSON.parse(readFileSync(options.to, 'utf8'));

      // Validate inputs
      const fromIR = isValidIRSchema(fromData) ? validateIRSchema(fromData) : convertLegacyToNew(validateIRDiagram(fromData));
      const toIR = isValidIRSchema(toData) ? validateIRSchema(toData) : convertLegacyToNew(validateIRDiagram(toData));

      const plan = diffSchemas(fromIR, toIR, {
        detectRenames: options.detectRenames,
      });

      const sql = emitAlterSQL(plan);

      if (options.out) {
        ensureDirectoryExists(options.out);
        writeFileSync(options.out, sql);
        console.log(`✅ Generated migration script: ${options.out}`);
        
        if (plan.warnings.length > 0) {
          console.log('\n⚠️  Warnings:');
          plan.warnings.forEach(warning => console.log(`  ${warning}`));
        }
      } else {
        console.log(sql);
      }
    } catch (error) {
      console.error('❌ Diff generation failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Database migration tool
program
  .command('migrar-db')
  .description('Migrate database schema to Supabase/PostgreSQL')
  .option('--engine <type>', 'Source database engine: oracle|mysql|sqlserver|postgresql|mongodb|sqlite', 'sqlserver')
  .option('--in <file>', 'Input DDL/schema file')
  .option('--out <file>', 'Output SQL file')
  .option('--schema <name>', 'Target schema name', 'public')
  .option('--with-rls', 'Include Row Level Security policies')
  .action(async (options) => {
    try {
      const input = options.in ? readFileSync(options.in, 'utf8') : readStdin();
      
      const sql = migrateScriptToSupabase(input, options.engine as any, {
        schema: options.schema,
        withRLS: options.withRls,
      });

      if (options.out) {
        ensureDirectoryExists(options.out);
        writeFileSync(options.out, sql);
        console.log(`✅ Migrated ${options.engine} → PostgreSQL/Supabase: ${options.out}`);
      } else {
        console.log(sql);
      }
    } catch (error) {
      console.error('❌ Migration failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Utility functions
function detectInput(text: string): 'old'|'new'|'sql'|'prisma'|'typeorm' {
  try {
    const obj = JSON.parse(text);
    if (obj && obj.version === 2 && obj.www === 'erdplus.com' && Array.isArray(obj.shapes)) return 'old';
    if (obj && obj.diagramType === 2 && obj.data && Array.isArray(obj.data.nodes)) return 'new';
  } catch { /* ignore */ }
  if (/model\s+\w+\s+{/.test(text)) return 'prisma';
  if (/@Entity/.test(text)) return 'typeorm';
  if (/CREATE TABLE/i.test(text)) return 'sql';
  throw new Error('Formato de entrada no soportado');
}

function readStdin(): string {
  // TODO: Implement stdin reading for CLI
  throw new Error('Reading from stdin not yet implemented');
}

function isValidIRSchema(data: any): data is IRSchema {
  return data && Array.isArray(data.entities);
}

function convertLegacyToNew(legacy: IRDiagram): IRSchema {
  // Convert legacy IRDiagram to new IRSchema format
  return {
    entities: legacy.tables.map(table => ({
      name: table.name,
      attributes: table.columns.map(col => ({
        name: col.name,
        type: inferIRType(col.type),
        nullable: col.isOptional,
        pk: col.isPrimaryKey,
        unique: col.isUnique,
        default: col.default,
        references: col.references ? {
          table: col.references.table,
          column: col.references.column,
          onDelete: col.references.onDelete as any,
          onUpdate: col.references.onUpdate as any,
        } : undefined,
      })),
      indexes: table.indexes?.map(idx => ({
        columns: idx.columns,
        unique: idx.unique,
      })),
    })),
    relations: [],
    enums: [],
  };
}

function inferIRType(typeString: string): any {
  const upper = typeString.toUpperCase();
  if (upper.includes('INT')) return 'integer';
  if (upper.includes('VARCHAR') || upper.includes('CHAR')) return 'string';
  if (upper.includes('TEXT')) return 'text';
  if (upper.includes('BOOL')) return 'boolean';
  if (upper.includes('DATE')) return 'date';
  if (upper.includes('UUID')) return 'uuid';
  return 'string';
}

function ensureDirectoryExists(filePath: string): void {
  const dir = dirname(filePath);
  try {
    mkdirSync(dir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

// Parse command line arguments
program.parse();
