# ER Diagram Editor

The Erdus ER Diagram Editor is a powerful, offline-first tool for creating, editing, and exporting entity-relationship diagrams. Built with React Flow, it provides a modern, intuitive interface for database design.

## Features

### Visual Editor
- **Interactive Canvas**: Drag and drop tables, zoom, pan, and organize your schema visually
- **Real-time Relationships**: Visual foreign key connections with automatic relationship detection
- **Table Nodes**: Rich table visualization with column types, constraints, and badges
- **Responsive Design**: Works on desktop and tablet devices

### Database Support
- **Multi-Dialect**: Support for PostgreSQL, MySQL/MariaDB, SQL Server, SQLite, and generic SQL
- **Type Validation**: Dialect-specific type checking with suggestions and warnings
- **Constraint Management**: Primary keys, foreign keys, unique constraints, and check constraints

### Export Formats
- **SQL DDL**: Dialect-specific DDL generation with proper dependencies
- **Prisma Schema**: Complete Prisma schema with relationships and configurations
- **TypeORM Entities**: TypeScript entities with decorators
- **DBML**: Database Markup Language for documentation
- **Mermaid ERD**: Entity-relationship diagrams for documentation
- **JSON**: Native Erdus format for project exchange

### Templates
- **Empty**: Start from scratch
- **CRUD**: Basic user-post relationship for web applications
- **Sales**: E-commerce schema with customers, orders, products

## Quick Start

1. **Create Project**: Navigate to `/diagramas` and click "Nuevo Diagrama"
2. **Choose Settings**: Select database dialect and template
3. **Add Tables**: Use the "Nueva tabla" button or press `N`
4. **Edit Properties**: Click tables/columns to edit in the properties panel
5. **Create Relationships**: Connect tables by dragging between connection points
6. **Export**: Use the export menu to generate SQL, Prisma, or other formats

## Keyboard Shortcuts

- `N` - Add new table
- `C` - Add new column (when table selected)
- `Delete` - Remove selected table
- `Ctrl/Cmd + S` - Save project
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Shift + Z` - Redo
- `Ctrl/Cmd + K` - Command palette (coming soon)

## Data Types by Dialect

### Default (Erdus)
Neutral types that work across most databases:
- Numeric: `int16`, `int32`, `int64`, `serial`, `decimal`, `float32`, `float64`
- Text: `varchar`, `text`, `char`
- Date/Time: `date`, `time`, `timestamp`, `timestamptz`
- Other: `boolean`, `uuid`, `json`, `binary`, `enum`

### PostgreSQL
Full PostgreSQL support including:
- Arrays: Any type can be an array by appending `[]`
- JSON: Both `json` and `jsonb` types
- Advanced types: `bytea`, `timestamptz`, custom enums

### MySQL/MariaDB
MySQL-specific features:
- Integer variants: `tinyint`, `mediumint` with `unsigned` support
- Text types: `mediumtext`, `longtext`
- Time: `datetime` instead of `timestamp` for most cases

### SQL Server
Microsoft SQL Server support:
- Unicode: `nvarchar`, `nchar` for international text
- Identity: `IDENTITY(1,1)` for auto-incrementing columns
- GUIDs: `uniqueidentifier` for UUIDs
- Time: `datetime2`, `datetimeoffset` for modern applications

### SQLite
SQLite's flexible type system:
- Storage classes: `integer`, `real`, `text`, `blob`, `numeric`
- Type affinity with automatic conversions
- Simplified constraints

## Export Headers

All exported files include a standardized header with:
```sql
-- ============================================================
-- Hecho por Erdus
-- Repo: https://github.com/tobiager/erdus
-- Demo: https://erdus.vercel.app
-- Proyecto: My Project Name
-- Exportado: 2025-09-24T17:26:11.292Z
-- ============================================================
```

Headers are adapted for each format:
- SQL: `-- comments`
- Prisma/TypeORM/DBML: `// comments`
- Mermaid: `%% comments`
- JSON: No header (not supported in JSON)

