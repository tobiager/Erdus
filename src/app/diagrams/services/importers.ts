import { IRDiagram } from '../../../ir';

export interface ImportResult {
  ir: IRDiagram;
  warnings?: string[];
}

/**
 * Import from Erdus IR JSON format
 */
export async function fromErdus(jsonString: string): Promise<ImportResult> {
  try {
    const data = JSON.parse(jsonString);
    
    // Basic validation
    if (!data.tables || !Array.isArray(data.tables)) {
      throw new Error('Invalid Erdus IR format: missing tables array');
    }

    return {
      ir: data as IRDiagram,
    };
  } catch (error) {
    throw new Error(`Failed to parse Erdus IR: ${error.message}`);
  }
}

/**
 * Import from ERDPlus JSON format  
 */
export async function fromERDPlus(jsonString: string): Promise<ImportResult> {
  try {
    const data = JSON.parse(jsonString);
    
    // Check if it's ERDPlus new format
    if (data.diagramType === 2 && data.data?.nodes) {
      return fromERDPlusNew(data);
    }
    
    // Check if it's ERDPlus old format
    if (data.shapes && data.connectors) {
      return fromERDPlusOld(data);
    }

    throw new Error('Unrecognized ERDPlus format');
  } catch (error) {
    throw new Error(`Failed to parse ERDPlus: ${error.message}`);
  }
}

function fromERDPlusNew(data: any): ImportResult {
  const tables = data.data.nodes
    .filter((node: any) => node.type === 'Table')
    .map((node: any) => ({
      name: node.data.label,
      columns: node.data.columns.map((col: any) => ({
        name: col.name,
        type: col.type,
        isPrimaryKey: col.isPrimaryKey,
        isOptional: col.isOptional,
        isUnique: col.isUnique,
      })),
    }));

  // Add foreign key references from edges
  if (data.data.edges) {
    data.data.edges.forEach((edge: any) => {
      const sourceTable = tables.find((t: any) => t.name === edge.source);
      const targetTable = tables.find((t: any) => t.name === edge.target);
      
      if (sourceTable && targetTable && edge.data?.foreignKeyProps) {
        edge.data.foreignKeyProps.columns.forEach((fkCol: any) => {
          const column = sourceTable.columns.find((c: any) => c.name === fkCol.name);
          if (column) {
            column.references = {
              table: targetTable.name,
              column: targetTable.columns.find((c: any) => c.isPrimaryKey)?.name || targetTable.columns[0]?.name,
            };
          }
        });
      }
    });
  }

  return {
    ir: { tables },
  };
}

function fromERDPlusOld(data: any): ImportResult {
  const tables = data.shapes
    .filter((shape: any) => shape.type === 'Table')
    .map((shape: any) => ({
      name: shape.details.name,
      columns: shape.details.attributes.map((attr: any) => ({
        name: attr.names[0] || `col_${attr.id}`,
        type: attr.dataType || 'VARCHAR(255)',
        isPrimaryKey: attr.pkMember,
        isOptional: attr.optional,
        isUnique: attr.soloUnique,
      })),
    }));

  // Add foreign key references from connectors
  if (data.connectors) {
    data.connectors.forEach((conn: any) => {
      const sourceTable = tables.find((t: any) => 
        data.shapes.find((s: any) => s.details.id === conn.source)?.details.name === t.name
      );
      const targetTable = tables.find((t: any) => 
        data.shapes.find((s: any) => s.details.id === conn.destination)?.details.name === t.name
      );
      
      if (sourceTable && targetTable) {
        const fkAttr = sourceTable.columns.find((c: any) => 
          data.shapes.find((s: any) => s.details.name === sourceTable.name)
            ?.details.attributes.find((a: any) => a.id === conn.details.fkAttributeId)
            ?.names[0] === c.name
        );
        
        if (fkAttr) {
          fkAttr.references = {
            table: targetTable.name,
            column: targetTable.columns.find((c: any) => c.isPrimaryKey)?.name || targetTable.columns[0]?.name,
          };
        }
      }
    });
  }

  return {
    ir: { tables },
    warnings: ['ERDPlus old format has limited feature support'],
  };
}

/**
 * Import from DBML format
 */
