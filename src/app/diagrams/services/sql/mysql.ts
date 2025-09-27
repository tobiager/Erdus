import { IRDiagram } from '../../../../ir';
import { toSQL } from '../exporters';

/**
 * MySQL specific SQL generation
 */
export function generateMySQLDDL(ir: IRDiagram, projectName?: string): string {
  return toSQL(ir, 'mysql', projectName);
}