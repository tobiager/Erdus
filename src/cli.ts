#!/usr/bin/env node
import { readFileSync } from 'fs';
import { oldToNew, newToOld } from './convert';
import { newToIR } from './ir';
import { irToPostgres } from './ir-to-sql';
import { irToPrisma } from './ir-to-prisma';
import { sqlToIR } from './sql-to-ir';
import { prismaToIR } from './prisma-to-ir';
import { irToNew } from './ir-to-new';
import type { IRDiagram } from './ir';

function detectInput(text: string): 'old'|'new'|'sql'|'prisma' {
  try {
    const obj = JSON.parse(text);
    if (obj && obj.version === 2 && obj.www === 'erdplus.com' && Array.isArray(obj.shapes)) return 'old';
    if (obj && obj.diagramType === 2 && obj.data && Array.isArray(obj.data.nodes)) return 'new';
  } catch { /* ignore */ }
  if (/model\s+\w+\s+{/.test(text)) return 'prisma';
  if (/CREATE TABLE/i.test(text)) return 'sql';
  throw new Error('Formato de entrada no soportado');
}

function main() {
  const [, , cmd, file, target] = process.argv;
  if (cmd !== 'convert' || !file || !target) {
    console.error('Uso: erdus convert <entrada> <sql|prisma|old|new>');
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
  } else {
    ir = prismaToIR(raw);
    newDoc = irToNew(ir);
  }

  if (target === 'sql') {
    console.log(irToPostgres(ir));
  } else if (target === 'prisma') {
    console.log(irToPrisma(ir));
  } else if (target === 'new') {
    console.log(JSON.stringify(newDoc, null, 2));
  } else if (target === 'old') {
    console.log(JSON.stringify(newToOld(newDoc), null, 2));
  } else {
    console.error(`Formato de salida no soportado: ${target}`);
    process.exit(1);
  }
}

main();
