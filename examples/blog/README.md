# Blog System Examples

This directory contains comprehensive examples for a blog management system, showcasing how Erdus can convert between different formats.

## Schema Overview

The blog system includes the following entities:
- **Users**: Blog authors and readers with authentication
- **Categories**: Content organization
- **Posts**: Blog articles with metadata
- **Comments**: User feedback on posts
- **Tags**: Flexible content labeling
- **PostTags**: Many-to-many relationship between posts and tags

## Available Formats

- `blog-schema.sql` - PostgreSQL DDL
- `blog-schema.prisma` - Prisma schema
- `blog-entities.ts` - TypeORM entities
- `blog-diagram.dbml` - DBML for dbdiagram.io
- `blog-diagram.mmd` - Mermaid ER diagram
- `blog-erdplus-new.json` - ERDPlus new format
- `blog-erdplus-old.json` - ERDPlus old format

## Features Demonstrated

- Primary and foreign key relationships
- One-to-many relationships (User → Posts, Post → Comments)
- Many-to-many relationships (Posts ↔ Tags)
- Enum types for status fields
- Timestamp tracking (created_at, updated_at)
- Optional fields and constraints
- Text fields of varying lengths

## Usage

You can use any of these files as input in the Erdus converter to generate output in your preferred format. This demonstrates the complete interoperability between different schema representation formats.