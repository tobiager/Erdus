import { describe, it, expect } from 'vitest';
import { toSequelize } from '../src/generators/sequelize';
import type { IRSchema } from '../src/ir';

describe('Sequelize Generator', () => {
  it('should generate Sequelize models for simple entity', () => {
    const ir: IRSchema = {
      entities: [
        {
          name: 'User',
          attributes: [
            { name: 'id', type: 'uuid', pk: true, nullable: false },
            { name: 'email', type: 'string', unique: true, nullable: false, length: 255 },
            { name: 'name', type: 'string', nullable: true },
            { name: 'created_at', type: 'timestamp', default: 'now()', nullable: false },
          ],
        },
      ],
      relations: [],
    };

    const files = toSequelize(ir);
    
    expect(files).toHaveLength(2); // User.ts + index.ts
    
    const userFile = files.find(f => f.path.includes('User.ts'));
    expect(userFile).toBeDefined();
    expect(userFile!.contents).toContain('@Table');
    expect(userFile!.contents).toContain('class User extends Model');
    expect(userFile!.contents).toContain('@PrimaryKey');
    expect(userFile!.contents).toContain('@Unique');
    expect(userFile!.contents).toContain('DataType.UUID');
    expect(userFile!.contents).toContain('DataType.STRING(255)');
    
    const indexFile = files.find(f => f.path.includes('index.ts'));
    expect(indexFile).toBeDefined();
    expect(indexFile!.contents).toContain('export {\n  User\n};');
  });

  it('should handle foreign key relationships', () => {
    const ir: IRSchema = {
      entities: [
        {
          name: 'User',
          attributes: [
            { name: 'id', type: 'uuid', pk: true, nullable: false },
            { name: 'email', type: 'string', nullable: false },
          ],
        },
        {
          name: 'Post',
          attributes: [
            { name: 'id', type: 'uuid', pk: true, nullable: false },
            { name: 'title', type: 'string', nullable: false },
            { 
              name: 'user_id', 
              type: 'uuid', 
              nullable: false,
              references: { table: 'User', column: 'id' }
            },
          ],
        },
      ],
      relations: [
        {
          type: '1-N',
          from: { entity: 'User', attributes: ['id'] },
          to: { entity: 'Post', attributes: ['user_id'] },
        },
      ],
    };

    const files = toSequelize(ir);
    
    const postFile = files.find(f => f.path.includes('Post.ts'));
    expect(postFile!.contents).toContain('@ForeignKey(() => User)');
    expect(postFile!.contents).toContain('@BelongsTo(() => User)');
    
    const userFile = files.find(f => f.path.includes('User.ts'));
    expect(userFile!.contents).toContain('@HasMany(() => Post)');
  });
});