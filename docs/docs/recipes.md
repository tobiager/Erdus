# Recipes & Use Cases

This document provides practical recipes and real-world use cases for Erdus.

## Batch Conversion

### Converting Multiple Files

```bash
# Using CLI (when available)
erdus batch ./input-directory --to sql --output ./output-directory

# Using Node.js script
node scripts/batch-convert.js
```

### Automated Conversion Script

```javascript
// batch-convert.js
const fs = require('fs');
const path = require('path');
const { erdplusToIR, irToSQL } = require('erdus');

async function convertDirectory(inputDir, outputDir) {
  const files = fs.readdirSync(inputDir);
  
  for (const file of files) {
    if (file.endsWith('.erdplus')) {
      try {
        const content = fs.readFileSync(path.join(inputDir, file), 'utf8');
        const erdplus = JSON.parse(content);
        const ir = erdplusToIR(erdplus);
        const sql = irToSQL(ir);
        
        const outputFile = file.replace('.erdplus', '.sql');
        fs.writeFileSync(path.join(outputDir, outputFile), sql);
        
        console.log(`✓ Converted ${file} to ${outputFile}`);
      } catch (error) {
        console.error(`✗ Failed to convert ${file}:`, error.message);
      }
    }
  }
}
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/schema-validation.yml
name: Schema Validation

on:
  push:
    paths:
      - 'schemas/**/*.erdplus'
      - 'schemas/**/*.sql'

jobs:
  validate-schemas:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install Erdus
        run: npm install -g erdus-converter
        
      - name: Validate ERDPlus files
        run: |
          for file in schemas/**/*.erdplus; do
            echo "Validating $file"
            erdus validate "$file"
          done
          
      - name: Convert to SQL for review
        run: |
          mkdir -p generated-sql
          for file in schemas/**/*.erdplus; do
            output="generated-sql/$(basename "$file" .erdplus).sql"
            erdus convert "$file" --to sql --output "$output"
          done
          
      - name: Upload SQL artifacts
        uses: actions/upload-artifact@v3
        with:
          name: generated-sql
          path: generated-sql/
```

### GitLab CI Integration

```yaml
# .gitlab-ci.yml
validate-schemas:
  stage: test
  image: node:20
  script:
    - npm install -g erdus-converter
    - find schemas -name "*.erdplus" -exec erdus validate {} \;
    - mkdir generated-sql
    - find schemas -name "*.erdplus" -exec sh -c 'erdus convert "$1" --to sql --output "generated-sql/$(basename "$1" .erdplus).sql"' _ {} \;
  artifacts:
    paths:
      - generated-sql/
    expire_in: 1 week
```

## Development Workflows

### Database Migration Workflow

```mermaid
graph LR
    A[ERDPlus Design] --> B[Convert to SQL]
    B --> C[Review SQL]
    C --> D[Apply to Dev DB]
    D --> E[Test Application]
    E --> F[Generate Migration]
    F --> G[Deploy to Production]
```

### Team Collaboration

1. **Designer** creates ERD in ERDPlus
2. **Developer** converts to Prisma schema
3. **DBA** reviews generated SQL
4. **DevOps** integrates into deployment pipeline

## Common Use Cases

### Educational Use

```typescript
// Course management system
class SchemaValidator {
  validateStudentSubmission(erdplusFile: File): ValidationResult {
    try {
      const content = JSON.parse(await erdplusFile.text());
      const ir = erdplusToIR(content);
      
      // Check for required tables
      const requiredTables = ['users', 'courses', 'enrollments'];
      const missingTables = requiredTables.filter(
        table => !ir.tables.find(t => t.name === table)
      );
      
      if (missingTables.length > 0) {
        return {
          valid: false,
          errors: [`Missing tables: ${missingTables.join(', ')}`]
        };
      }
      
      return { valid: true, errors: [] };
    } catch (error) {
      return {
        valid: false,
        errors: ['Invalid ERDPlus format']
      };
    }
  }
}
```

### API Documentation

