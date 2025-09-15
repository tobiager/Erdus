# Getting Started

Welcome to Erdus! This guide will help you get up and running quickly with the universal ER diagram converter.

## What is Erdus?

Erdus is an open-source tool that converts Entity-Relationship diagrams between different formats. Whether you're working with ERDPlus, SQL schemas, Prisma models, or TypeORM entities, Erdus provides seamless conversion while preserving your data's integrity.

### Key Features

- **Universal Conversion**: Convert between ERDPlus, SQL, Prisma, TypeORM, DBML, and Mermaid formats
- **Privacy-First**: 100% client-side processing - your files never leave your browser
- **Lossless Conversion**: Round-trip conversions maintain structural integrity
- **Composite Foreign Keys**: Full support for complex database relationships
- **Automatic Detection**: Smart format recognition for seamless workflow

## Quick Start

### Option 1: Web Interface (Recommended)

The fastest way to start using Erdus:

1. **Visit the web app**: https://erdus-inky.vercel.app
2. **Upload your file**: Drag and drop or click to select
3. **Choose output format**: Select your desired target format
4. **Download result**: Get your converted file instantly

### Option 2: Local Installation

For development or offline use:

```bash
# Clone the repository
git clone https://github.com/tobiager/Erdus.git
cd Erdus

# Install dependencies
npm install --legacy-peer-deps

# Start the development server
npm run dev
```

Open http://localhost:5173 in your browser.

## Your First Conversion

Let's walk through a simple conversion from ERDPlus to SQL:

### Step 1: Prepare Your ERDPlus File

Ensure you have an ERDPlus file (`.erdplus` extension) with your database design. If you don't have one, you can use the [example files](../examples/) in the repository.

### Step 2: Upload and Convert

1. Open the Erdus web interface
2. Drag your `.erdplus` file into the upload area
3. The system will automatically detect the format
4. Select "SQL" as your target format
5. Click "Convert"

### Step 3: Review the Output

Your SQL file will be generated with:
- `CREATE TABLE` statements for all entities
- Primary key constraints
- Foreign key relationships
- Data type mappings
- Index definitions

## Supported Formats

### Input Formats

| Format | Extension | Description |
|--------|-----------|-------------|
| ERDPlus Old | `.erdplus` | Legacy ERDPlus JSON format |
| ERDPlus New | `.erdplus` | Modern ERDPlus JSON format |
| SQL DDL | `.sql` | PostgreSQL CREATE TABLE statements |
| Prisma | `.prisma` | Prisma schema files |
| TypeORM | `.ts` | TypeScript entity definitions |

### Output Formats

| Format | Extension | Use Case |
|--------|-----------|----------|
| SQL | `.sql` | Database creation and migration |
| Prisma | `.prisma` | Node.js/TypeScript development |
| TypeORM | `.ts` | TypeScript entity models |
| DBML | `.dbml` | Database documentation with dbdiagram.io |
| Mermaid | `.mmd` | Documentation and README files |

## Understanding the Conversion Process

Erdus uses an Intermediate Representation (IR) to ensure consistent conversions:

```
Input Format → Parser → IR → Generator → Output Format
```

### Intermediate Representation (IR)

The IR is a standardized format that captures:
- Tables and their columns
- Data types and constraints
- Relationships and foreign keys
- Indexes and unique constraints
- Metadata and documentation

This approach ensures that conversions are:
- **Consistent**: Same logic for all format pairs
- **Extensible**: Easy to add new formats
- **Reliable**: Single source of truth for schema structure

## Best Practices

### File Organization

```
project/
├── schemas/
│   ├── erdplus/          # Original ERDPlus designs
│   ├── sql/              # Generated SQL scripts
│   ├── prisma/           # Prisma schema files
│   └── docs/             # Generated documentation
└── scripts/
    └── convert-schemas.js # Batch conversion scripts
```

### Naming Conventions

- Use descriptive filenames: `blog-schema.erdplus` instead of `schema1.erdplus`
- Include version numbers for evolving schemas: `v1.0-user-management.erdplus`
- Use consistent naming across format conversions

### Version Control

- Commit both source ERDPlus files and generated outputs
- Use `.gitignore` for temporary conversion files
- Tag releases with schema version numbers

## Common Workflows

### 1. Database-First Development

```
ERDPlus Design → SQL Generation → Database Creation → Application Development
```

### 2. Code-First Development

```
TypeORM Entities → IR → SQL Migration → Database Update
```

### 3. Documentation Generation

```
ERDPlus/SQL → IR → Mermaid/DBML → Documentation
```

### 4. Legacy Migration

```
Old ERDPlus → New ERDPlus → Modern Tools (Prisma/TypeORM)
```

## Troubleshooting

### Common Issues

**File Not Recognized**
- Ensure file has correct extension
- Validate JSON syntax for ERDPlus files
- Check file encoding (should be UTF-8)

**Conversion Errors**
- Review error messages for specific issues
- Validate source schema structure
- Check for unsupported features

**Missing Relationships**
- Verify foreign key definitions in source
- Ensure referenced tables exist
- Check column name matching

### Getting Help

1. **Check the [FAQ](faq.md)** for common questions
2. **Review [API Documentation](../API.md)** for programmatic usage
3. **Browse [Examples](../examples/)** for reference implementations
4. **Search [GitHub Issues](https://github.com/tobiager/Erdus/issues)** for known problems
5. **Create a new issue** if you can't find a solution

## Next Steps

Now that you're familiar with the basics:

1. **Explore Advanced Features**: Learn about batch conversion and CI/CD integration in [Recipes](recipes.md)
2. **Understand the Architecture**: Read about the internal workings in [Architecture](architecture.md)
3. **Contribute**: Check out the [Development Guide](../DEVELOPMENT.md) to contribute improvements
4. **Stay Updated**: Star the repository and watch for new releases

## Examples

Check out the [examples directory](../examples/) for:
- Blog system schema
- E-commerce database
- School management system
- Various conversion scenarios

Each example includes:
- Source ERDPlus files
- Generated outputs in multiple formats
- Documentation and use cases

Ready to start converting? Head to https://erdus-inky.vercel.app or install locally to begin!