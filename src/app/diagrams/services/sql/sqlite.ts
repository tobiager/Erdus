import { IRDiagram } from '../../../../ir';
import { toSQL } from '../exporters';

/**
 * SQLite specific SQL generation
 */
export function generateSQLiteDDL(ir: IRDiagram, projectName?: string): string {
  return toSQL(ir, 'sqlite', projectName);
}