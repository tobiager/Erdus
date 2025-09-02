import type { IRDiagram } from './ir';

/** Convert canonical IR to PostgreSQL DDL. */
export function irToPostgres(diagram: IRDiagram): string {
  return diagram.tables
    .map(table => {
      const lines: string[] = table.columns.map(col => {
        let line = `  "${col.name}" ${col.type}`;
        if (!col.isOptional) line += ' NOT NULL';
        if (col.isUnique && !col.isPrimaryKey) line += ' UNIQUE';
        return line;
      });

      const pkCols = table.columns.filter(c => c.isPrimaryKey).map(c => `"${c.name}"`);
      if (pkCols.length) {
        lines.push(`  PRIMARY KEY (${pkCols.join(', ')})`);
      }
      for (const col of table.columns) {
        if (col.references) {
          lines.push(`  FOREIGN KEY ("${col.name}") REFERENCES "${col.references.table}"("${col.references.column}")`);
        }
      }
      return `CREATE TABLE "${table.name}" (\n${lines.join(',\n')}\n);`;
    })
    .join('\n\n');
}

