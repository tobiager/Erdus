import { z } from 'zod';

export type OldAttrRef = { tableId: number; attributeId: number; fkSubIndex?: number };
export type OldAttr = {
  id: number; names: string[]; order: number;
  pkMember?: boolean; optional?: boolean; soloUnique?: boolean; fk?: boolean;
  dataType?: string; dataTypeSize?: string | null;
  references?: OldAttrRef[];
};
export type OldTable = {
  type: "Table"; details: {
    id: number; name: string; x: number; y: number; sort: string;
    attributes: OldAttr[]; uniqueGroups: any[];
  };
};
export type OldConnector = { type: "TableConnector"; source: number; destination: number; details: { fkAttributeId: number; id: number } };
export type OldDoc = { version: 2; www: "erdplus.com"; shapes: OldTable[]; connectors: OldConnector[]; width: number; height: number };

export type NewCol = { id: string; name: string; type: string; position: number; isPrimaryKey?: boolean; isOptional?: boolean; isUnique?: boolean };
export type NewNode = {
  id: string; type: "Table"; position: {x:number;y:number};
  data: { label: string; isConnectable: true; columns: NewCol[]; numberOfGroups: 0; isSelected: false };
  measured: { width: number; height: number }; selected: false; dragging: false;
};
export type NewEdge = {
  id: string; type: "Relational"; source: string; target: string; targetHandle: string;
  markerStart: { type: "arrow" };
  data: { foreignKeyProps: { foreignKeyGroupId: string; sourceTableId: string; columns: { id: string; name: string; type: string }[] } };
};
export type NewDoc = {
  diagramType: 2;
  data: { nodes: NewNode[]; edges: NewEdge[]; viewport: {x:number;y:number;zoom:number} };
  name: string; folder: any; id: number; updatedAtTimestamp: number;
};

// Database Engine Types
export type DatabaseEngine = 'oracle' | 'mysql' | 'sqlserver' | 'postgresql' | 'mongodb' | 'sqlite';

// Migration-specific types
export interface MigrationOptions {
  dryRun?: boolean;
  includeComments?: boolean;
  targetEngine?: DatabaseEngine;
  includeRLS?: boolean;
}

export interface MigrationResult {
  success: boolean;
  sql?: string;
  warnings: string[];
  errors: string[];
}

// Zod schemas for validation
export const DatabaseEngineSchema = z.enum(['oracle', 'mysql', 'sqlserver', 'postgresql', 'mongodb', 'sqlite']);

export const MigrationOptionsSchema = z.object({
  dryRun: z.boolean().optional().default(false),
  includeComments: z.boolean().optional().default(true),
  targetEngine: DatabaseEngineSchema.optional().default('postgresql'),
  includeRLS: z.boolean().optional().default(false),
});

export const MigrationResultSchema = z.object({
  success: z.boolean(),
  sql: z.string().optional(),
  warnings: z.array(z.string()),
  errors: z.array(z.string()),
});

// RLS Policy types
export interface RLSPolicy {
  name: string;
  table: string;
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  role?: string;
  using?: string;
  withCheck?: string;
}

export const RLSPolicySchema = z.object({
  name: z.string(),
  table: z.string(),
  command: z.enum(['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL']),
  role: z.string().optional(),
  using: z.string().optional(),
  withCheck: z.string().optional(),
});

// Database-specific type mappings
export interface TypeMapping {
  [sourceType: string]: {
    postgresql: string;
    mysql: string;
    sqlserver: string;
    oracle: string;
    sqlite: string;
  };
}
