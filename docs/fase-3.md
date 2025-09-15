# Phase 3 - Ecosystem Development

This document outlines the Phase 3 development ecosystem for the Erdus project - a universal ER diagram converter with comprehensive database tooling.

## Overview

Phase 3 introduces powerful new capabilities for converting, generating, and migrating database schemas across multiple platforms and formats.

### Key Features

- **JSON Schema Generation**: Convert IR to JSON Schema for API validation
- **Sequelize Models**: Generate TypeScript Sequelize models with decorators
- **Supabase Integration**: Create PostgreSQL schemas with Row Level Security
- **Database Migration**: Cross-platform SQL migration between 6 database engines
- **Schema Diffing**: Generate migration scripts between schema versions

## CLI Usage

The `erdus` CLI provides five main commands:

### 1. JSON Schema Generation

```bash
erdus jsonschema --in schema.json --out ./out/jsonschema
```

**Options:**
- `--in`: Input IR schema file (JSON)
- `--out`: Output directory for JSON schema files
- `--id-prefix`: JSON Schema $id prefix for references
- `--target`: Target format (`openapi` or `ajv`)

### 2. Sequelize Models

```bash
erdus sequelize --in schema.json --dialect postgres --out ./out/sequelize
```

**Options:**
- `--in`: Input IR schema file (JSON)
- `--out`: Output directory for TypeScript files
- `--dialect`: Database dialect (`postgres`, `mysql`, `mssql`, `sqlite`)
- `--no-decorators`: Use traditional Sequelize syntax instead of decorators
- `--format`: Export format (`esm` or `commonjs`)

### 3. Supabase Schema

```bash
erdus supabase --in schema.json --with-rls --schema public --out ./out/schema.sql
```

**Options:**
- `--in`: Input IR schema file (JSON)
- `--out`: Output SQL file
- `--with-rls`: Include Row Level Security policies
- `--schema`: PostgreSQL schema name (default: `public`)

### 4. Schema Diff & Migration

```bash
erdus diff --from a.json --to b.json --out ./out/alter.sql
```

**Options:**
- `--from`: Source IR schema file
- `--to`: Target IR schema file
- `--out`: Output SQL migration file
- `--schema`: PostgreSQL schema name for migration

### 5. Database Migration

```bash
erdus migrar-db --engine sqlserver --in ./input.sql --schema public --with-rls --out ./out/supabase.sql
```

**Options:**
- `--engine`: Source database engine (`oracle`, `mysql`, `sqlserver`, `postgresql`, `mongodb`, `sqlite`)
- `--in`: Input SQL script file
- `--out`: Output PostgreSQL/Supabase SQL file
- `--schema`: Target PostgreSQL schema name
- `--with-rls`: Include Row Level Security policies

## Example Workflows

### Convert SQL Server to Supabase

1. Export your SQL Server schema to a `.sql` file
2. Run the migration command:
   ```bash
   erdus migrar-db --engine sqlserver --in ./sqlserver-schema.sql --with-rls --out ./supabase-schema.sql
   ```
3. Review and apply the generated PostgreSQL schema

### Generate API Documentation

1. Create an IR schema from your database
2. Generate JSON schemas:
   ```bash
   erdus jsonschema --in schema.json --target openapi --out ./api-docs
   ```
3. Use the JSON schemas in your OpenAPI specification

### Create TypeScript Models

1. From your IR schema, generate Sequelize models:
   ```bash
   erdus sequelize --in schema.json --dialect postgres --out ./src/models
   ```
2. Import and use the generated TypeScript classes

### Manage Schema Evolution

1. Create migration between schema versions:
   ```bash
   erdus diff --from ./v1-schema.json --to ./v2-schema.json --out ./migrations/v1-to-v2.sql
   ```
2. Apply the generated ALTER statements to your database

## IR Schema Format

The Intermediate Representation (IR) schema is the core format used by all generators. Here's the structure:

