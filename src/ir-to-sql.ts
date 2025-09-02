import type { IRDiagram } from './ir';

/** Convert canonical IR to PostgreSQL DDL. */
export function irToPostgres(diagram: IRDiagram): string {
  const tableStmts: string[] = [];
  const fkStmts: string[] = [];

  for (const table of diagram.tables) {
    const lines: string[] = table.columns.map(col => {
      let line = `  "${col.name}" ${col.type}`;
      if (!col.isOptional) line += ' NOT NULL';
      if (col.isUnique && !col.isPrimaryKey) line += ' UNIQUE';
      return line;
    });

    let pkCols = table.columns.filter(c => c.isPrimaryKey).map(c => `"${c.name}"`);
    const fkCols = table.columns.filter(c => c.references);

    if (!pkCols.length && fkCols.length === table.columns.length && fkCols.length === 2) {
      pkCols = fkCols.map(c => `"${c.name}"`);
    }

    if (pkCols.length) {
      lines.push(`  PRIMARY KEY (${pkCols.join(', ')})`);
    }

    tableStmts.push(`CREATE TABLE "${table.name}" (\n${lines.join(',\n')}\n);`);

    for (const col of fkCols) {
      fkStmts.push(
        'ALTER TABLE "' + table.name + '" ADD FOREIGN KEY ("' + col.name + '") REFERENCES "' +
        col.references!.table + '"("' + col.references!.column + '");'
      );
    }
  }

  return [...tableStmts, ...fkStmts].join('\n\n');
}

