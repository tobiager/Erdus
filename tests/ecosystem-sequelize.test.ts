import { describe, it, expect } from 'vitest';
import { irToSequelize } from '../src/ecosystem/sequelize';
import type { IRDiagram } from '../src/ir';

const testDiagram: IRDiagram = {
  tables: [
    {
      name: 'User',
      columns: [
        { name: 'id', type: 'SERIAL', isPrimaryKey: true },
        { name: 'name', type: 'VARCHAR(100)' },
        { name: 'email', type: 'VARCHAR(255)', isUnique: true },
        { name: 'age', type: 'INTEGER', isOptional: true },
        { name: 'is_active', type: 'BOOLEAN', default: 'true' },
        { name: 'created_at', type: 'TIMESTAMPTZ', default: 'now()' },
      ],
    },
    {
      name: 'Post',
      columns: [
        { name: 'id', type: 'UUID', isPrimaryKey: true },
        { name: 'title', type: 'VARCHAR(200)' },
        { name: 'content', type: 'TEXT', isOptional: true },
        { name: 'user_id', type: 'INTEGER', references: { table: 'User', column: 'id' } },
        { name: 'price', type: 'DECIMAL(10,2)', default: '0.00' },
      ],
    },
    {
      name: 'UserRole',
      columns: [
        { name: 'user_id', type: 'INTEGER', isPrimaryKey: true, references: { table: 'User', column: 'id' } },
        { name: 'role_id', type: 'INTEGER', isPrimaryKey: true, references: { table: 'Role', column: 'id' } },
      ],
    },
    {
      name: 'Role',
      columns: [
        { name: 'id', type: 'SERIAL', isPrimaryKey: true },
        { name: 'name', type: 'VARCHAR(50)', isUnique: true },
      ],
    },
  ],
};