```typescript
interface IRSchema {
  entities: IREntity[];
  relations: IRRelation[];
  enums?: IREnum[];
  checks?: IRCheck[];
  comments?: IRComment[];
  indexes?: IRIndex[];
}

interface IREntity {
  name: string;
  attributes: IRAttribute[];
  primaryKey?: string[];
  indexes?: IRIndex[];
  uniques?: string[][];
}

interface IRAttribute {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isOptional?: boolean;
  isUnique?: boolean;
  default?: string;
  references?: {
    table: string;
    column: string;
    onDelete?: string;
    onUpdate?: string;
  };
}
```

### Example IR Schema

```json
{
  "entities": [
    {
      "name": "User",
      "attributes": [
        {
          "name": "id",
          "type": "uuid",
          "isPrimaryKey": true,
          "isOptional": false,
          "default": "gen_random_uuid()"
        },
        {
          "name": "email",
          "type": "varchar(255)",
          "isOptional": false,
          "isUnique": true
        },
        {
          "name": "name",
          "type": "varchar(100)",
          "isOptional": true
        }
      ]
    },
    {
      "name": "Post",
      "attributes": [
        {
          "name": "id",
          "type": "uuid",
          "isPrimaryKey": true,
          "isOptional": false
        },
        {
          "name": "user_id",
          "type": "uuid",
          "isOptional": false,
          "references": {
            "table": "User",
            "column": "id",
            "onDelete": "CASCADE"
          }
        },
        {
          "name": "title",
          "type": "varchar(200)",
          "isOptional": false
        }
      ]
    }
  ],
  "relations": [
    {
      "type": "1-N",
      "sourceEntity": "User",
      "targetEntity": "Post",
      "sourceColumns": ["id"],
      "targetColumns": ["user_id"]
    }
  ]
}
```

## Features by Generator

### JSON Schema Generator

- Maps SQL types to JSON Schema types
- Supports nullable fields and default values
- Includes foreign key references as extensions
- OpenAPI and AJV target formats
- Validates required fields and constraints

### Sequelize Generator

- TypeScript model classes with proper typing
- Sequelize decorators (`@Table`, `@Column`, etc.)
- Traditional Sequelize syntax support
- Association generation for relationships
- Support for all major SQL databases

### Supabase Generator

- PostgreSQL-compatible DDL generation
- Row Level Security (RLS) policies
- Automatic policy generation for common patterns
- Support for custom schema names
- Comments and constraints preservation

### Migration System

- Cross-platform SQL parsing and conversion
- Intelligent type mapping between database engines
- Function call translation (e.g., `GETDATE()` → `now()`)
- Constraint and index migration
- Comprehensive engine support

## Supported Database Engines

| Engine | Input Support | Type Mapping | Function Translation |
|--------|---------------|--------------|---------------------|
| SQL Server | ✅ | ✅ | ✅ (`GETDATE()`, `NEWID()`) |
| MySQL | ✅ | ✅ | ✅ (`NOW()`, `UUID()`) |
| Oracle | ✅ | ✅ | ✅ (`SYSDATE`, `SYS_GUID()`) |
| PostgreSQL | ✅ | ✅ | ✅ (Pass-through) |
| SQLite | ✅ | ✅ | ✅ (Type affinity) |
| MongoDB | ✅ | ✅ | ✅ (BSON → PostgreSQL) |

## Integration

The Phase 3 tools integrate seamlessly with the existing Erdus ecosystem:

- Compatible with existing IR formats
- Preserves all ERDPlus conversion capabilities
- Extends TypeORM generation (existing)
- Supports Prisma and other ORM outputs

## Next Steps

1. Install dependencies: `npm install`
2. Build the CLI: `npm run build`
3. Try the examples in the `examples/` directory
4. Read the detailed mapping documentation in `mapping-tipos.md`
5. Check the migration guide in `migrar-db.md`