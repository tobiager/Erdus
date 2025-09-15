# API Documentation

Erdus provides both a web interface and programmatic API for converting ER diagrams between different formats. This document covers the core API functions and data structures.

## Table of Contents

- [Core Concepts](#core-concepts)
- [Intermediate Representation (IR)](#intermediate-representation-ir)
- [Conversion Functions](#conversion-functions)
- [Format Detection](#format-detection)
- [Error Handling](#error-handling)
- [TypeScript Types](#typescript-types)
- [Examples](#examples)

## Core Concepts

### Intermediate Representation (IR)

All conversions in Erdus go through a common Intermediate Representation (IR) format. This ensures consistent handling of database schemas across different input and output formats.

```typescript
interface DatabaseSchema {
  tables: Table[];
  relationships: Relationship[];
  metadata?: {
    version?: string;
    created?: string;
    description?: string;
  };
}
```

### Supported Formats

- **ERDPlus** (old and new JSON formats)
- **SQL DDL** (PostgreSQL CREATE TABLE statements)
- **Prisma** schema files
- **TypeORM** entity classes
- **DBML** (for dbdiagram.io)
- **Mermaid** ER diagrams

## Conversion Functions

### ERDPlus Conversions

#### `convertOldToNew(oldData: ERDPlusOld): ERDPlusNew`

Converts ERDPlus old format to new format.

```typescript
import { convertOldToNew } from './src/convert';

const newFormat = convertOldToNew(oldERDPlusData);
```

#### `convertNewToOld(newData: ERDPlusNew): ERDPlusOld`

Converts ERDPlus new format to old format.

```typescript
import { convertNewToOld } from './src/convert';

const oldFormat = convertNewToOld(newERDPlusData);
```

### IR-Based Conversions

#### `erdplusToIR(data: ERDPlusOld | ERDPlusNew): DatabaseSchema`

Converts ERDPlus format to IR.

```typescript
import { erdplusToIR } from './src/converters/erdplus-to-ir';

const schema = erdplusToIR(erdplusData);
```

#### `irToSQL(schema: DatabaseSchema): string`

Converts IR to PostgreSQL DDL.

```typescript
import { irToSQL } from './src/converters/ir-to-sql';

const sqlDDL = irToSQL(schema);
```

#### `sqlToIR(sql: string): DatabaseSchema`

Parses PostgreSQL DDL to IR.

```typescript
import { sqlToIR } from './src/converters/sql-to-ir';

const schema = sqlToIR(sqlString);
```

#### `irToPrisma(schema: DatabaseSchema): string`

Converts IR to Prisma schema.

```typescript
import { irToPrisma } from './src/converters/ir-to-prisma';

const prismaSchema = irToPrisma(schema);
```

#### `prismaToIR(prisma: string): DatabaseSchema`

Parses Prisma schema to IR.

```typescript
import { prismaToIR } from './src/converters/prisma-to-ir';

const schema = prismaToIR(prismaString);
```

#### `irToTypeORM(schema: DatabaseSchema): string`

Converts IR to TypeORM entities.

```typescript
import { irToTypeORM } from './src/converters/ir-to-typeorm';

const entities = irToTypeORM(schema);
```

#### `irToDBML(schema: DatabaseSchema): string`

Converts IR to DBML format.

```typescript
import { irToDBML } from './src/converters/ir-to-dbml';

const dbml = irToDBML(schema);
```

#### `irToMermaid(schema: DatabaseSchema): string`

Converts IR to Mermaid ER diagram.

```typescript
import { irToMermaid } from './src/converters/ir-to-mermaid';

const mermaid = irToMermaid(schema);
```

## Format Detection

### `detectFormat(content: string): FormatType`

Automatically detects the format of input content.

```typescript
import { detectFormat } from './src/utils/format-detector';

const format = detectFormat(fileContent);
// Returns: 'erdplus-old' | 'erdplus-new' | 'sql' | 'prisma' | 'typeorm' | 'unknown'
```

## Error Handling

All conversion functions may throw errors. It's recommended to wrap them in try-catch blocks:

```typescript
try {
  const result = convertOldToNew(inputData);
  console.log('Conversion successful:', result);
} catch (error) {
  console.error('Conversion failed:', error.message);
}
```

### Common Error Types

- `ValidationError`: Input data doesn't match expected format
- `ConversionError`: Error during the conversion process
- `ParseError`: Unable to parse input content

## TypeScript Types

### Core Types

```typescript
interface Table {
  id: string;
  name: string;
  columns: Column[];
  position?: { x: number; y: number };
}

interface Column {
  id: string;
  name: string;
  type: string;
  nullable?: boolean;
  primaryKey?: boolean;
  unique?: boolean;
  defaultValue?: string;
  references?: {
    table: string;
    column: string;
  };
}

interface Relationship {
  id: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  fromTable: string;
  toTable: string;
  fromColumns: string[];
  toColumns: string[];
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
}
```

### ERDPlus Types

```typescript
interface ERDPlusOld {
  shapes: Shape[];
  connectors: Connector[];
  width: number;
  height: number;
}

interface ERDPlusNew {
  version: string;
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
}
```

## Examples

### Complete Conversion Workflow

```typescript
import { 
  detectFormat, 
  erdplusToIR, 
  sqlToIR, 
  irToSQL, 
  irToPrisma 
} from 'erdus';

async function convertFile(content: string, targetFormat: string) {
  try {
    // Detect input format
    const inputFormat = detectFormat(content);
    
    // Convert to IR
    let schema: DatabaseSchema;
    
    switch (inputFormat) {
      case 'erdplus-old':
      case 'erdplus-new':
        schema = erdplusToIR(JSON.parse(content));
        break;
      case 'sql':
        schema = sqlToIR(content);
        break;
      default:
        throw new Error(`Unsupported input format: ${inputFormat}`);
    }
    
    // Convert from IR to target format
    switch (targetFormat) {
      case 'sql':
        return irToSQL(schema);
      case 'prisma':
        return irToPrisma(schema);
      default:
        throw new Error(`Unsupported target format: ${targetFormat}`);
    }
  } catch (error) {
    console.error('Conversion failed:', error);
    throw error;
  }
}
```

### Batch Processing

```typescript
async function convertMultipleFiles(files: File[]) {
  const results = [];
  
  for (const file of files) {
    try {
      const content = await file.text();
      const format = detectFormat(content);
      
      if (format !== 'unknown') {
        const schema = erdplusToIR(JSON.parse(content));
        const sql = irToSQL(schema);
        
        results.push({
          filename: file.name,
          success: true,
          output: sql
        });
      } else {
        results.push({
          filename: file.name,
          success: false,
          error: 'Unknown format'
        });
      }
    } catch (error) {
      results.push({
        filename: file.name,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}
```

## CLI Usage

Erdus also provides a command-line interface:

```bash
# Convert ERDPlus to SQL
npm run cli convert input.erdplus --to sql --output schema.sql

# Convert SQL to Prisma
npm run cli convert schema.sql --to prisma --output schema.prisma

# Batch convert all ERDPlus files in a directory
npm run cli batch ./erdplus-files --to sql --output ./sql-files
```

For more detailed CLI documentation, see [CLI Documentation](CLI.md).