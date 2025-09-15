# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive project documentation
- SECURITY.md with security policy
- API documentation for developers
- Enhanced installation and development guides

## [1.0.0] - 2024-01-15

### Added
- Universal ER diagram converter with IR (Intermediate Representation)
- ERDPlus old ⇄ new format conversion with lossless round-trip
- PostgreSQL DDL support (SQL → IR → SQL)
- Prisma schema support (Prisma → IR → Prisma)
- TypeORM entity support (TypeORM → IR → TypeORM)
- DBML export for dbdiagram.io
- Mermaid ER diagram export for documentation
- Web interface with drag & drop functionality
- 100% client-side processing for privacy
- Composite foreign key support
- Deterministic ID generation
- Automatic format detection
- React-based UI with Tailwind CSS styling
- Multi-language support (English/Spanish)
- Comprehensive test suite with 48+ tests
- CI/CD integration with Vercel deployment
- Example schemas (blog, e-commerce, school)

### Technical Features
- Vite build system with TypeScript
- ESLint and Prettier configuration
- Vitest testing framework
- Framer Motion animations
- React Router navigation
- i18next internationalization
- Offline capability

### Documentation
- README with comprehensive feature overview
- Contributing guidelines in multiple languages
- Code of conduct
- Example schemas and use cases
- Project structure documentation

[Unreleased]: https://github.com/tobiager/Erdus/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/tobiager/Erdus/releases/tag/v1.0.0