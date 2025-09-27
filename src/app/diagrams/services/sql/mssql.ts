import { IRDiagram } from '../../../../ir';
import { toSQL } from '../exporters';

/**
 * Microsoft SQL Server specific SQL generation
 */
export function generateMSSQLDDL(ir: IRDiagram, projectName?: string): string {
  return toSQL(ir, 'mssql', projectName);
}