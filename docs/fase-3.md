# Erdus Phase 3 - Development Ecosystem

This document outlines the complete implementation of Phase 3 for Erdus, which introduces a comprehensive development ecosystem for universal database schema conversion and management.

## Overview

Phase 3 transforms Erdus from a simple ER diagram converter into a powerful database migration and schema generation tool that supports:

- **IR → JSON Schema** for API validation and documentation
- **IR → Sequelize models** for Node.js ORMs
- **IR → Supabase schemas** with PostgreSQL + RLS policies
- **Schema diff/migration system** for version control
- **Universal database migration** supporting 6 engines → PostgreSQL/Supabase

## Architecture

### Core Components

1. **Extended IR (Intermediate Representation)**
   - Comprehensive schema definition with entities, attributes, relations, enums
   - Zod validation schemas for type safety
   - Backward compatibility with legacy IRDiagram format

2. **Type Mapping System**
   - Cross-database type conversion utilities
   - Default value translation (e.g., `GETDATE()` → `now()`)
   - Constraint action normalization

3. **Code Generators**
   - JSON Schema with OpenAPI/AJV support
   - Sequelize TypeScript models with decorators
   - PostgreSQL/Supabase DDL with RLS policies

4. **Migration Tools**
   - Schema comparison and diff generation
   - SQL ALTER script generation
   - Multi-engine DDL parsing and conversion

## Command Line Interface

The `erdus` CLI provides five main commands:

### 1. JSON Schema Generation

```bash
erdus jsonschema --in schema.json --out ./schemas/
```

**Options:**
- `--target openapi|ajv` - Target JSON Schema variant
- `--id-prefix <prefix>` - Schema $id prefix for references

**Features:**
- Type mapping with proper formats (uuid, date-time, email)
- Nullable handling for OpenAPI vs. JSON Schema Draft 7
- Foreign key annotations as `x-foreignKey` extensions
- Unique constraint markers as `x-unique`

### 2. Sequelize Model Generation

```bash
erdus sequelize --in schema.json --dialect postgres --out ./models/
```

**Options:**
- `--dialect postgres|mysql|mssql|sqlite` - Target database
- `--out <dir>` - Output directory for models

**Features:**
- TypeScript models with decorators
- Automatic association generation (belongsTo, hasMany, belongsToMany)
- Index and constraint definitions
- Type-safe property annotations

### 3. Supabase Schema Generation

```bash
erdus supabase --in schema.json --with-rls --schema public --out schema.sql
```

**Options:**
- `--with-rls` - Include Row Level Security policies
- `--schema <name>` - Target schema name

**Features:**
- PostgreSQL 15+ compatible DDL
- Automatic extension setup (uuid-ossp, pgcrypto)
- RLS policies with owner-based and authenticated patterns
- Foreign key constraints with referential actions

### 4. Schema Diff & Migration

```bash
erdus diff --from old.json --to new.json --out migration.sql
```

**Options:**
- `--detect-renames` - Enable table/column rename detection

**Features:**
- Comprehensive change detection (tables, columns, indexes, constraints)
- Similarity-based rename detection
- PostgreSQL ALTER script generation
- Migration warnings for potentially destructive changes

### 5. Database Migration

```bash
erdus migrar-db --engine sqlserver --in ./input.sql --schema public --with-rls --out supabase.sql
```

**Supported Engines:**
- `sqlserver` - Microsoft SQL Server
- `mysql` - MySQL 5.7+
- `oracle` - Oracle Database (planned)
- `postgresql` - PostgreSQL (normalization)
- `sqlite` - SQLite 3 (planned)
- `mongodb` - MongoDB collections (planned)

**Features:**
- DDL parsing and normalization
- Type mapping with precision/scale preservation
- Default value translation
- Constraint and index conversion

## Type Mappings

### SQL Server → PostgreSQL

| SQL Server | PostgreSQL | Notes |
|------------|------------|-------|
| `INT` | `integer` | |
| `BIGINT` | `bigint` | |
| `BIT` | `boolean` | |
| `DECIMAL(p,s)` | `numeric(p,s)` | Precision preserved |
| `VARCHAR(n)` | `varchar(n)` | Length preserved |
| `NVARCHAR(n)` | `varchar(n)` | Unicode normalized |
| `DATETIME2` | `timestamp with time zone` | |
| `UNIQUEIDENTIFIER` | `uuid` | |

### Default Function Mappings

