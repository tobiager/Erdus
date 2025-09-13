# E-commerce System Examples

This directory contains comprehensive examples for an e-commerce platform, demonstrating complex business relationships and data modeling.

## Schema Overview

The e-commerce system includes the following entities:
- **Users**: Customer accounts and profiles
- **Categories**: Product organization hierarchy
- **Products**: Items for sale with variants
- **ProductVariants**: Different SKUs (size, color, etc.)
- **Cart**: Shopping cart management
- **CartItems**: Items in shopping carts
- **Orders**: Purchase transactions
- **OrderItems**: Individual items within orders
- **Payments**: Payment processing records
- **Addresses**: Shipping and billing addresses
- **Reviews**: Product reviews and ratings

## Available Formats

- `ecommerce-schema.sql` - PostgreSQL DDL
- `ecommerce-schema.prisma` - Prisma schema
- `ecommerce-entities.ts` - TypeORM entities
- `ecommerce-diagram.dbml` - DBML for dbdiagram.io
- `ecommerce-diagram.mmd` - Mermaid ER diagram

## Features Demonstrated

- Complex foreign key relationships
- One-to-many relationships (User → Orders, Product → Variants)
- Many-to-many relationships (Categories ↔ Products)
- Decimal precision for monetary values
- Enum types for order status, payment status
- JSON fields for flexible data (product attributes)
- Composite indexes for performance
- Soft deletes and audit trails

## Business Logic Highlights

- Product variants with independent pricing and inventory
- Shopping cart persistence across sessions
- Order workflow with status tracking
- Multiple payment methods and processing states
- Address management for shipping/billing
- Product review system with ratings

## Usage

This example demonstrates a production-ready e-commerce schema that can be converted between formats while preserving business logic and relationships.