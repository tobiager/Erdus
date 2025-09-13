# School Management System Examples

This directory contains comprehensive examples for a school management system, demonstrating academic relationships and educational data modeling.

## Schema Overview

The school management system includes the following entities:
- **Students**: Student profiles and information
- **Teachers**: Faculty and instructor records
- **Courses**: Academic subjects and curricula
- **Classes**: Specific course instances with schedules
- **Enrollments**: Student registration in classes
- **Assignments**: Coursework and projects
- **Submissions**: Student work submissions
- **Grades**: Academic assessment records
- **Departments**: Academic departments and organization
- **Semesters**: Academic periods and terms

## Available Formats

- `school-schema.sql` - PostgreSQL DDL
- `school-schema.prisma` - Prisma schema
- `school-entities.ts` - TypeORM entities
- `school-diagram.dbml` - DBML for dbdiagram.io
- `school-diagram.mmd` - Mermaid ER diagram

## Features Demonstrated

- Complex academic relationships
- One-to-many relationships (Teacher → Classes, Class → Enrollments)
- Many-to-many relationships (Students ↔ Classes via Enrollments)
- Academic calendar integration
- Grade calculation and GPA tracking
- Assignment submission workflow
- Department hierarchy
- Semester-based organization

## Academic Logic Highlights

- Student enrollment management
- Grade tracking and transcripts
- Assignment submission and grading
- Teacher course assignments
- Academic performance analytics
- Schedule conflict prevention
- Credit hour calculations

## Usage

This example demonstrates an educational management system that handles complex academic workflows while maintaining data integrity across student records, course management, and grading systems.