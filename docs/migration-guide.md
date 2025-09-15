# Database Migration Guide

Erdus now supports comprehensive database migration between 6 main engines: Oracle, MySQL, SQL Server, PostgreSQL, MongoDB, and SQLite. This guide covers how to use the new migration features.

## Features

- **Universal Parsers**: Parse schema from any supported database engine
- **Cross-platform Migration**: Convert between different database engines
- **Supabase Support**: Generate PostgreSQL schemas with RLS policies
- **Safe Migrations**: Generate ALTER scripts with safety warnings
- **Dry-run Mode**: Preview migrations before execution
- **Modular Architecture**: Clean separation between parsers and generators

## Supported Engines

| Engine | Input | Output | Notes |
|--------|-------|--------|-------|
| PostgreSQL | ✅ | ✅ | Full support including advanced features |
| MySQL | ✅ | ✅ | Supports AUTO_INCREMENT, ENGINE options |
| SQL Server | ✅ | ✅ | Supports IDENTITY, NVARCHAR, schemas |
| Oracle | ✅ | ✅ | Supports sequences, triggers, constraints |
| SQLite | ✅ | ✅ | Supports AUTOINCREMENT, WITHOUT ROWID |
| MongoDB | ✅ | ✅ | Schema inference from documents |

## CLI Usage

### Basic Migration

Convert a schema from one database engine to another:

```bash
erdus migrate mysql postgresql schema.sql
```

### Migration to Supabase

Generate PostgreSQL schema with RLS policies:

```bash
erdus migrate mysql postgresql schema.sql --include-rls
```

### Generate Migration Script

Create a safe ALTER script between two schema versions:

```bash
erdus diff old-schema.sql new-schema.sql
```

### Generate RLS Policies

Create Row Level Security policies for PostgreSQL:

```bash
erdus rls schema.sql user-owned
```

## CLI Options

- `--dry-run`: Generate migration without execution markers
- `--include-rls`: Include RLS policies (PostgreSQL only)
- `--comments`: Include explanatory comments (default: true)
- `--no-comments`: Exclude comments from output
- `--strict`: Use strict validation

## RLS Patterns

### User-Owned Pattern
Each row is owned by a specific user:
```sql
CREATE POLICY "Users can view own posts" ON "posts"
  FOR SELECT USING ("user_id" = auth.uid());
```

### Multi-Tenant Pattern
Data is isolated by tenant/organization:
```sql
CREATE POLICY "Tenant isolation" ON "posts"
  FOR ALL USING ("tenant_id" = auth.jwt() ->> 'tenant_id');
```

### Public Read Pattern
Data is publicly readable but requires authentication to modify:
```sql
CREATE POLICY "Public read access" ON "posts"
  FOR SELECT USING (true);
```

## Programming API

### Basic Migration

```typescript
import { DatabaseMigrator } from './migration';

const migrator = new DatabaseMigrator({
  sourceEngine: 'mysql',
  targetEngine: 'postgresql',
  generateRLS: true,
  includeComments: true
});

const result = await migrator.migrate(sqlSchema);
if (result.success) {
  console.log(result.sql);
}
```

### Convenience Functions

```typescript
import { migrateToPostgreSQL, migrateToSupabase } from './migration';

// Migrate to PostgreSQL
const result1 = await migrateToPostgreSQL(schema, 'mysql');

// Migrate to Supabase with RLS
const result2 = await migrateToSupabase(schema, 'oracle', {
  rlsPattern: 'multi-tenant'
});
```

### Safe Migration Generation

```typescript
import { generateSafeMigration } from './migration';

const migration = generateSafeMigration(
  oldSchema, 
  newSchema, 
  'postgresql',
  { dryRun: true }
);

// Review warnings before applying
console.log('Warnings:', migration.warnings);
```

## Examples

### MySQL to PostgreSQL Migration

Input (MySQL):
```sql
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

Output (PostgreSQL):
```sql
-- Generated PostgreSQL schema
CREATE TABLE "users" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) UNIQUE,
  "created_at" TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY ("id")
);
```

### Oracle to Supabase Migration

Input (Oracle):
```sql
CREATE TABLE USERS (
  ID NUMBER(10) PRIMARY KEY,
  NAME VARCHAR2(255) NOT NULL,
  EMAIL VARCHAR2(255) UNIQUE
);
```

Output (PostgreSQL with RLS):
```sql
-- Generated PostgreSQL schema
CREATE TABLE "users" (
  "id" INTEGER NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) UNIQUE,
  PRIMARY KEY ("id")
);

-- Row Level Security Policies
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view users" ON "users"
  FOR SELECT USING (auth.role() = 'authenticated');
```

### MongoDB to PostgreSQL Migration

Input (MongoDB):
```javascript
db.users.insertMany([
  {
    _id: ObjectId(),
    name: "John Doe",
    email: "john@example.com",
    profile: {
      age: 30,
      city: "New York"
    }
  }
]);
```

Output (PostgreSQL):
```sql
-- Generated PostgreSQL schema
CREATE TABLE "users" (
  "_id" VARCHAR(255) PRIMARY KEY DEFAULT 'ObjectId()',
  "name" VARCHAR(255),
  "email" VARCHAR(255),
  "profile" JSONB
);
```

## Migration Safety

### Automatic Warnings

The migration tool automatically warns about potentially dangerous operations:

- **Data Loss**: Dropping tables or columns
- **Type Changes**: Converting between incompatible types
- **Constraint Changes**: Modifying NOT NULL or UNIQUE constraints

### Safe Migration Patterns

1. **Add columns before removing**: Add new columns first, migrate data, then remove old columns
2. **Use transactions**: All migrations are wrapped in transactions by default
3. **Dry-run first**: Always test with `--dry-run` before executing
4. **Backup data**: Create backups before running migrations

### Example Safe Migration

```sql
-- Database Migration Script
-- Generated by Erdus Migration Tool
-- Target Engine: postgresql
BEGIN;

-- Add new column first
ALTER TABLE "users" ADD COLUMN "full_name" VARCHAR(255);

-- Update data (manual step required)
-- UPDATE users SET full_name = CONCAT(first_name, ' ', last_name);

-- Remove old columns (commented for safety)
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "first_name";
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "last_name";

COMMIT;
```

## Best Practices

1. **Test Thoroughly**: Always test migrations on a copy of your production data
2. **Review Generated SQL**: Inspect the output before execution
3. **Use Version Control**: Track migration scripts in your repository
4. **Monitor Performance**: Large table alterations can impact performance
5. **Plan Rollbacks**: Have a rollback strategy for failed migrations

## Troubleshooting

### Common Issues

**Type Mapping Errors**
```
Error: Unsupported type conversion from DECIMAL(10,2) to MongoDB
```
Solution: Some types don't have direct equivalents across engines. Review the generated schema and adjust manually if needed.

**Foreign Key Constraint Violations**
```
Warning: Foreign key references table that doesn't exist: user_profiles
```
Solution: Ensure all referenced tables are included in the migration or create them first.

**RLS Policy Conflicts**
```
Error: Policy already exists
```
Solution: Use `DROP POLICY IF EXISTS` before creating new policies, or use `--dry-run` to review.

### Getting Help

1. Check the generated warnings and errors
2. Use `--dry-run` to preview changes
3. Review the generated SQL manually
4. Test on a small dataset first

## Contributing

To add support for a new database engine:

1. Create a new parser in `src/parsers/`
2. Implement the `parse<Engine>()` and `generate<Engine>()` functions
3. Add type mappings for the new engine
4. Write tests in `tests/`
5. Update documentation