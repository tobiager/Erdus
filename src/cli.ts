#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { oldToNew, newToOld } from './convert';
import { newToIR } from './ir';
import { irToPostgres } from './ir-to-sql';
import { irToPrisma } from './ir-to-prisma';
import { irToTypeorm } from './ir-to-typeorm';
import { sqlToIR } from './sql-to-ir';
import { prismaToIR } from './prisma-to-ir';
import { typeormToIR } from './typeorm-to-ir';
import { irToNew } from './ir-to-new';
import { diffIR } from './migration';
import { renderMigration, type SqlDialect } from './migration-render';
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
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    printUsage();
    process.exit(1);
  }

  const command = args[0];

  if (command === 'convert') {
    handleConvert(args.slice(1));
  } else if (command === 'diff') {
    handleDiff(args.slice(1));
  } else if (command === 'render:migration') {
    handleRenderMigration(args.slice(1));
  } else {
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
  }
}

function printUsage() {
  console.log(`
Usage: erdus <command> [options]

Commands:
  convert <input> <target>                Convert between formats
  diff --old <file> --new <file> --out <file>   Generate migration plan
  render:migration --plan <file> --dialect <dialect> --out <file>   Render migration SQL

Convert targets: sql|prisma|typeorm|old|new
Migration dialects: postgres|sqlserver|mysql|sqlite

Examples:
  erdus convert schema.sql prisma
  erdus diff --old old.ir.json --new new.ir.json --out plan.json
  erdus render:migration --plan plan.json --dialect postgres --out migration.sql
`);
}

function handleConvert(args: string[]) {
  const [file, target] = args;
  if (!file || !target) {
    console.error('Usage: erdus convert <entrada> <sql|prisma|typeorm|old|new>');
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
  } else if (target === 'ir') {
    console.log(JSON.stringify(ir, null, 2));
  } else {
    console.error(`Formato de salida no soportado: ${target}`);
    process.exit(1);
  }
}

function handleDiff(args: string[]) {
  const params = parseParams(args);
  
  if (!params.old || !params.new || !params.out) {
    console.error('Usage: erdus diff --old <file> --new <file> --out <file>');
    process.exit(1);
  }

  try {
    const oldIR: IRDiagram = JSON.parse(readFileSync(params.old, 'utf8'));
    const newIR: IRDiagram = JSON.parse(readFileSync(params.new, 'utf8'));
    
    const migrationPlan = diffIR(oldIR, newIR);
    
    writeFileSync(params.out, JSON.stringify(migrationPlan, null, 2));
    console.log(`Migration plan written to ${params.out}`);
  } catch (error: any) {
    console.error(`Error generating migration plan: ${error.message}`);
    process.exit(1);
  }
}

function handleRenderMigration(args: string[]) {
  const params = parseParams(args);
  
  if (!params.plan || !params.dialect || !params.out) {
    console.error('Usage: erdus render:migration --plan <file> --dialect <dialect> --out <file>');
    console.error('Dialects: postgres|sqlserver|mysql|sqlite');
    process.exit(1);
  }

  const validDialects: SqlDialect[] = ['postgres', 'sqlserver', 'mysql', 'sqlite'];
  if (!validDialects.includes(params.dialect as SqlDialect)) {
    console.error(`Invalid dialect: ${params.dialect}. Must be one of: ${validDialects.join(', ')}`);
    process.exit(1);
  }

  try {
    const migrationPlan = JSON.parse(readFileSync(params.plan, 'utf8'));
    const sql = renderMigration(migrationPlan, params.dialect as SqlDialect);
    
    writeFileSync(params.out, sql);
    console.log(`Migration SQL written to ${params.out}`);
  } catch (error: any) {
    console.error(`Error rendering migration: ${error.message}`);
    process.exit(1);
  }
}

function parseParams(args: string[]): Record<string, string> {
  const params: Record<string, string> = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    const value = args[i + 1];
    if (key && value) {
      params[key] = value;
    }
  }
  
  return params;
}

main();
