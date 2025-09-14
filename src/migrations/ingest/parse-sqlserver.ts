import type { ParsedSchema, ParsedTable, ParsedColumn, ParsedConstraint, ParsedIndex } from '../common/normalize';
import { normalizeColumnType, normalizeConstraintAction, parseDefaultValue, cleanIdentifier } from '../common/normalize';

export function parseSQLServer(ddl: string): ParsedSchema {
  const tables: ParsedTable[] = [];
  
  // Remove comments and normalize whitespace
  const cleanDDL = ddl
    .replace(/--.*$/gm, '') // Line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Block comments
    .replace(/\s+/g, ' ')
    .trim();

  // Split into statements
  const statements = cleanDDL.split(/;\s*(?=CREATE|ALTER|DROP)/i).filter(s => s.trim());
  
  for (const statement of statements) {
    const trimmed = statement.trim();
    if (!trimmed) continue;

    try {
      if (/^CREATE\s+TABLE/i.test(trimmed)) {
        const table = parseCreateTable(trimmed);
        if (table) {
          tables.push(table);
        }
      } else if (/^ALTER\s+TABLE/i.test(trimmed)) {
        // Handle ALTER TABLE statements to add constraints
        parseAlterTable(trimmed, tables);
      }
    } catch (error) {
      console.warn(`Failed to parse statement: ${trimmed.substring(0, 100)}...`, error);
    }
  }

  return { tables };
}

function parseCreateTable(statement: string): ParsedTable | null {
  // Match CREATE TABLE pattern
  const tableMatch = statement.match(/CREATE\s+TABLE\s+(?:\[?(\w+)\]?\.)??\[?(\w+)\]?\s*\(\s*(.*)\s*\)/is);
  if (!tableMatch) return null;

  const [, schema, tableName, columnsPart] = tableMatch;
  const table: ParsedTable = {
    name: cleanIdentifier(tableName),
    columns: [],
    constraints: [],
    indexes: [],
  };

  // Parse columns and constraints
  const parts = splitTableParts(columnsPart);
  
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (/^CONSTRAINT/i.test(trimmed)) {
      const constraint = parseConstraint(trimmed, table.name);
      if (constraint) {
        table.constraints.push(constraint);
      }
    } else if (/^PRIMARY\s+KEY/i.test(trimmed)) {
      const constraint = parsePrimaryKey(trimmed, table.name);
      if (constraint) {
        table.constraints.push(constraint);
      }
    } else if (/^FOREIGN\s+KEY/i.test(trimmed)) {
      const constraint = parseForeignKey(trimmed, table.name);
      if (constraint) {
        table.constraints.push(constraint);
      }
    } else if (/^UNIQUE/i.test(trimmed)) {
      const constraint = parseUnique(trimmed, table.name);
      if (constraint) {
        table.constraints.push(constraint);
      }
    } else {
      // Column definition
      const column = parseColumn(trimmed);
      if (column) {
        table.columns.push(column);
      }
    }
  }

  return table;
}

function parseColumn(columnDef: string): ParsedColumn | null {
  // Pattern: [column_name] [data_type] [constraints...]
  const parts = columnDef.trim().split(/\s+/);
  if (parts.length < 2) return null;

  const name = cleanIdentifier(parts[0]);
  let typeIndex = 1;
  let dataType = parts[typeIndex];

  // Handle types with parentheses
  if (parts[typeIndex + 1]?.startsWith('(')) {
    dataType += ' ' + parts[typeIndex + 1];
    if (!parts[typeIndex + 1].includes(')')) {
      // Multi-part precision like DECIMAL(10, 2)
      typeIndex += 2;
      while (typeIndex < parts.length && !parts[typeIndex - 1].includes(')')) {
        dataType += ' ' + parts[typeIndex];
        typeIndex++;
      }
    } else {
      typeIndex++;
    }
  }

  const typeInfo = normalizeColumnType(dataType, 'sqlserver');
  
  let nullable = true;
  let defaultValue: string | undefined;
  let isPrimaryKey = false;
  let isUnique = false;

  // Parse constraints
  const remaining = parts.slice(typeIndex + 1).join(' ').toUpperCase();
  
  if (remaining.includes('NOT NULL')) {
    nullable = false;
  }
  
  if (remaining.includes('PRIMARY KEY')) {
    isPrimaryKey = true;
    nullable = false;
  }
  
  if (remaining.includes('UNIQUE')) {
    isUnique = true;
  }

  // Parse default value
  const defaultMatch = remaining.match(/DEFAULT\s+((?:\w+\(\)|[^,\s)]+))/i);
  if (defaultMatch) {
    defaultValue = parseDefaultValue(defaultMatch[1].trim(), 'sqlserver');
  }

  return {
    name,
    type: typeInfo.type,
    nullable,
    defaultValue,
    isPrimaryKey,
    isUnique,
    precision: typeInfo.precision,
    scale: typeInfo.scale,
    length: typeInfo.length,
  };
}