```typescript
// Generate API documentation from schema
function generateAPISpecs(schemaFile: string) {
  const ir = erdplusToIR(JSON.parse(fs.readFileSync(schemaFile, 'utf8')));
  
  const openapi = {
    openapi: '3.0.0',
    info: { title: 'Generated API', version: '1.0.0' },
    paths: {}
  };
  
  // Generate CRUD endpoints for each table
  ir.tables.forEach(table => {
    openapi.paths[`/${table.name}`] = {
      get: {
        summary: `Get all ${table.name}`,
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: `#/components/schemas/${table.name}` }
                }
              }
            }
          }
        }
      },
      post: {
        summary: `Create ${table.name}`,
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${table.name}` }
            }
          }
        }
      }
    };
  });
  
  return openapi;
}
```

### Database Seeding

```typescript
// Generate test data based on schema
function generateTestData(schema: DatabaseSchema) {
  const testData = {};
  
  schema.tables.forEach(table => {
    testData[table.name] = Array.from({ length: 10 }, (_, i) => {
      const record = {};
      
      table.columns.forEach(column => {
        switch (column.type.toLowerCase()) {
          case 'varchar':
          case 'text':
            record[column.name] = `test_${column.name}_${i}`;
            break;
          case 'integer':
          case 'int':
            record[column.name] = i + 1;
            break;
          case 'boolean':
            record[column.name] = Math.random() > 0.5;
            break;
          case 'timestamp':
          case 'datetime':
            record[column.name] = new Date().toISOString();
            break;
          default:
            record[column.name] = `value_${i}`;
        }
      });
      
      return record;
    });
  });
  
  return testData;
}
```

## Performance Optimization

### Large File Handling

```typescript
// Stream processing for large ERDPlus files
async function processLargeFile(file: File): Promise<DatabaseSchema> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        // Process in chunks if needed
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        const ir = erdplusToIR(data);
        resolve(ir);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsText(file);
  });
}
```

### Caching Strategies

```typescript
// Cache converted schemas
class SchemaCache {
  private cache = new Map<string, { schema: DatabaseSchema, timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes
  
  get(key: string): DatabaseSchema | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.schema;
  }
  
  set(key: string, schema: DatabaseSchema): void {
    this.cache.set(key, {
      schema,
      timestamp: Date.now()
    });
  }
}
```

## Error Handling

### Validation and Recovery

```typescript
// Robust conversion with fallback
async function safeConvert(input: unknown, targetFormat: string): Promise<ConversionResult> {
  try {
    // Validate input format
    const format = detectFormat(JSON.stringify(input));
    if (format === 'unknown') {
      throw new Error('Unsupported input format');
    }
    
    // Convert to IR
    const ir = erdplusToIR(input);
    
    // Validate IR
    validateIR(ir);
    
    // Convert to target format
    let output: string;
    switch (targetFormat) {
      case 'sql':
        output = irToSQL(ir);
        break;
      case 'prisma':
        output = irToPrisma(ir);
        break;
      default:
        throw new Error(`Unsupported target format: ${targetFormat}`);
    }
    
    return {
      success: true,
      output,
      warnings: []
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      suggestions: getSuggestions(error)
    };
  }
}

function getSuggestions(error: Error): string[] {
  if (error.message.includes('Invalid JSON')) {
    return ['Check if the file is valid JSON', 'Try validating with a JSON linter'];
  }
  
  if (error.message.includes('Missing table')) {
    return ['Ensure all required tables are present', 'Check table naming conventions'];
  }
  
  return ['Check the input file format', 'Refer to the documentation'];
}
```

## Integration Examples

### Express.js API

```typescript
// Express middleware for schema conversion
import express from 'express';
import multer from 'multer';
import { erdplusToIR, irToSQL } from 'erdus';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/convert', upload.single('schema'), async (req, res) => {
  try {
    const file = req.file;
    const targetFormat = req.body.format || 'sql';
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const content = fs.readFileSync(file.path, 'utf8');
    const erdplus = JSON.parse(content);
    const ir = erdplusToIR(erdplus);
    
    let output: string;
    switch (targetFormat) {
      case 'sql':
        output = irToSQL(ir);
        break;
      case 'prisma':
        output = irToPrisma(ir);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported format' });
    }
    
    res.json({ output });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    // Clean up uploaded file
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
  }
});
```

### Next.js API Route

```typescript
// pages/api/convert.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { erdplusToIR, irToSQL } from 'erdus';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { schema, format } = req.body;
    
    const ir = erdplusToIR(schema);
    const output = irToSQL(ir);
    
    res.status(200).json({ output });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
```

This recipes document provides practical, real-world examples of how to use Erdus in various scenarios. Each recipe includes working code examples and explains the reasoning behind the approach.