export async function fromDBML(dbmlString: string): Promise<ImportResult> {
  const lines = dbmlString.split('\n').map(line => line.trim()).filter(line => line);
  const tables = [];
  let currentTable = null;
  let currentTableLines = [];

  for (const line of lines) {
    if (line.startsWith('Table ') && line.includes('{')) {
      // Start of table
      const tableName = line.replace('Table ', '').replace('{', '').trim();
      currentTable = {
        name: tableName,
        columns: [],
      };
      currentTableLines = [];
    } else if (line === '}' && currentTable) {
      // End of table
      // Parse columns from currentTableLines
      for (const colLine of currentTableLines) {
        const parts = colLine.split(/\s+/);
        if (parts.length >= 2) {
          const column = {
            name: parts[0],
            type: parts[1],
            isPrimaryKey: colLine.includes('[pk]'),
            isUnique: colLine.includes('[unique]'),
            isOptional: !colLine.includes('[not null]'),
          };
          currentTable.columns.push(column);
        }
      }
      tables.push(currentTable);
      currentTable = null;
      currentTableLines = [];
    } else if (currentTable && line && !line.startsWith('Ref:')) {
      // Column line
      currentTableLines.push(line);
    } else if (line.startsWith('Ref:')) {
      // Reference line - handle foreign keys
      const refMatch = line.match(/Ref:\s*(\w+)\.(\w+)\s*>\s*(\w+)\.(\w+)/);
      if (refMatch) {
        const [, sourceTable, sourceColumn, targetTable, targetColumn] = refMatch;
        const table = tables.find(t => t.name === sourceTable);
        if (table) {
          const column = table.columns.find(c => c.name === sourceColumn);
          if (column) {
            column.references = {
              table: targetTable,
              column: targetColumn,
            };
          }
        }
      }
    }
  }

  return {
    ir: { tables },
    warnings: tables.length === 0 ? ['No tables found in DBML'] : undefined,
  };
}

/**
 * Import from SQL DDL
 */
export async function fromSQL(sqlString: string, engine: string = 'postgres'): Promise<ImportResult> {
  const statements = sqlString
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.toUpperCase().startsWith('CREATE TABLE'));

  const tables = [];

  for (const statement of statements) {
    const table = parseSQLCreateTable(statement, engine);
    if (table) {
      tables.push(table);
    }
  }

  // Parse ALTER TABLE statements for foreign keys
  const alterStatements = sqlString
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.toUpperCase().includes('ALTER TABLE') && stmt.toUpperCase().includes('ADD CONSTRAINT'));

  for (const statement of alterStatements) {
    parseSQLAlterTable(statement, tables);
  }

  return {
    ir: { tables },
    warnings: tables.length === 0 ? ['No CREATE TABLE statements found'] : undefined,
  };
}

function parseSQLCreateTable(statement: string, engine: string) {
  const tableMatch = statement.match(/CREATE TABLE\s+(?:`?(\w+)`?)/i);
  if (!tableMatch) return null;

  const tableName = tableMatch[1];
  const columnsSection = statement.match(/\((.*)\)/s);
  if (!columnsSection) return null;

  const columns = [];
  const columnLines = columnsSection[1]
    .split(',')
    .map(line => line.trim())
    .filter(line => line && !line.toUpperCase().includes('CONSTRAINT'));

  for (const columnLine of columnLines) {
    const parts = columnLine.trim().split(/\s+/);
    if (parts.length >= 2) {
      const column = {
        name: parts[0].replace(/[`"']/g, ''),
        type: parts[1],
        isPrimaryKey: columnLine.toUpperCase().includes('PRIMARY KEY'),
        isUnique: columnLine.toUpperCase().includes('UNIQUE'),
        isOptional: !columnLine.toUpperCase().includes('NOT NULL'),
      };
      
      // Extract default value
      const defaultMatch = columnLine.match(/DEFAULT\s+([^,\s]+)/i);
      if (defaultMatch) {
        column.default = defaultMatch[1];
      }
      
      columns.push(column);
    }
  }

  return {
    name: tableName,
    columns,
  };
}

function parseSQLAlterTable(statement: string, tables: any[]) {
  const fkMatch = statement.match(/ALTER TABLE\s+(\w+)\s+ADD CONSTRAINT\s+\w+\s+FOREIGN KEY\s*\(([^)]+)\)\s*REFERENCES\s+(\w+)\s*\(([^)]+)\)/i);
  if (!fkMatch) return;

  const [, tableName, sourceColumns, targetTable, targetColumns] = fkMatch;
  const table = tables.find(t => t.name === tableName);
  if (!table) return;

  const sourceCol = sourceColumns.trim().replace(/[`"']/g, '');
  const targetCol = targetColumns.trim().replace(/[`"']/g, '');
  
  const column = table.columns.find(c => c.name === sourceCol);
  if (column) {
    column.references = {
      table: targetTable,
      column: targetCol,
    };
  }
}