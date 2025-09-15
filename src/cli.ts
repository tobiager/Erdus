#!/usr/bin/env node
import { readFileSync } from 'fs';
import { oldToNew, newToOld } from './convert';
import { newToIR } from './ir';
import { irToPostgres } from './ir-to-sql';
import { irToPrisma } from './ir-to-prisma';
import { irToTypeorm } from './ir-to-typeorm';
import { sqlToIR } from './sql-to-ir';
import { prismaToIR } from './prisma-to-ir';
import { typeormToIR } from './typeorm-to-ir';
import { irToNew } from './ir-to-new';
import type { IRDiagram } from './ir';

// Migration imports
import { DatabaseMigrator, migrateToPostgreSQL, migrateToSupabase, generateSafeMigration } from './migration';
import { generateRLSPolicies, generateSupabaseRLSHelpers } from './generators/rls-policies';
import type { DatabaseEngine } from './types';

function detectInput(text: string): 'old'|'new'|'sql'|'prisma'|'typeorm'|'oracle'|'mysql'|'sqlserver'|'sqlite'|'mongodb' {
  try {
    const obj = JSON.parse(text);
    if (obj && obj.version === 2 && obj.www === 'erdplus.com' && Array.isArray(obj.shapes)) return 'old';
    if (obj && obj.diagramType === 2 && obj.data && Array.isArray(obj.data.nodes)) return 'new';
    // MongoDB detection
    if (Array.isArray(obj) || obj.collections || (obj._id !== undefined)) return 'mongodb';
  } catch { /* ignore */ }
  
  // TypeORM detection
  if (/@Entity/.test(text)) return 'typeorm';
  
  // Prisma detection
  if (/model\s+\w+\s+{/.test(text)) return 'prisma';
  
  // SQL dialects detection
  if (/CREATE TABLE/i.test(text)) {
    if (/\bNVARCHAR\b|\bIDENTITY\b|\[\w+\]/i.test(text)) return 'sqlserver';
    if (/\bVARCHAR2\b|\bNUMBER\b|\bCLOB\b/i.test(text)) return 'oracle';
    if (/\bAUTO_INCREMENT\b|\bTEXT\b|\bENGINE\s*=/i.test(text)) return 'mysql';
    if (/\bAUTOINCREMENT\b|\bWITHOUT\s+ROWID\b/i.test(text)) return 'sqlite';
    return 'sql'; // Default to PostgreSQL
  }
  
  throw new Error('Formato de entrada no soportado');
}

function showHelp() {
  console.log(`
Erdus - Universal Database Schema Converter

USAGE:
  erdus <command> [options]

COMMANDS:
  convert <file> <target>           Convert schema between formats
  migrate <source-engine> <target-engine> <file> [options]
                                   Migrate schema between database engines
  diff <old-file> <new-file>       Generate migration script between schemas
  rls <file> [pattern]             Generate RLS policies for PostgreSQL/Supabase

CONVERT TARGETS:
  sql, prisma, typeorm, old, new, oracle, mysql, sqlserver, sqlite, mongodb

MIGRATION ENGINES:
  postgresql, mysql, sqlserver, oracle, sqlite, mongodb

RLS PATTERNS:
  user-owned, multi-tenant, public-read, supabase

OPTIONS:
  --dry-run                        Generate migration without executing
  --include-rls                    Include RLS policies (PostgreSQL only)
  --comments                       Include comments in generated SQL
  --strict                         Use strict validation

EXAMPLES:
  erdus convert schema.sql prisma
  erdus migrate mysql postgresql schema.sql
  erdus migrate oracle postgresql schema.sql --include-rls
  erdus diff old-schema.sql new-schema.sql
  erdus rls schema.sql user-owned
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    return;
  }

  const command = args[0];

  try {
    switch (command) {
      case 'convert':
        await handleConvert(args.slice(1));
        break;
      case 'migrate':
        await handleMigrate(args.slice(1));
        break;
      case 'diff':
        await handleDiff(args.slice(1));
        break;
      case 'rls':
        await handleRLS(args.slice(1));
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.error('Use "erdus --help" for usage information');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

async function handleConvert(args: string[]) {
  const [file, target] = args;
  
  if (!file || !target) {
    console.error('Usage: erdus convert <file> <target>');
    process.exit(1);
  }

  const raw = readFileSync(file, 'utf8');
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

  if (target === 'sql') {
    console.log(irToPostgres(ir));
  } else if (target === 'prisma') {
    console.log(irToPrisma(ir));
  } else if (target === 'typeorm') {
    console.log(irToTypeorm(ir));
  } else if (target === 'new') {
    console.log(JSON.stringify(newDoc, null, 2));
  } else if (target === 'old') {
    console.log(JSON.stringify(newToOld(newDoc), null, 2));
  } else {
    console.error(`Formato de salida no soportado: ${target}`);
    process.exit(1);
  }
}

async function handleMigrate(args: string[]) {
  const [sourceEngine, targetEngine, file, ...options] = args;
  
  if (!sourceEngine || !targetEngine || !file) {
    console.error('Usage: erdus migrate <source-engine> <target-engine> <file> [options]');
    process.exit(1);
  }

  const includeRLS = options.includes('--include-rls');
  const dryRun = options.includes('--dry-run');
  const includeComments = !options.includes('--no-comments');

  const schema = readFileSync(file, 'utf8');

  let result;
  if (targetEngine === 'supabase') {
    result = await migrateToSupabase(schema, sourceEngine as DatabaseEngine, {
      dryRun,
      includeComments
    });
  } else {
    const migrator = new DatabaseMigrator({
      sourceEngine: sourceEngine as DatabaseEngine,
      targetEngine: targetEngine as DatabaseEngine,
      generateRLS: includeRLS,
      dryRun,
      includeComments
    });
    result = await migrator.migrate(schema);
  }

  if (result.warnings.length > 0) {
    console.error('Warnings:');
    result.warnings.forEach(w => console.error('  -', w));
    console.error('');
  }

  if (result.errors.length > 0) {
    console.error('Errors:');
    result.errors.forEach(e => console.error('  -', e));
    process.exit(1);
  }

  if (result.sql) {
    console.log(result.sql);
  }
}

async function handleDiff(args: string[]) {
  const [oldFile, newFile, ...options] = args;
  
  if (!oldFile || !newFile) {
    console.error('Usage: erdus diff <old-file> <new-file>');
    process.exit(1);
  }

  const dryRun = options.includes('--dry-run');
  const includeComments = !options.includes('--no-comments');

  const oldSchema = readFileSync(oldFile, 'utf8');
  const newSchema = readFileSync(newFile, 'utf8');

  const result = generateSafeMigration(oldSchema, newSchema, 'postgresql', {
    dryRun,
    includeComments
  });

  if (result.warnings.length > 0) {
    console.error('Warnings:');
    result.warnings.forEach(w => console.error('  -', w));
    console.error('');
  }

  if (result.errors.length > 0) {
    console.error('Errors:');
    result.errors.forEach(e => console.error('  -', e));
    process.exit(1);
  }

  if (result.sql) {
    console.log(result.sql);
  }
}

async function handleRLS(args: string[]) {
  const [file, pattern = 'user-owned', ...options] = args;
  
  if (!file) {
    console.error('Usage: erdus rls <file> [pattern]');
    process.exit(1);
  }

  const includeComments = !options.includes('--no-comments');
  const schema = readFileSync(file, 'utf8');
  
  // Parse schema to IR
  const ir = sqlToIR(schema);

  let result: string;
  if (pattern === 'supabase') {
    result = generateSupabaseRLSHelpers(ir, { includeComments });
  } else {
    result = generateRLSPolicies(ir, { 
      includeComments,
      generateSelectPolicies: true,
      generateInsertPolicies: true,
      generateUpdatePolicies: true,
      generateDeletePolicies: pattern === 'multi-tenant'
    });
  }

  console.log(result);
}

main();