function parseConstraint(constraintDef: string, tableName: string): ParsedConstraint | null {
  const trimmed = constraintDef.trim();
  
  // CONSTRAINT name PRIMARY KEY (columns)
  const pkMatch = trimmed.match(/CONSTRAINT\s+(\w+)\s+PRIMARY\s+KEY\s*\(\s*(.+?)\s*\)/i);
  if (pkMatch) {
    const [, name, columnsList] = pkMatch;
    const columns = columnsList.split(',').map(c => cleanIdentifier(c.trim()));
    return {
      name: cleanIdentifier(name),
      type: 'primary_key',
      columns,
    };
  }

  // CONSTRAINT name FOREIGN KEY (columns) REFERENCES table(columns)
  const fkMatch = trimmed.match(/CONSTRAINT\s+(\w+)\s+FOREIGN\s+KEY\s*\(\s*(.+?)\s*\)\s+REFERENCES\s+(\w+)\s*\(\s*(.+?)\s*\)(?:\s+ON\s+DELETE\s+(\w+(?:\s+\w+)?))?\s*(?:\s+ON\s+UPDATE\s+(\w+(?:\s+\w+)?))?/i);
  if (fkMatch) {
    const [, name, columnsList, refTable, refColumnsList, onDelete, onUpdate] = fkMatch;
    const columns = columnsList.split(',').map(c => cleanIdentifier(c.trim()));
    const referencedColumns = refColumnsList.split(',').map(c => cleanIdentifier(c.trim()));
    
    return {
      name: cleanIdentifier(name),
      type: 'foreign_key',
      columns,
      referencedTable: cleanIdentifier(refTable),
      referencedColumns,
      onDelete: onDelete ? normalizeConstraintAction(onDelete) : undefined,
      onUpdate: onUpdate ? normalizeConstraintAction(onUpdate) : undefined,
    };
  }

  // CONSTRAINT name UNIQUE (columns)
  const uniqueMatch = trimmed.match(/CONSTRAINT\s+(\w+)\s+UNIQUE\s*\(\s*(.+?)\s*\)/i);
  if (uniqueMatch) {
    const [, name, columnsList] = uniqueMatch;
    const columns = columnsList.split(',').map(c => cleanIdentifier(c.trim()));
    return {
      name: cleanIdentifier(name),
      type: 'unique',
      columns,
    };
  }

  // CONSTRAINT name CHECK (expression)
  const checkMatch = trimmed.match(/CONSTRAINT\s+(\w+)\s+CHECK\s*\(\s*(.+?)\s*\)/i);
  if (checkMatch) {
    const [, name, expression] = checkMatch;
    return {
      name: cleanIdentifier(name),
      type: 'check',
      columns: [], // CHECK constraints don't have specific columns
      expression: expression.trim(),
    };
  }

  return null;
}

function parsePrimaryKey(keyDef: string, tableName: string): ParsedConstraint | null {
  const match = keyDef.match(/PRIMARY\s+KEY\s*\(\s*(.+?)\s*\)/i);
  if (!match) return null;

  const columns = match[1].split(',').map(c => cleanIdentifier(c.trim()));
  return {
    type: 'primary_key',
    columns,
  };
}

function parseForeignKey(keyDef: string, tableName: string): ParsedConstraint | null {
  const match = keyDef.match(/FOREIGN\s+KEY\s*\(\s*(.+?)\s*\)\s+REFERENCES\s+(\w+)\s*\(\s*(.+?)\s*\)(?:\s+ON\s+DELETE\s+(\w+(?:\s+\w+)?))?\s*(?:\s+ON\s+UPDATE\s+(\w+(?:\s+\w+)?))?/i);
  if (!match) return null;

  const [, columnsList, refTable, refColumnsList, onDelete, onUpdate] = match;
  const columns = columnsList.split(',').map(c => cleanIdentifier(c.trim()));
  const referencedColumns = refColumnsList.split(',').map(c => cleanIdentifier(c.trim()));

  return {
    type: 'foreign_key',
    columns,
    referencedTable: cleanIdentifier(refTable),
    referencedColumns,
    onDelete: onDelete ? normalizeConstraintAction(onDelete) : undefined,
    onUpdate: onUpdate ? normalizeConstraintAction(onUpdate) : undefined,
  };
}

function parseUnique(uniqueDef: string, tableName: string): ParsedConstraint | null {
  const match = uniqueDef.match(/UNIQUE\s*\(\s*(.+?)\s*\)/i);
  if (!match) return null;

  const columns = match[1].split(',').map(c => cleanIdentifier(c.trim()));
  return {
    type: 'unique',
    columns,
  };
}

function parseAlterTable(statement: string, tables: ParsedTable[]): void {
  // Handle ALTER TABLE ADD CONSTRAINT
  const alterMatch = statement.match(/ALTER\s+TABLE\s+(\w+)\s+ADD\s+(.+)/i);
  if (!alterMatch) return;

  const [, tableName, addPart] = alterMatch;
  const table = tables.find(t => t.name === cleanIdentifier(tableName));
  if (!table) return;

  const constraint = parseConstraint(addPart, table.name);
  if (constraint) {
    table.constraints.push(constraint);
  }
}

function splitTableParts(columnsPart: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < columnsPart.length; i++) {
    const char = columnsPart[i];
    const prevChar = i > 0 ? columnsPart[i - 1] : '';

    if ((char === '"' || char === "'") && prevChar !== '\\') {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuotes = false;
        quoteChar = '';
      }
    }

    if (!inQuotes) {
      if (char === '(') depth++;
      else if (char === ')') depth--;
      else if (char === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
        continue;
      }
    }

    current += char;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}