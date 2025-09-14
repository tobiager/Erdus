import { z } from 'zod';

// Zod schema for IRDataType
export const IRDataTypeSchema = z.enum([
  'string', 'number', 'boolean', 'date', 'datetime', 'timestamp',
  'uuid', 'json', 'text', 'binary', 'decimal', 'integer', 'bigint'
]);

// Constraint actions
const ConstraintActionSchema = z.enum(['CASCADE', 'SET NULL', 'SET DEFAULT', 'RESTRICT', 'NO ACTION']);

// IRAttribute schema
export const IRAttributeSchema = z.object({
  name: z.string().min(1),
  type: IRDataTypeSchema,
  nullable: z.boolean().optional(),
  default: z.string().optional(),
  pk: z.boolean().optional(),
  unique: z.boolean().optional(),
  references: z.object({
    table: z.string().min(1),
    column: z.string().min(1),
    onDelete: ConstraintActionSchema.optional(),
    onUpdate: ConstraintActionSchema.optional(),
  }).optional(),
  precision: z.number().min(1).optional(),
  scale: z.number().min(0).optional(),
  length: z.number().min(1).optional(),
});

// IRIndex schema
export const IRIndexSchema = z.object({
  name: z.string().optional(),
  columns: z.array(z.string().min(1)).min(1),
  unique: z.boolean().optional(),
  type: z.enum(['btree', 'hash', 'gin', 'gist']).optional(),
});

// IRConstraint schema
export const IRConstraintSchema = z.object({
  name: z.string().optional(),
  type: z.enum(['check', 'unique', 'foreign_key', 'primary_key']),
  columns: z.array(z.string().min(1)).min(1),
  expression: z.string().optional(),
  references: z.object({
    table: z.string().min(1),
    columns: z.array(z.string().min(1)).min(1),
    onDelete: z.string().optional(),
    onUpdate: z.string().optional(),
  }).optional(),
});

// IREnum schema
export const IREnumSchema = z.object({
  name: z.string().min(1),
  values: z.array(z.string().min(1)).min(1),
});

// IREntity schema
export const IREntitySchema = z.object({
  name: z.string().min(1),
  attributes: z.array(IRAttributeSchema).min(1),
  indexes: z.array(IRIndexSchema).optional(),
  constraints: z.array(IRConstraintSchema).optional(),
  comment: z.string().optional(),
});

// IRRelation schema
export const IRRelationSchema = z.object({
  type: z.enum(['1-1', '1-N', 'N-N']),
  from: z.object({
    entity: z.string().min(1),
    attributes: z.array(z.string().min(1)).min(1),
  }),
  to: z.object({
    entity: z.string().min(1),
    attributes: z.array(z.string().min(1)).min(1),
  }),
  cardinality: z.object({
    min: z.number().min(0),
    max: z.union([z.number().min(1), z.literal('n')]),
  }).optional(),
  onDelete: z.string().optional(),
  onUpdate: z.string().optional(),
  junctionTable: z.string().optional(),
});

// IRSchema schema
export const IRSchemaSchema = z.object({
  entities: z.array(IREntitySchema).min(1),
  relations: z.array(IRRelationSchema).optional().default([]),
  enums: z.array(IREnumSchema).optional().default([]),
  comment: z.string().optional(),
});

// Legacy compatibility schemas
export const IRColumnSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  isPrimaryKey: z.boolean().optional(),
  isOptional: z.boolean().optional(),
  isUnique: z.boolean().optional(),
  default: z.string().optional(),
  references: z.object({
    table: z.string().min(1),
    column: z.string().min(1),
    onDelete: z.string().optional(),
    onUpdate: z.string().optional(),
  }).optional(),
});

export const IRTableSchema = z.object({
  name: z.string().min(1),
  columns: z.array(IRColumnSchema).min(1),
  primaryKey: z.array(z.string().min(1)).optional(),
  indexes: z.array(z.object({
    columns: z.array(z.string().min(1)).min(1),
    unique: z.boolean().optional(),
  })).optional(),
});

export const IRDiagramSchema = z.object({
  tables: z.array(IRTableSchema).min(1),
});

// Type exports
export type IRDataType = z.infer<typeof IRDataTypeSchema>;
export type IRAttribute = z.infer<typeof IRAttributeSchema>;
export type IRIndex = z.infer<typeof IRIndexSchema>;
export type IRConstraint = z.infer<typeof IRConstraintSchema>;
export type IREnum = z.infer<typeof IREnumSchema>;
export type IREntity = z.infer<typeof IREntitySchema>;
export type IRRelation = z.infer<typeof IRRelationSchema>;
export type IRSchema = z.infer<typeof IRSchemaSchema>;

// Legacy types
export type IRColumn = z.infer<typeof IRColumnSchema>;
export type IRTable = z.infer<typeof IRTableSchema>;
export type IRDiagram = z.infer<typeof IRDiagramSchema>;

// Validation functions
export function validateIRSchema(data: unknown): IRSchema {
  return IRSchemaSchema.parse(data);
}

export function validateIRDiagram(data: unknown): IRDiagram {
  return IRDiagramSchema.parse(data);
}

export function isValidIRSchema(data: unknown): data is IRSchema {
  return IRSchemaSchema.safeParse(data).success;
}

export function isValidIRDiagram(data: unknown): data is IRDiagram {
  return IRDiagramSchema.safeParse(data).success;
}