## Watermarks (Coming Soon)

Image exports (PNG/SVG/PDF) will include the Erdus logo watermark:
- Location: Bottom right corner with 24px margin
- Size: 12% of canvas width (max 220px)
- Opacity: 12% for subtle branding
- Asset: `Erdus/assets/icono-erdus-azul.png`

## Import Formats (Coming Soon)

Support for importing existing schemas:
- **DDL**: Parse CREATE TABLE statements
- **DBML**: Import from dbdiagram.io and other tools
- **Mermaid**: Import ERD definitions
- **ERDPlus JSON**: Migrate from ERDPlus old/new formats

## Limitations

### Current Limitations
- **Image Export**: PNG/SVG/PDF export not yet implemented
- **Import**: File import functionality not yet available
- **Command Palette**: Ctrl+K palette coming soon
- **Auto-layout**: Automatic table positioning not implemented

### Dialect-Specific Limitations
- **SQLite**: Limited constraint support, type degradation warnings
- **MySQL**: No native JSON validation (use CHECK constraints)
- **SQL Server**: Some PostgreSQL types mapped to NVARCHAR(MAX)
- **All**: Complex constraints and triggers not supported in visual editor

## Storage and Privacy

### Offline-First Architecture
- **No Server**: All processing happens in your browser
- **Local Storage**: Projects saved to IndexedDB (Dexie)
- **Auto-save**: Changes saved every 5 seconds
- **History**: Undo/redo with 50-state history

### Data Privacy
- **No Upload**: Your schemas never leave your device
- **No Analytics**: No tracking or usage analytics
- **No Account**: No registration or login required

## Technical Details

### Technology Stack
- **React**: UI framework with TypeScript
- **React Flow**: Interactive diagram canvas
- **Zustand**: State management with persistence
- **Dexie**: IndexedDB wrapper for offline storage
- **Zod**: Schema validation
- **Tailwind CSS**: Styling framework

### File Formats
Generated files follow industry standards:
- **SQL**: ANSI SQL with dialect-specific extensions
- **Prisma**: Compatible with Prisma 4.x+ schema format
- **TypeORM**: Compatible with TypeORM 0.3+ decorators
- **DBML**: Database Markup Language v2.x
- **Mermaid**: ERD syntax compatible with Mermaid.js

### Browser Compatibility
- **Chrome/Edge**: 90+ (recommended)
- **Firefox**: 88+
- **Safari**: 14+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+

## Troubleshooting

### Common Issues

**Project won't load**
- Check browser storage permissions
- Clear browser cache and reload
- Ensure JavaScript is enabled

**Export downloads empty file**
- Verify project has tables and columns
- Check browser download permissions
- Try different export format

**Performance issues**
- Large diagrams (50+ tables) may be slow
- Use browser's zoom instead of canvas zoom for better performance
- Close other browser tabs to free memory

**Type validation warnings**
- Review dialect compatibility in properties panel
- Check suggested type alternatives
- Some warnings are informational only

### Getting Help
- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: This guide covers most functionality
- **Community**: Share schemas and get help from other users

## Contributing

The ER Diagram Editor is part of the open-source Erdus project:
- **Repository**: https://github.com/tobiager/erdus
- **Issues**: Bug reports and feature requests welcome
- **Pull Requests**: Code contributions appreciated
- **Documentation**: Help improve this guide

## Roadmap

### Planned Features
- **Image Export**: PNG/SVG/PDF with watermarks
- **Schema Import**: DDL, DBML, Mermaid import support  
- **Command Palette**: Quick actions and search
- **Auto-layout**: Automatic table arrangement
- **Themes**: Light/dark mode and custom themes
- **Collaboration**: Real-time collaborative editing
- **Advanced Constraints**: Triggers, procedures, custom types