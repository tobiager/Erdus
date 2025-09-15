# Frequently Asked Questions

## General Questions

### What is Erdus?

Erdus is an open-source universal ER (Entity-Relationship) diagram converter. It allows you to convert database schemas and ER diagrams between different formats like ERDPlus, SQL, Prisma, TypeORM, DBML, and Mermaid diagrams.

### Is Erdus free to use?

Yes! Erdus is completely free and open-source under the MIT license. You can use it for personal, educational, and commercial projects without any restrictions.

### Do my files get uploaded to a server?

No. Erdus processes everything locally in your browser. Your files never leave your device, ensuring complete privacy and security.

### Can I use Erdus offline?

Yes! After the initial page load, Erdus works completely offline. You can convert files without an internet connection.

## Supported Formats

### What input formats does Erdus support?

Erdus currently supports:
- ERDPlus old format (`.erdplus`)
- ERDPlus new format (`.erdplus`)
- PostgreSQL SQL DDL (`.sql`)
- Prisma schema files (`.prisma`)
- TypeORM entities (`.ts`)

### What output formats can I generate?

You can convert to:
- PostgreSQL SQL DDL
- Prisma schema
- TypeORM entities
- DBML (for dbdiagram.io)
- Mermaid ER diagrams

### Will you add support for other databases besides PostgreSQL?

Support for other databases is planned. The architecture is designed to support multiple SQL dialects. MySQL, SQLite, and SQL Server support are on the roadmap.

### Can I convert from any format to any format?

Yes! All conversions go through an Intermediate Representation (IR), so you can convert between any supported input and output format.

## Technical Questions

### How does the conversion work?

Erdus uses a three-step process:
1. **Parse** the input format into an Intermediate Representation (IR)
2. **Validate** and normalize the IR
3. **Generate** the output format from the IR

This ensures consistent and reliable conversions across all format combinations.

### Are conversions lossless?

For ERDPlus old ⇄ new conversions, yes - they are completely lossless. For other format combinations, Erdus preserves as much information as possible, though some format-specific features might not translate directly.

### How are composite foreign keys handled?

Erdus has full support for composite foreign keys. It preserves the relationship structure and column ordering across all supported formats.

### What about database constraints and indexes?

Erdus preserves:
- Primary key constraints
- Foreign key constraints
- Unique constraints
- Not-null constraints
- Default values
- Basic indexes

Advanced database features like triggers, views, and stored procedures are not currently supported.

## File and Data Questions

### What's the maximum file size I can convert?

The web interface can handle files up to 10MB. For larger files, consider using the local installation or CLI tools.

### My file isn't being recognized. What should I do?

1. Check that your file has the correct extension (`.erdplus`, `.sql`, `.prisma`, `.ts`)
2. Ensure the file content matches the expected format
3. For ERDPlus files, verify the JSON is valid
4. Try the format detection tool in the web interface

### Can I convert multiple files at once?

The web interface processes one file at a time. For batch conversion, you can:
1. Use the local installation with custom scripts
2. Use the CLI tools (when available)
3. Set up automated workflows with CI/CD

### Why is my converted SQL different from my original?

Erdus standardizes the output format, which may result in:
- Different formatting and indentation
- Reordered statements for consistency
- Standardized data type names
- Different constraint syntax

The logical structure and relationships remain identical.

## Usage Questions

### How do I convert ERDPlus old format to new format?

1. Upload your old `.erdplus` file to the web interface
2. Select "ERDPlus New" as the output format
3. Download the converted file
4. Import it into ERDPlus using "Menu → Restore → Upload"

### Can I use this for my university assignments?

Absolutely! Erdus is commonly used in database design courses. Just make sure to follow your institution's policies regarding tool usage.

### How do I integrate Erdus into my development workflow?

Common integration patterns:
- **Design Phase**: Use ERDPlus for visual design, convert to SQL for database creation
- **Development**: Convert between TypeORM/Prisma and SQL for migrations
- **Documentation**: Generate Mermaid diagrams for project documentation
- **CI/CD**: Validate schema changes and generate database scripts

### Can I customize the output format?

Currently, output formats follow standard conventions. Customization options are planned for future releases. You can modify the generated files manually or contribute custom generators to the project.

## Troubleshooting

### The conversion failed with an error. What should I do?

