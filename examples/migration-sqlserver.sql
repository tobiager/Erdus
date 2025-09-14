ALTER TABLE [Posts] DROP CONSTRAINT FK_Posts_UserId;

ALTER TABLE [Posts] DROP CONSTRAINT FK_Posts_CategoryId;

ALTER TABLE [Users] DROP COLUMN [PasswordHash];

ALTER TABLE [Users] DROP COLUMN [CreatedAt];

ALTER TABLE [Users] DROP COLUMN [IsActive];

ALTER TABLE [Users] DROP COLUMN [UserGuid];

ALTER TABLE [Posts] DROP COLUMN [UserId];

ALTER TABLE [Posts] DROP COLUMN [CategoryId];

ALTER TABLE [Posts] DROP COLUMN [PublishedAt];

ALTER TABLE [Posts] DROP COLUMN [ViewCount];

CREATE TABLE [tags] (
  [id] INT NOT NULL,
  [name] NVARCHAR(50) NOT NULL UNIQUE,
  PRIMARY KEY ([id])
);

CREATE TABLE [post_tags] (
  [post_id] INT NOT NULL,
  [tag_id] INT NOT NULL,
  PRIMARY KEY ([post_id], [tag_id]),
  FOREIGN KEY ([post_id]) REFERENCES [posts]([id]) ON DELETE CASCADE,
  FOREIGN KEY ([tag_id]) REFERENCES [tags]([id]) ON DELETE CASCADE
);

ALTER TABLE [users] ADD COLUMN [password_hash] NVARCHAR(255) NOT NULL;

ALTER TABLE [users] ADD COLUMN [full_name] NVARCHAR(100);

ALTER TABLE [users] ADD COLUMN [created_at] DATETIME2 NOT NULL DEFAULT GETDATE();

ALTER TABLE [users] ADD COLUMN [updated_at] DATETIME2;

ALTER TABLE [users] ADD COLUMN [is_active] BIT NOT NULL DEFAULT true;

ALTER TABLE [users] ADD COLUMN [user_uuid] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID();

ALTER TABLE [categories] ADD COLUMN [slug] NVARCHAR(100) NOT NULL UNIQUE;

ALTER TABLE [posts] ADD COLUMN [author_id] INT NOT NULL;

ALTER TABLE [posts] ADD COLUMN [category_id] INT;

ALTER TABLE [posts] ADD COLUMN [published_at] DATETIME2;

ALTER TABLE [posts] ADD COLUMN [view_count] INT NOT NULL DEFAULT 0;

ALTER TABLE [posts] ADD COLUMN [is_featured] BIT NOT NULL DEFAULT false;

ALTER TABLE [users] ALTER COLUMN [id] INT NOT NULL;

ALTER TABLE [users] ALTER COLUMN [username] NVARCHAR(50) NOT NULL;

ALTER TABLE [users] ALTER COLUMN [email] NVARCHAR(100) NOT NULL;

ALTER TABLE [categories] ALTER COLUMN [id] INT NOT NULL;

ALTER TABLE [categories] ALTER COLUMN [name] NVARCHAR(100) NOT NULL;

ALTER TABLE [categories] ALTER COLUMN [description] NVARCHAR(MAX);

ALTER TABLE [posts] ALTER COLUMN [id] INT NOT NULL;

ALTER TABLE [posts] ALTER COLUMN [title] NVARCHAR(300) NOT NULL;

EXEC sp_rename 'users.Id', 'id', 'COLUMN';

EXEC sp_rename 'users.Username', 'username', 'COLUMN';

EXEC sp_rename 'users.Email', 'email', 'COLUMN';

EXEC sp_rename 'categories.Id', 'id', 'COLUMN';

EXEC sp_rename 'categories.Name', 'name', 'COLUMN';

EXEC sp_rename 'categories.Description', 'description', 'COLUMN';

EXEC sp_rename 'posts.Id', 'id', 'COLUMN';

EXEC sp_rename 'posts.Title', 'title', 'COLUMN';

EXEC sp_rename 'posts.Content', 'content', 'COLUMN';

ALTER TABLE [Users] RENAME TO [users];

ALTER TABLE [Categories] RENAME TO [categories];

ALTER TABLE [Posts] RENAME TO [posts];

ALTER TABLE [posts] ADD CONSTRAINT FK_posts_author_id FOREIGN KEY ([author_id]) REFERENCES [users]([id]) ON DELETE CASCADE;

ALTER TABLE [posts] ADD CONSTRAINT FK_posts_category_id FOREIGN KEY ([category_id]) REFERENCES [categories]([id]) ON DELETE SET NULL;