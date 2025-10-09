/**
 * Extended types for complete ER diagram representation
 * Part of Erdus - Universal ER Diagram Converter
 * @author tobiager
 */

export type DatabaseLanguage = 
  | 'default' 
  | 'mysql' 
  | 'postgresql' 
  | 'typeorm' 
  | 'prisma' 
  | 'sequelize' 
  | 'mongodb' 
  | 'sqlite' 
  | 'oracle' 
  | 'sqlserver';

export interface ERDiagram {
  id: string;
  name: string;
  description?: string;
  language: DatabaseLanguage;
  entities: Entity[];
  relationships: Relationship[];
  viewport: { x: number; y: number; zoom: number };
  settings: DiagramSettings;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: string;
    author: string;
    importedFrom?: string;
  };
}

export interface DiagramSettings {
  showDataTypes: boolean;
  showConstraints: boolean;
  showIndexes: boolean;
  showComments: boolean;
  entityNameCase: 'camelCase' | 'snake_case' | 'PascalCase' | 'UPPER_CASE';
  theme: 'light' | 'dark' | 'auto';
}

export interface Entity {
  id: string;
  name: string;
  displayName?: string;
  tableName?: string;
  attributes: Attribute[];
  position: { x: number; y: number };
  size: { width: number; height: number };
  color?: string;
  primaryKey: string[];
  indexes: Index[];
  constraints: TableConstraint[];
  comment?: string;
  isView?: boolean;
  viewDefinition?: string;
}

export interface Attribute {
  id: string;
  name: string;
  displayName?: string;
  type: string;
  length?: number;
  precision?: number;
  scale?: number;
  isPrimaryKey: boolean;
  isRequired: boolean;
  isUnique: boolean;
  isForeignKey: boolean;
  isAutoIncrement: boolean;
  defaultValue?: string;
  comment?: string;
  checkConstraint?: string;
  enumValues?: string[];
  collation?: string;
  charset?: string;
  onUpdateAction?: 'CURRENT_TIMESTAMP' | 'CASCADE' | 'SET NULL' | 'RESTRICT';
}

export interface Index {
  id: string;
  name: string;
  type: 'INDEX' | 'UNIQUE' | 'FULLTEXT' | 'SPATIAL' | 'PRIMARY' | 'FOREIGN';
  columns: IndexColumn[];
  isClusteredIndex?: boolean;
  comment?: string;
}

export interface IndexColumn {
  columnName: string;
  order: 'ASC' | 'DESC';
  length?: number;
}

export interface TableConstraint {
  id: string;
  name: string;
  type: 'CHECK' | 'UNIQUE' | 'FOREIGN_KEY' | 'PRIMARY_KEY';
  columns: string[];
  checkExpression?: string;
  referencedTable?: string;
  referencedColumns?: string[];
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION' | 'SET DEFAULT';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION' | 'SET DEFAULT';
}

export interface Relationship {
  id: string;
  name?: string;
  fromEntity: string;
  toEntity: string;
  fromColumns: string[];
  toColumns: string[];
  fromCardinality: '1' | 'N' | '0..1' | '1..N' | '0..N';
  toCardinality: '1' | 'N' | '0..1' | '1..N' | '0..N';
  type: 'identifying' | 'non-identifying' | 'many-to-many';
  onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION' | 'SET DEFAULT';
  onUpdate: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION' | 'SET DEFAULT';
  isDeferrable?: boolean;
  isInitiallyDeferred?: boolean;
  comment?: string;
}
