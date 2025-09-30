import { IRDiagram } from '../../../../ir';
import { toSQL } from '../exporters';

/**
 * PostgreSQL specific SQL generation
 */
export function generatePostgreSQLDDL(ir: IRDiagram, projectName?: string): string {
  return toSQL(ir, 'postgres', projectName);
}