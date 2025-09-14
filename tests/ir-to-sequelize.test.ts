import { describe, it, expect } from 'vitest';
import { irToSequelize } from '../src/ir-to-sequelize';
import type { IRDiagram } from '../src/ir';

describe('IR to Sequelize', () => {
  it('should convert basic table to Sequelize model', () => {
    const diagram: IRDiagram = {
      tables: [{
        name: 'user',
        columns: [
          { name: 'id', type: 'SERIAL', isPrimaryKey: true },
          { name: 'name', type: 'VARCHAR(255)' },
          { name: 'email', type: 'VARCHAR(255)', isUnique: true },
          { name: 'age', type: 'INTEGER', isOptional: true }
        ]
      }]
    };

    const result = irToSequelize(diagram);

    expect(result).toContain('const { DataTypes } = require(\'sequelize\');');
    expect(result).toContain('const User = sequelize.define(\'User\', {');
    expect(result).toContain('id: {\n      type: DataTypes.INTEGER,\n      allowNull: false,\n      primaryKey: true,\n      autoIncrement: true');
    expect(result).toContain('name: {\n      type: DataTypes.STRING(255),\n      allowNull: false');
    expect(result).toContain('email: {\n      type: DataTypes.STRING(255),\n      allowNull: false,\n      unique: true');
    expect(result).toContain('age: {\n      type: DataTypes.INTEGER,\n      allowNull: true');
    expect(result).toContain('tableName: \'user\'');
    expect(result).toContain('module.exports = {\n  User\n};');
  });

  it('should handle foreign key relationships', () => {
    const diagram: IRDiagram = {
      tables: [
        {
          name: 'user',
          columns: [
            { name: 'id', type: 'SERIAL', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR(255)' }
          ]
        },
        {
          name: 'post',
          columns: [
            { name: 'id', type: 'SERIAL', isPrimaryKey: true },
            { name: 'title', type: 'VARCHAR(255)' },
            { name: 'user_id', type: 'INTEGER', references: { table: 'user', column: 'id', onDelete: 'CASCADE' } }
          ]
        }
      ]
    };

    const result = irToSequelize(diagram);

    expect(result).toContain('user_id: {\n      type: DataTypes.INTEGER,\n      allowNull: false,\n      references: { model: \'user\', key: \'id\' },\n      onDelete: \'CASCADE\'');
    expect(result).toContain('Post.belongsTo(User, { foreignKey: \'user_id\', as: \'user\' });');
    expect(result).toContain('User.hasMany(Post, { foreignKey: \'user_id\', as: \'posts\' });');
  });

  it('should handle various data types', () => {
    const diagram: IRDiagram = {
      tables: [{
        name: 'test_types',
        columns: [
          { name: 'id', type: 'SERIAL', isPrimaryKey: true },
          { name: 'bigint_field', type: 'BIGINT' },
          { name: 'text_field', type: 'TEXT' },
          { name: 'bool_field', type: 'BOOLEAN' },
          { name: 'decimal_field', type: 'DECIMAL(10,2)' },
          { name: 'char_field', type: 'CHAR(5)' }
        ]
      }]
    };

    const result = irToSequelize(diagram);

    expect(result).toContain('bigint_field: {\n      type: DataTypes.BIGINT');
    expect(result).toContain('text_field: {\n      type: DataTypes.TEXT');
    expect(result).toContain('bool_field: {\n      type: DataTypes.BOOLEAN');
    expect(result).toContain('decimal_field: {\n      type: DataTypes.DECIMAL(10, 2)');
    expect(result).toContain('char_field: {\n      type: DataTypes.CHAR(5)');
  });

  it('should handle indexes', () => {
    const diagram: IRDiagram = {
      tables: [{
        name: 'user',
        columns: [
          { name: 'id', type: 'SERIAL', isPrimaryKey: true },
          { name: 'email', type: 'VARCHAR(255)' },
          { name: 'name', type: 'VARCHAR(255)' }
        ],
        indexes: [
          { columns: ['email'], unique: true },
          { columns: ['name', 'email'], unique: false }
        ]
      }]
    };

    const result = irToSequelize(diagram);

    expect(result).toContain('User.addIndex({ fields: [\'email\'], unique: true });');
    expect(result).toContain('User.addIndex({ fields: [\'name\', \'email\'] });');
  });

  it('should handle default values', () => {
    const diagram: IRDiagram = {
      tables: [{
        name: 'test_defaults',
        columns: [
          { name: 'id', type: 'SERIAL', isPrimaryKey: true },
          { name: 'status', type: 'VARCHAR(20)', default: "'active'" },
          { name: 'count', type: 'INTEGER', default: '0' }
        ]
      }]
    };

    const result = irToSequelize(diagram);

    expect(result).toContain('defaultValue: \'\'active\'\'');
    expect(result).toContain('defaultValue: \'0\'');
  });
});