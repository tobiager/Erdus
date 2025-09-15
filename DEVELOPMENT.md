# Development Guide

This guide provides comprehensive information for developers who want to contribute to Erdus or extend its functionality.

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Building & Deployment](#building--deployment)
- [Adding New Converters](#adding-new-converters)
- [Debugging](#debugging)
- [Performance Optimization](#performance-optimization)

## Getting Started

### Prerequisites

1. **Node.js 20+** (check with `node --version`)
2. **Git** for version control
3. **VS Code** (recommended IDE)

### Initial Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-username/Erdus.git
cd Erdus

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```

### Verify Setup

```bash
# Run all checks
npm run typecheck  # TypeScript compilation
npm run lint       # ESLint checks
npm test          # Test suite
npm run build     # Production build
```

## Project Structure

```
Erdus/
├── src/
│   ├── components/        # Reusable React components
│   │   ├── ui/           # Basic UI components
│   │   └── features/     # Feature-specific components
│   ├── pages/            # Application pages (React Router)
│   ├── converters/       # Core conversion logic
│   │   ├── ir-to-*.ts    # IR to format converters
│   │   ├── *-to-ir.ts    # Format to IR converters
│   │   └── utils/        # Converter utilities
│   ├── docs/             # In-app documentation content
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # General utilities
│   ├── hooks/            # React hooks
│   ├── contexts/         # React contexts
│   └── styles/           # CSS and Tailwind configs
├── public/               # Static assets
├── examples/             # Example schemas and files
├── tests/                # Test files
├── docs/                 # External documentation (Docusaurus)
└── assets/               # Images and media for README
```

### Key Files

| File | Purpose |
|------|---------|
| `src/convert.ts` | Main ERDPlus conversion logic |
| `src/types/index.ts` | Core TypeScript interfaces |
| `src/utils/format-detector.ts` | Automatic format detection |
| `vite.config.ts` | Build configuration |
| `tailwind.config.ts` | CSS framework configuration |

## Architecture Overview

### Core Concepts

1. **Intermediate Representation (IR)**: All conversions pass through a common IR format
2. **Bidirectional Conversion**: Most formats support both import and export
3. **Client-Side Processing**: All logic runs in the browser for privacy
4. **Modular Converters**: Each format has its own converter module

### Data Flow

```
Input Format → Format Detection → Parser → IR → Converter → Output Format
```

### IR Schema

The IR (Intermediate Representation) is the central data structure:

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

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feat/new-converter

# Make changes
# ... code changes ...

# Run checks
npm run lint
npm test
npm run typecheck

# Commit with conventional commits
git commit -m "feat: add SQLite converter"
```

### 2. Testing Strategy

- **Unit Tests**: Test individual functions and converters
- **Integration Tests**: Test complete conversion workflows
- **Round-trip Tests**: Verify lossless conversions

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/conversion.test.ts

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### 3. Code Quality

The project enforces quality through:

- **ESLint**: Code linting and style
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Vitest**: Testing framework

```bash
# Check and fix linting
npm run lint
npm run lint:fix

# Format code
npm run format

# Type checking
npm run typecheck
```

## Code Standards

### TypeScript Guidelines

1. **Strict Type Checking**: Use strict TypeScript configuration
2. **Interface Definitions**: Define clear interfaces for all data structures
3. **Generic Types**: Use generics for reusable functions
4. **Error Types**: Define custom error types for different scenarios

```typescript
// Good: Clear interface definition
interface ConversionOptions {
  format: OutputFormat;
  validate?: boolean;
  preserveIds?: boolean;
}

// Good: Generic function with constraints
function convertToFormat<T extends OutputFormat>(
  schema: DatabaseSchema,
  format: T
): FormatOutput<T> {
  // Implementation
}
```

### React Guidelines

1. **Functional Components**: Use function components with hooks
2. **Custom Hooks**: Extract logic into reusable hooks
3. **TypeScript Props**: Always type component props
4. **Performance**: Use React.memo and useMemo when appropriate

```typescript
// Good: Typed functional component
interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedFormats: string[];
  maxSizeBytes?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  acceptedFormats,
  maxSizeBytes = 10 * 1024 * 1024 
}) => {
  // Implementation
};
```

### File Organization

1. **Index Files**: Use index.ts for clean imports
2. **Single Responsibility**: One main concept per file
3. **Consistent Naming**: Use kebab-case for files, PascalCase for components

```typescript
// src/converters/index.ts
export { sqlToIR } from './sql-to-ir';
export { irToSQL } from './ir-to-sql';
export { prismaToIR } from './prisma-to-ir';
export { irToPrisma } from './ir-to-prisma';
```

## Testing

### Test Structure

```typescript
// tests/example.test.ts
import { describe, test, expect } from 'vitest';
import { convertFunction } from '../src/converters/example';

describe('Example Converter', () => {
  test('should convert simple table', () => {
    const input = { /* test data */ };
    const expected = { /* expected output */ };
    
    const result = convertFunction(input);
    
    expect(result).toEqual(expected);
  });
  
  test('should handle edge cases', () => {
    // Test edge cases
  });
  
  test('should throw on invalid input', () => {
    expect(() => convertFunction(null)).toThrow();
  });
});
```

### Test Data

Store test data in organized files:

```
tests/
├── fixtures/
│   ├── erdplus/
│   ├── sql/
│   └── prisma/
├── helpers/
│   └── test-utils.ts
└── *.test.ts
```

### Integration Testing

```typescript
// Test complete conversion workflow
test('complete ERDPlus to SQL conversion', () => {
  const erdplus = readFixture('erdplus/blog-schema.json');
  const expectedSQL = readFixture('sql/blog-schema.sql');
  
  const ir = erdplusToIR(erdplus);
  const sql = irToSQL(ir);
  
  expect(normalizeSQL(sql)).toBe(normalizeSQL(expectedSQL));
});
```

## Building & Deployment

### Development Build

```bash
# Start dev server with hot reload
npm run dev

# Check build without bundling
npm run typecheck
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Build with analysis
npm run build -- --analyze
```

### Deployment Targets

- **Vercel** (primary): Configured in `vercel.json`
- **Netlify**: Works with `dist/` output
- **Static Hosting**: Any static file server

## Adding New Converters

### 1. Create Converter Files

```bash
# Create converter files
touch src/converters/myformat-to-ir.ts
touch src/converters/ir-to-myformat.ts
touch tests/myformat.test.ts
```

### 2. Implement IR Conversion

```typescript
// src/converters/myformat-to-ir.ts
import { DatabaseSchema } from '../types';

export function myformatToIR(input: MyFormatSchema): DatabaseSchema {
  return {
    tables: input.entities.map(entity => ({
      id: entity.id,
      name: entity.name,
      columns: entity.fields.map(field => ({
        id: field.id,
        name: field.name,
        type: mapType(field.type),
        nullable: field.optional,
        primaryKey: field.isPrimaryKey
      }))
    })),
    relationships: extractRelationships(input)
  };
}
```

### 3. Implement Format Export

```typescript
// src/converters/ir-to-myformat.ts
export function irToMyFormat(schema: DatabaseSchema): string {
  const entities = schema.tables.map(table => ({
    name: table.name,
    fields: table.columns.map(col => ({
      name: col.name,
      type: mapToMyFormatType(col.type),
      optional: col.nullable
    }))
  }));
  
  return generateMyFormatOutput(entities);
}
```

### 4. Add Format Detection

```typescript
// src/utils/format-detector.ts
export function detectFormat(content: string): FormatType {
  // Add detection logic for your format
  if (content.includes('myformat-signature')) {
    return 'myformat';
  }
  // ... existing detection logic
}
```

### 5. Update Type Definitions

```typescript
// src/types/index.ts
export type FormatType = 
  | 'erdplus-old' 
  | 'erdplus-new' 
  | 'sql' 
  | 'prisma'
  | 'myformat'  // Add your format
  | 'unknown';
```

### 6. Add Tests

```typescript
// tests/myformat.test.ts
import { myformatToIR, irToMyFormat } from '../src/converters';

describe('MyFormat Converter', () => {
  test('should convert to IR', () => {
    // Test conversion logic
  });
  
  test('should export from IR', () => {
    // Test export logic
  });
  
  test('should round-trip correctly', () => {
    // Test bidirectional conversion
  });
});
```

### 7. Update Documentation

- Add converter to README.md
- Update API.md with new functions
- Add examples to examples/ directory

## Debugging

### VS Code Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "--no-coverage"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Dev Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vite/bin/vite.js",
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    }
  ]
}
```

### Browser Debugging

1. **React DevTools**: Install browser extension
2. **Console Logging**: Use `console.log` strategically
3. **Network Tab**: Monitor file uploads and processing
4. **Source Maps**: Debug original TypeScript in browser

### Common Issues

#### Type Errors
```bash
# Check specific file
npx tsc --noEmit src/path/to/file.ts

# Check all files
npm run typecheck
```

#### Import Errors
```bash
# Check if module exists
ls node_modules/module-name

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## Performance Optimization

### Bundle Analysis

```bash
# Analyze bundle size
npm run build -- --analyze

# Check for duplicate dependencies
npx duplicate-package-checker
```

### Code Splitting

```typescript
// Lazy load components
const Documentation = lazy(() => import('./pages/Documentation'));

// Dynamic imports for converters
const loadConverter = async (format: string) => {
  const module = await import(`./converters/${format}-converter`);
  return module.default;
};
```

### Memory Management

```typescript
// Large file processing
function processLargeFile(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = JSON.parse(e.target?.result as string);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsText(file);
  });
}
```

## Contributing Checklist

Before submitting a PR:

- [ ] Code follows project conventions
- [ ] All tests pass (`npm test`)
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] Code is linted and formatted (`npm run lint`, `npm run format`)
- [ ] New features have tests
- [ ] Documentation is updated
- [ ] Commit messages follow conventional commits
- [ ] Branch is up to date with main

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Vitest Documentation](https://vitest.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Getting Help

- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions or share ideas
- **Code Review**: Request feedback on your changes
- **Documentation**: Improve this guide if anything is unclear