| Source | Target | Engine |
|--------|--------|--------|
| `GETDATE()` | `now()` | SQL Server |
| `NEWID()` | `gen_random_uuid()` | SQL Server |
| `NOW()` | `now()` | MySQL |
| `UUID()` | `gen_random_uuid()` | MySQL |
| `SYSDATE` | `now()` | Oracle |

## Usage Examples

### Basic Workflow

1. **Start with any schema format:**
   ```bash
   # From SQL Server DDL
   erdus migrar-db --engine sqlserver --in schema.ddl --out supabase.sql
   
   # From existing IR
   erdus supabase --in schema.ir.json --with-rls --out supabase.sql
   ```

2. **Generate application code:**
   ```bash
   erdus sequelize --in schema.ir.json --dialect postgres --out ./src/models/
   erdus jsonschema --in schema.ir.json --target openapi --out ./api/schemas/
   ```

3. **Version control migrations:**
   ```bash
   erdus diff --from v1.ir.json --to v2.ir.json --out migrations/v2.sql
   ```

### Real Example: E-commerce Platform

Given this SQL Server schema:
```sql
CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE Orders (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Total DECIMAL(10,2) NOT NULL,
    CONSTRAINT FK_Orders_Users FOREIGN KEY (UserId) REFERENCES Users(Id)
);
```

Convert to Supabase:
```bash
erdus migrar-db --engine sqlserver --in ecommerce.sql --with-rls --out supabase.sql
```

Generates:
```sql
-- Supabase Schema Generated by Erdus
CREATE EXTENSION IF NOT EXISTS 'uuid-ossp';

CREATE TABLE users (
  id serial PRIMARY KEY,
  email varchar(255) NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE orders (
  id serial PRIMARY KEY,
  user_id integer NOT NULL,
  total numeric(10,2) NOT NULL
);

ALTER TABLE orders ADD CONSTRAINT fk_orders_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_full_access_users" ON users
  FOR ALL USING (auth.role() = 'authenticated');
```

## Advanced Features

### Row Level Security Patterns

When `--with-rls` is enabled, Erdus generates common RLS patterns:

1. **Owner-based policies** (when `owner_id` column exists):
   ```sql
   CREATE POLICY "owner_can_select_posts" ON posts
     FOR SELECT USING (auth.uid() = owner_id);
   ```

2. **Role-based policies** (default):
   ```sql
   CREATE POLICY "authenticated_full_access_users" ON users
     FOR ALL USING (auth.role() = 'authenticated');
   ```

### Rename Detection

The diff system can detect probable renames using similarity scoring:

```bash
erdus diff --from old.json --to new.json --detect-renames --out migration.sql
```

This analyzes column names and types to suggest rename operations instead of drop+create.

### Validation & Error Handling

All inputs are validated using Zod schemas:
- IR structure validation
- Type constraint validation  
- Referential integrity checks
- Reserved word detection

## Integration with Existing Tools

### With TypeORM

Erdus can convert between IR and TypeORM entities:
```bash
# Convert TypeORM to IR, then to other formats
erdus convert entities.ts sql > schema.sql
```

### With Prisma

Similar workflow for Prisma schemas:
```bash
erdus convert schema.prisma sql > schema.sql
```

### CI/CD Integration

Example GitHub Actions workflow:
```yaml
- name: Generate Migration
  run: erdus diff --from ${{ matrix.old_schema }} --to schema.ir.json --out migration.sql

- name: Deploy to Supabase
  run: psql $DATABASE_URL -f migration.sql
```

## Extensibility

The architecture is designed for easy extension:

1. **New Database Engines**: Add parsers in `src/migrations/ingest/`
2. **New Generators**: Add generators in `src/generators/`
3. **Custom Types**: Extend mapping tables in `src/ir/mapping.ts`
4. **RLS Patterns**: Add policies in Supabase generator

## Performance & Limitations

### Current Limitations

- **SQL Parsing**: Uses regex-based parsing; complex SQL may require manual review
- **Data Migration**: DDL only, no DML (INSERT/UPDATE) migration
- **Stored Procedures**: Not supported in initial version
- **Complex Constraints**: CHECK constraints with subqueries may not translate

### Performance

- **Large Schemas**: Tested with 100+ tables
- **Memory Usage**: Optimized for streaming large DDL files
- **Generation Speed**: Sub-second for typical schemas

## Future Roadmap

Phase 4 planned features:
- **Data migration** (DML) support
- **Real-time sync** between databases
- **Visual schema editor** integration
- **Cloud deployment** automation
- **Advanced RLS** pattern library

---

Erdus Phase 3 provides a complete ecosystem for modern database development, enabling teams to work with any database engine while targeting modern cloud-native platforms like Supabase.