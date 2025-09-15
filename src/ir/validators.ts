import { z } from 'zod';

// Zod schemas for IR validation

export const IRColumnSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  isPrimaryKey: z.boolean().optional(),
  isOptional: z.boolean().optional(),
  isUnique: z.boolean().optional(),
  default: z.string().optional(),
  references: z.object({
    table: z.string(),
    column: z.string(),
    onDelete: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION', 'SET DEFAULT']).optional(),
    onUpdate: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION', 'SET DEFAULT']).optional(),
  }).optional(),
});

export const IRAttributeSchema = IRColumnSchema; // Alias for compatibility

export const IRTableSchema = z.object({
  name: z.string().min(1),
  columns: z.array(IRColumnSchema),
  primaryKey: z.array(z.string()).optional(),
  indexes: z.array(z.object({
    columns: z.array(z.string()),
    unique: z.boolean().optional(),
  })).optional(),
});

export const IREntitySchema = IRTableSchema.extend({
  attributes: z.array(IRAttributeSchema),
  uniques: z.array(z.array(z.string())).optional(),
});

export const IRRelationSchema = z.object({
  name: z.string().optional(),
  type: z.enum(['1-1', '1-N', 'N-N']),
  sourceEntity: z.string(),
  targetEntity: z.string(),
  sourceColumns: z.array(z.string()),
  targetColumns: z.array(z.string()),
  onDelete: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION', 'SET DEFAULT']).optional(),
  onUpdate: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION', 'SET DEFAULT']).optional(),
});

export const IREnumSchema = z.object({
  name: z.string().min(1),
  values: z.array(z.string().min(1)),
});

export const IRCheckSchema = z.object({
  name: z.string().optional(),
  expression: z.string().min(1),
  table: z.string().min(1),
});

export const IRCommentSchema = z.object({
  table: z.string().optional(),
  column: z.string().optional(),
  text: z.string().min(1),
});

export const IRIndexSchema = z.object({
  name: z.string().optional(),
  table: z.string().min(1),
  columns: z.array(z.string().min(1)),
  unique: z.boolean().optional(),
  type: z.enum(['btree', 'hash', 'gin', 'gist']).optional(),
});

export const IRSchemaSchema = z.object({
  entities: z.array(IREntitySchema),
  relations: z.array(IRRelationSchema),
  enums: z.array(IREnumSchema).optional(),
  checks: z.array(IRCheckSchema).optional(),
  comments: z.array(IRCommentSchema).optional(),
  indexes: z.array(IRIndexSchema).optional(),
});

// Backward compatibility schema
export const IRDiagramSchema = z.object({
  tables: z.array(IRTableSchema),
});

// Helper function to validate IR
export function validateIRSchema(schema: unknown): z.infer<typeof IRSchemaSchema> {
  return IRSchemaSchema.parse(schema);
}

export function validateIRDiagram(diagram: unknown): z.infer<typeof IRDiagramSchema> {
  return IRDiagramSchema.parse(diagram);
}

// Convert IRDiagram to IRSchema for new API compatibility
export function diagramToSchema(diagram: z.infer<typeof IRDiagramSchema>): z.infer<typeof IRSchemaSchema> {
  return {
    entities: diagram.tables.map((table: any) => ({
      ...table,
      attributes: table.columns,
    })),
    relations: [],
  };
}

// Convert IRSchema to IRDiagram for backward compatibility  
export function schemaToDiagram(schema: z.infer<typeof IRSchemaSchema>): z.infer<typeof IRDiagramSchema> {
  return {
    tables: schema.entities.map((entity: any) => ({
      name: entity.name,
      columns: entity.attributes || entity.columns,
      primaryKey: entity.primaryKey,
      indexes: entity.indexes,
    })),
  };
}