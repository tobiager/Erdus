#!/usr/bin/env node
import { readFileSync } from 'fs';
import { oldToNew, newToOld } from './convert';
import { newToIR } from './ir';
import { irToPostgres } from './ir-to-sql';
import { irToPrisma } from './ir-to-prisma';
import { irToTypeorm } from './ir-to-typeorm';
import { irToDbml } from './ir-to-dbml';
import { irToMermaid } from './ir-to-mermaid';
import { sqlToIR } from './sql-to-ir';
import { prismaToIR } from './prisma-to-ir';
import { typeormToIR } from './typeorm-to-ir';
import { irToNew } from './ir-to-new';
import { irToJSONSchema, formatJSONSchemaOutput } from './ecosystem/json-schema';
import { irToSequelize } from './ecosystem/sequelize';
import { irToSupabase } from './ecosystem/supabase';
import { diffIRDiagrams, formatMigrationReport } from './ecosystem/diff';
import type { IRDiagram } from './ir';

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

function main() {
  const [, , cmd, ...args] = process.argv;
  
  if (cmd === 'convert') {
    handleConvert(args);
  } else if (cmd === 'to-jsonschema') {
    handleToJSONSchema(args);
  } else if (cmd === 'to-sequelize') {
    handleToSequelize(args);
  } else if (cmd === 'to-supabase') {
    handleToSupabase(args);
  } else if (cmd === 'diff') {
    handleDiff(args);
  } else {
    showUsage();
    process.exit(1);
  }
}

function showUsage() {
  console.error(`
Usage: erdus <command> [options]

Commands:
  convert <file> <target>        Convert between formats
    Targets: sql|prisma|typeorm|old|new|dbml|mermaid
  
  to-jsonschema <file> [options] Generate JSON Schema from IR
    --separate                   Generate separate schemas per table
    --base-url <url>             Base URL for schema IDs
    
  to-sequelize <file> [options]  Generate Sequelize models from IR
    --no-associations            Exclude model associations
    --no-timestamps              Exclude timestamps
    
  to-supabase <file> [options]   Generate Supabase schema from IR
    --no-rls                     Exclude RLS policies
    --policy <type>              RLS policy type (authenticated|public|owner-only)
    --no-audit                   Exclude audit columns
    
  diff <old-file> <new-file>     Compare schemas and generate migration
    --include-drops              Include DROP operations
    --no-rollback                Skip rollback SQL generation

Examples:
  erdus convert schema.sql prisma
  erdus to-jsonschema schema.json --separate
  erdus to-sequelize schema.prisma --no-timestamps
  erdus to-supabase schema.json --policy authenticated
  erdus diff old-schema.sql new-schema.sql --include-drops
`);
}

function handleConvert(args: string[]) {
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
  } else if (target === 'dbml') {
    console.log(irToDbml(ir, { includeComments: true }));
  } else if (target === 'mermaid') {
    console.log(irToMermaid(ir, { includeAttributes: true, direction: 'TD' }));
  } else if (target === 'new') {
    console.log(JSON.stringify(newDoc, null, 2));
  } else if (target === 'old') {
    console.log(JSON.stringify(newToOld(newDoc), null, 2));
  } else {
    console.error(`Unsupported output format: ${target}`);
    process.exit(1);
  }
}

function handleToJSONSchema(args: string[]) {
  const [file, ...options] = args;
  if (!file) {
    console.error('Usage: erdus to-jsonschema <file> [options]');
    process.exit(1);
  }
  
  const separateSchemas = options.includes('--separate');
  const baseUrlIndex = options.indexOf('--base-url');
  const baseUrl = baseUrlIndex !== -1 ? options[baseUrlIndex + 1] : undefined;
  
  const raw = readFileSync(file, 'utf8');
  const ir = parseInputToIR(raw);
  
  const result = irToJSONSchema(ir, {
    separateSchemas,
    baseUrl,
    includeNullable: true,
    includeDescriptions: true,
  });
  
  console.log(formatJSONSchemaOutput(result));
}

function handleToSequelize(args: string[]) {
  const [file, ...options] = args;
  if (!file) {
    console.error('Usage: erdus to-sequelize <file> [options]');
    process.exit(1);
  }
  
  const includeAssociations = !options.includes('--no-associations');
  const timestamps = !options.includes('--no-timestamps');
  
  const raw = readFileSync(file, 'utf8');
  const ir = parseInputToIR(raw);
  
  const result = irToSequelize(ir, {
    typescript: true,
    includeAssociations,
    timestamps,
    includeInit: true,
  });
  
  console.log(result);
}

function handleToSupabase(args: string[]) {
  const [file, ...options] = args;
  if (!file) {
    console.error('Usage: erdus to-supabase <file> [options]');
    process.exit(1);
  }
  
  const includeRLS = !options.includes('--no-rls');
  const includeAuditColumns = !options.includes('--no-audit');
  
  const policyIndex = options.indexOf('--policy');
  const defaultRLSPolicy = policyIndex !== -1 ? options[policyIndex + 1] as any : 'authenticated';
  
  const raw = readFileSync(file, 'utf8');
  const ir = parseInputToIR(raw);
  
  const result = irToSupabase(ir, {
    includeRLS,
    includeAuditColumns,
    defaultRLSPolicy,
    includeUUIDExtension: true,
    includeFunctions: true,
    includeUpdatedAtTriggers: true,
  });
  
  console.log(result);
}

function handleDiff(args: string[]) {
  const [oldFile, newFile, ...options] = args;
  if (!oldFile || !newFile) {
    console.error('Usage: erdus diff <old-file> <new-file> [options]');
    process.exit(1);
  }
  
  const includeDrops = options.includes('--include-drops');
  const generateRollback = !options.includes('--no-rollback');
  
  const oldRaw = readFileSync(oldFile, 'utf8');
  const newRaw = readFileSync(newFile, 'utf8');
  
  const oldIR = parseInputToIR(oldRaw);
  const newIR = parseInputToIR(newRaw);
  
  const migrationPlan = diffIRDiagrams(oldIR, newIR, {
    includeDrops,
    generateRollback,
    allowDestructive: includeDrops,
  });
  
  console.log(formatMigrationReport(migrationPlan));
}

function parseInputToIR(raw: string): IRDiagram {
  const fmt = detectInput(raw);
  let ir: IRDiagram;
  
  if (fmt === 'old') {
    const data = JSON.parse(raw);
    const newDoc = oldToNew(data);
    ir = newToIR(newDoc);
  } else if (fmt === 'new') {
    const newDoc = JSON.parse(raw);
    ir = newToIR(newDoc);
  } else if (fmt === 'sql') {
    ir = sqlToIR(raw);
  } else if (fmt === 'typeorm') {
    ir = typeormToIR(raw);
  } else {
    ir = prismaToIR(raw);
  }
  
  return ir;
}

main();