describe('Sequelize Generator', () => {
  describe('irToSequelize', () => {
    it('generates TypeScript models by default', () => {
      const result = irToSequelize(testDiagram);
      
      expect(result).toContain('import { DataTypes, Model, Sequelize } from \'sequelize\';');
      expect(result).toContain('export interface UserAttributes');
      expect(result).toContain('export class User extends Model<UserAttributes>');
      expect(result).toContain('public static initialize(sequelize: Sequelize)');
    });

    it('maps SQL types to correct Sequelize DataTypes', () => {
      const result = irToSequelize(testDiagram);
      
      expect(result).toContain('DataTypes.INTEGER'); // SERIAL -> INTEGER
      expect(result).toContain('DataTypes.STRING(100)'); // VARCHAR(100)
      expect(result).toContain('DataTypes.STRING(255)'); // VARCHAR(255)
      expect(result).toContain('DataTypes.BOOLEAN'); // BOOLEAN
      expect(result).toContain('DataTypes.DATE'); // TIMESTAMPTZ
      expect(result).toContain('DataTypes.UUID'); // UUID
      expect(result).toContain('DataTypes.TEXT'); // TEXT
      expect(result).toContain('DataTypes.DECIMAL(10, 2)'); // DECIMAL(10,2)
    });

    it('handles primary keys correctly', () => {
      const result = irToSequelize(testDiagram);
      
      expect(result).toContain('primaryKey: true');
      expect(result).toContain('autoIncrement: true'); // for SERIAL
    });

    it('handles nullable fields correctly', () => {
      const result = irToSequelize(testDiagram);
      
      expect(result).toContain('allowNull: true'); // for optional fields
      expect(result).toContain('allowNull: false'); // for required fields
    });

    it('handles unique constraints', () => {
      const result = irToSequelize(testDiagram);
      
      expect(result).toContain('unique: true'); // for unique fields
    });

    it('handles default values', () => {
      const result = irToSequelize(testDiagram);
      
      expect(result).toContain('defaultValue: true'); // boolean default
      expect(result).toContain('defaultValue: DataTypes.NOW'); // timestamp default
      expect(result).toContain('defaultValue: \'0.00\''); // decimal default
    });

    it('handles foreign key references', () => {
      const result = irToSequelize(testDiagram);
      
      expect(result).toContain('references: { model: \'User\', key: \'id\' }');
    });

    it('generates TypeScript type interfaces', () => {
      const result = irToSequelize(testDiagram);
      
      expect(result).toContain('export interface UserAttributes {');
      expect(result).toContain('id: number;');
      expect(result).toContain('name: string;');
      expect(result).toContain('email: string;');
      expect(result).toContain('age?: number;'); // optional field
      expect(result).toContain('is_active: boolean;');
      expect(result).toContain('created_at: Date;');
    });

    it('generates model associations when enabled', () => {
      const result = irToSequelize(testDiagram, { includeAssociations: true });
      
      expect(result).toContain('public static associate(models: any): void {');
      expect(result).toContain('User.hasMany(models.Post');
      expect(result).toContain('Post.belongsTo(models.User');
    });

    it('excludes associations when disabled', () => {
      const result = irToSequelize(testDiagram, { includeAssociations: false });
      
      expect(result).not.toContain('public static associate');
    });

    it('generates initialization code', () => {
      const result = irToSequelize(testDiagram, { includeInit: true });
      
      expect(result).toContain('export function initializeModels(sequelize: Sequelize): void {');
      expect(result).toContain('User.initialize(sequelize);');
      expect(result).toContain('Post.initialize(sequelize);');
      expect(result).toContain('User.associate(models);');
    });

    it('handles composite primary keys', () => {
      const result = irToSequelize(testDiagram);
      
      // UserRole has composite primary key
      expect(result).toContain('user_id: { type: DataTypes.INTEGER, primaryKey: true');
      expect(result).toContain('role_id: { type: DataTypes.INTEGER, primaryKey: true');
    });

    it('configures timestamps correctly', () => {
      const withTimestamps = irToSequelize(testDiagram, { timestamps: true });
      const withoutTimestamps = irToSequelize(testDiagram, { timestamps: false });
      
      expect(withTimestamps).toContain('timestamps: true');
      expect(withoutTimestamps).toContain('timestamps: false');
    });

    it('handles underscored option', () => {
      const result = irToSequelize(testDiagram, { underscored: true });
      
      expect(result).toContain('underscored: true');
    });
  });

  describe('edge cases', () => {
    it('handles empty diagram', () => {
      const emptyDiagram: IRDiagram = { tables: [] };
      const result = irToSequelize(emptyDiagram);
      
      expect(result).toContain('export function initializeModels');
      expect(result).toContain('const models = {');
      expect(result).toContain('};'); // empty models object
    });

    it('handles table with no columns', () => {
      const diagram: IRDiagram = {
        tables: [{ name: 'Empty', columns: [] }],
      };
      const result = irToSequelize(diagram);
      
      expect(result).toContain('export interface EmptyAttributes {');
      expect(result).toContain('export class Empty extends Model');
    });

    it('handles unknown column types', () => {
      const diagram: IRDiagram = {
        tables: [{
          name: 'Test',
          columns: [{ name: 'weird_field', type: 'UNKNOWN_TYPE' }],
        }],
      };
      const result = irToSequelize(diagram);
      
      expect(result).toContain('DataTypes.STRING'); // fallback type
    });
  });

  describe('snapshot tests', () => {
    it('matches expected Sequelize output for User model', () => {
      const result = irToSequelize({
        tables: [testDiagram.tables[0]] // Just User table
      }, {
        includeAssociations: false,
        includeInit: false,
      });

      expect(result).toMatchInlineSnapshot(`
        "// User.ts
        import { DataTypes, Model, Sequelize } from 'sequelize';

        export interface UserAttributes {
          id: number;
          name: string;
          email: string;
          age?: number;
          is_active: boolean;
          created_at: Date;
        }

        export class User extends Model<UserAttributes> implements UserAttributes {
          public id!: number;
          public name!: string;
          public email!: string;
          public age?: number;
          public is_active!: boolean;
          public created_at!: Date;

          public static initialize(sequelize: Sequelize): typeof User {
            return User.init(
              {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
                name: { type: DataTypes.STRING(100), allowNull: false },
                email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
                age: { type: DataTypes.INTEGER, allowNull: true },
                is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
                created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
              },
              {
                sequelize,
                tableName: 'User',
                timestamps: true,
              }
            );
          }
        }
        "
      `);
    });

    it('matches expected output with associations and initialization', () => {
      const result = irToSequelize({
        tables: [testDiagram.tables[0], testDiagram.tables[1]] // User and Post
      }, {
        includeAssociations: true,
        includeInit: true,
        timestamps: false,
      });

      // Test key parts of the output
      expect(result).toContain('User.hasMany(models.Post');
      expect(result).toContain('Post.belongsTo(models.User');
      expect(result).toContain('export function initializeModels');
      expect(result).toContain('timestamps: false');
    });
  });
});