1. **Check the error message** - it usually indicates the specific problem
2. **Validate your input file** - ensure it's properly formatted
3. **Try a different format** - some features might not be supported in all formats
4. **Check the GitHub issues** - your problem might already be reported
5. **Create a new issue** with your file and error details

### My relationships/foreign keys are missing in the output

This usually happens when:
- The source format doesn't properly define relationships
- Column names don't match between tables
- Referenced tables are missing

Check your source schema and ensure all referenced tables and columns exist.

### The generated code doesn't compile/work

1. **Check for missing imports** - you might need to add framework-specific imports
2. **Verify data types** - some types might need manual adjustment
3. **Review naming conventions** - ensure they match your project standards
4. **Check for reserved keywords** - some names might conflict with language keywords

### Performance is slow with large files

For better performance with large schemas:
1. Use the local installation instead of the web interface
2. Consider breaking large schemas into smaller modules
3. Use a modern browser with sufficient memory

## Contribution and Development

### How can I contribute to Erdus?

1. **Report bugs** - file issues on GitHub
2. **Suggest features** - open feature requests
3. **Contribute code** - submit pull requests
4. **Improve documentation** - help make the docs better
5. **Add examples** - contribute sample schemas

### Can I add support for a new format?

Yes! The converter architecture is designed to be extensible. Check the [Development Guide](../DEVELOPMENT.md) for information on adding new converters.

### How do I set up the development environment?

1. Clone the repository
2. Run `npm install --legacy-peer-deps`
3. Start the dev server with `npm run dev`
4. See the [Development Guide](../DEVELOPMENT.md) for detailed instructions

## Business and Licensing

### Can I use Erdus in commercial projects?

Yes! The MIT license allows unrestricted commercial use.

### Can I modify and redistribute Erdus?

Yes, under the MIT license you can modify and redistribute Erdus, provided you include the original license notice.

### Is there enterprise support available?

Currently, Erdus is a community-driven project. For enterprise needs, you can:
- File issues on GitHub for bug reports
- Contribute features you need
- Consider sponsoring development

### Can I embed Erdus in my application?

Yes! You can integrate Erdus converters into your own applications. See the [API Documentation](../API.md) for programmatic usage.

## Best Practices

### What are the recommended naming conventions?

- Use descriptive table and column names
- Follow your target framework's conventions
- Avoid reserved keywords
- Use consistent naming patterns across your schema

### How should I organize my schema files?

```
project/
├── schemas/
│   ├── erdplus/     # Source ERDPlus files
│   ├── sql/         # Generated SQL scripts
│   └── docs/        # Generated documentation
├── migrations/      # Database migration files
└── models/          # Generated model files
```

### When should I use each output format?

- **SQL**: Database creation, migrations, DBA review
- **Prisma**: Modern Node.js/TypeScript projects
- **TypeORM**: Enterprise TypeScript applications
- **DBML**: Visual documentation with dbdiagram.io
- **Mermaid**: README files and project documentation

### How do I maintain schema versions?

1. Version your ERDPlus source files
2. Tag releases in version control
3. Keep generated files in sync with sources
4. Use semantic versioning for schema changes

## Getting Help

### Where can I get help?

1. **Check this FAQ** for common questions
2. **Read the documentation** - comprehensive guides available
3. **Search GitHub issues** - your question might already be answered
4. **Open a new issue** - for bugs or feature requests
5. **Join discussions** - participate in GitHub Discussions

### How do I report a bug?

When reporting bugs, please include:
- Your operating system and browser
- The input file (if possible)
- The exact error message
- Steps to reproduce the issue
- Expected vs. actual behavior

### How do I request a new feature?

1. Check if the feature is already requested
2. Open a GitHub issue with the "feature request" label
3. Describe the use case and expected behavior
4. Provide examples if relevant

### Is there a community forum or chat?

Currently, the main community interaction happens through:
- GitHub Issues for bugs and features
- GitHub Discussions for questions and ideas
- Pull Requests for code contributions

### How often is Erdus updated?

Erdus follows semantic versioning with:
- **Patch releases** for bug fixes (as needed)
- **Minor releases** for new features (monthly/quarterly)
- **Major releases** for breaking changes (annually)

---

*Don't see your question here? [Open an issue](https://github.com/tobiager/Erdus/issues/new) or [start a discussion](https://github.com/tobiager/Erdus/discussions) on GitHub!*