# Type Mapping Reference

This document provides comprehensive type mapping tables for converting between different database engines and the Erdus IR (Intermediate Representation).

## IR Core Types

Erdus uses a normalized set of core data types in its IR:

| IR Type | Description | Metadata |
|---------|-------------|----------|
| `string` | Variable-length text | `length` |
| `text` | Large text/CLOB | |
| `integer` | 32-bit signed integer | |
| `bigint` | 64-bit signed integer | |
| `decimal` | Fixed-point number | `precision`, `scale` |
| `number` | Floating-point number | |
| `boolean` | True/false value | |
| `date` | Date only (no time) | |
| `datetime` | Date and time (local) | |
| `timestamp` | Date and time (timezone-aware) | |
| `uuid` | Universally unique identifier | |
| `json` | JSON document | |
| `binary` | Binary data/BLOB | `length` |

## Database Engine Mappings

### SQL Server → IR → PostgreSQL

| SQL Server | IR Type | PostgreSQL | Notes |
|------------|---------|------------|-------|
| `INT` | `integer` | `integer` | |
| `BIGINT` | `bigint` | `bigint` | |
| `SMALLINT` | `integer` | `smallint` | Downcasted |
| `TINYINT` | `integer` | `smallint` | No TINYINT in PostgreSQL |
| `BIT` | `boolean` | `boolean` | |
| `DECIMAL(p,s)` | `decimal` | `numeric(p,s)` | Precision preserved |
| `NUMERIC(p,s)` | `decimal` | `numeric(p,s)` | Precision preserved |
| `MONEY` | `decimal` | `money` | Special type |
| `SMALLMONEY` | `decimal` | `money` | Special type |
| `FLOAT` | `number` | `double precision` | |
| `REAL` | `number` | `real` | |
| `VARCHAR(n)` | `string` | `varchar(n)` | Length preserved |
| `NVARCHAR(n)` | `string` | `varchar(n)` | Unicode handled |
| `CHAR(n)` | `string` | `char(n)` | Fixed length |
| `NCHAR(n)` | `string` | `char(n)` | Fixed length |
| `TEXT` | `text` | `text` | |
| `NTEXT` | `text` | `text` | |
| `DATETIME` | `timestamp` | `timestamp with time zone` | |
| `DATETIME2` | `timestamp` | `timestamp with time zone` | |
| `SMALLDATETIME` | `datetime` | `timestamp` | |
| `DATE` | `date` | `date` | |
| `TIME` | `timestamp` | `time` | |
| `TIMESTAMP` | `binary` | `bytea` | SQL Server timestamp is binary |
| `UNIQUEIDENTIFIER` | `uuid` | `uuid` | |
| `XML` | `text` | `xml` | |
| `VARBINARY(n)` | `binary` | `bytea` | |
| `IMAGE` | `binary` | `bytea` | |
| `BINARY(n)` | `binary` | `bytea` | |

### MySQL → IR → PostgreSQL

| MySQL | IR Type | PostgreSQL | Notes |
|-------|---------|------------|-------|
| `INT` / `INTEGER` | `integer` | `integer` | |
| `BIGINT` | `bigint` | `bigint` | |
| `SMALLINT` | `integer` | `smallint` | |
| `MEDIUMINT` | `integer` | `integer` | No MEDIUMINT equivalent |
| `TINYINT(1)` | `boolean` | `boolean` | When used as boolean |
| `TINYINT` | `integer` | `smallint` | |
| `DECIMAL(p,s)` | `decimal` | `numeric(p,s)` | |
| `NUMERIC(p,s)` | `decimal` | `numeric(p,s)` | |
| `FLOAT` | `number` | `real` | |
| `DOUBLE` | `number` | `double precision` | |
| `BOOLEAN` / `BOOL` | `boolean` | `boolean` | |
| `VARCHAR(n)` | `string` | `varchar(n)` | |
| `CHAR(n)` | `string` | `char(n)` | |
| `TEXT` | `text` | `text` | |
| `MEDIUMTEXT` | `text` | `text` | |
| `LONGTEXT` | `text` | `text` | |
| `TINYTEXT` | `string` | `varchar(255)` | |
| `DATETIME` | `datetime` | `timestamp` | |
| `TIMESTAMP` | `timestamp` | `timestamp with time zone` | |
| `DATE` | `date` | `date` | |
| `TIME` | `timestamp` | `time` | |
| `YEAR` | `integer` | `smallint` | |
| `JSON` | `json` | `jsonb` | |
| `BLOB` | `binary` | `bytea` | |
| `MEDIUMBLOB` | `binary` | `bytea` | |
| `LONGBLOB` | `binary` | `bytea` | |
| `TINYBLOB` | `binary` | `bytea` | |
| `BINARY(n)` | `binary` | `bytea` | |
| `VARBINARY(n)` | `binary` | `bytea` | |
| `ENUM('a','b')` | `string` | `varchar(255)` | Consider using PostgreSQL enums |
| `SET('a','b')` | `string` | `text[]` | Array type |

### Oracle → IR → PostgreSQL

| Oracle | IR Type | PostgreSQL | Notes |
|--------|---------|------------|-------|
| `NUMBER` | `decimal` | `numeric` | |
| `NUMBER(p)` | `integer` | `numeric(p)` | When scale = 0 |
| `NUMBER(p,s)` | `decimal` | `numeric(p,s)` | |
| `INTEGER` / `INT` | `integer` | `integer` | |
| `SMALLINT` | `integer` | `smallint` | |
| `FLOAT` | `number` | `double precision` | |
| `BINARY_FLOAT` | `number` | `real` | |
| `BINARY_DOUBLE` | `number` | `double precision` | |
| `VARCHAR2(n)` | `string` | `varchar(n)` | |
| `NVARCHAR2(n)` | `string` | `varchar(n)` | |
| `CHAR(n)` | `string` | `char(n)` | |
| `NCHAR(n)` | `string` | `char(n)` | |
| `CLOB` | `text` | `text` | |
| `NCLOB` | `text` | `text` | |
| `BLOB` | `binary` | `bytea` | |
| `RAW(n)` | `binary` | `bytea` | |
| `LONG RAW` | `binary` | `bytea` | |
| `DATE` | `timestamp` | `timestamp` | Oracle DATE includes time |
| `TIMESTAMP` | `timestamp` | `timestamp` | |
| `TIMESTAMP WITH TIME ZONE` | `timestamp` | `timestamp with time zone` | |
| `TIMESTAMP WITH LOCAL TIME ZONE` | `timestamp` | `timestamp with time zone` | |
| `INTERVAL YEAR TO MONTH` | `string` | `interval` | |
| `INTERVAL DAY TO SECOND` | `string` | `interval` | |
| `XMLTYPE` | `text` | `xml` | |
| `ROWID` | `string` | `oid` | |
| `UROWID` | `string` | `text` | |

### SQLite → IR → PostgreSQL

| SQLite | IR Type | PostgreSQL | Notes |
|--------|---------|------------|-------|
| `INTEGER` | `integer` | `integer` | |
| `REAL` | `number` | `real` | |
| `TEXT` | `text` | `text` | |
| `BLOB` | `binary` | `bytea` | |
| `NUMERIC` | `decimal` | `numeric` | |
| `BOOLEAN` | `boolean` | `boolean` | SQLite extension |
| `DATE` | `date` | `date` | SQLite extension |
| `DATETIME` | `datetime` | `timestamp` | SQLite extension |
| `TIMESTAMP` | `timestamp` | `timestamp with time zone` | SQLite extension |

### PostgreSQL → PostgreSQL (Normalization)

| Input | IR Type | Normalized | Notes |
|-------|---------|------------|-------|
| `serial` | `integer` | `integer` | Add auto-increment |
| `bigserial` | `bigint` | `bigint` | Add auto-increment |
| `smallserial` | `integer` | `smallint` | Add auto-increment |
| `varchar` | `string` | `varchar(255)` | Add default length |
| `jsonb` | `json` | `jsonb` | Prefer binary JSON |
| `timestamptz` | `timestamp` | `timestamp with time zone` | Normalize alias |

## Default Value Mappings

### Function Mappings

| Engine | Original | PostgreSQL | Description |
|--------|----------|------------|-------------|
| SQL Server | `GETDATE()` | `now()` | Current timestamp |
| SQL Server | `CURRENT_TIMESTAMP` | `CURRENT_TIMESTAMP` | Standard SQL |
| SQL Server | `NEWID()` | `gen_random_uuid()` | Random UUID |
| SQL Server | `CURRENT_USER` | `CURRENT_USER` | Current user |
| SQL Server | `USER` | `CURRENT_USER` | Current user |
| MySQL | `NOW()` | `now()` | Current timestamp |
| MySQL | `CURRENT_TIMESTAMP()` | `CURRENT_TIMESTAMP` | Standard SQL |
| MySQL | `UUID()` | `gen_random_uuid()` | Random UUID |
| MySQL | `USER()` | `CURRENT_USER` | Current user |
| Oracle | `SYSDATE` | `now()` | Current timestamp |
| Oracle | `SYSTIMESTAMP` | `now()` | Current timestamp |
| Oracle | `SYS_GUID()` | `gen_random_uuid()` | Random UUID |
| SQLite | `CURRENT_TIMESTAMP` | `CURRENT_TIMESTAMP` | Standard SQL |
| SQLite | `DATETIME('NOW')` | `now()` | Current timestamp |

### Literal Value Mappings

| Type | Input | Output | Notes |
|------|-------|--------|-------|
| Boolean | `1` | `true` | SQL Server BIT |
| Boolean | `0` | `false` | SQL Server BIT |
| String | `'text'` | `'text'` | Quoted strings |
| String | `N'text'` | `'text'` | Remove Unicode prefix |
| Number | `123` | `123` | Numeric literals |
| Number | `123.45` | `123.45` | Decimal literals |

## Constraint Mappings

### Referential Actions

| Input | PostgreSQL | Description |
|-------|------------|-------------|
| `CASCADE` | `CASCADE` | Delete/update cascade |
| `SET NULL` | `SET NULL` | Set to NULL |
| `SET DEFAULT` | `SET DEFAULT` | Set to default value |
| `RESTRICT` | `RESTRICT` | Prevent operation |
| `NO ACTION` | `NO ACTION` | Defer check |

### Index Types

| Engine | Original | PostgreSQL | Notes |
|--------|----------|------------|-------|
| SQL Server | `CLUSTERED` | `btree` | Default index type |
| SQL Server | `NONCLUSTERED` | `btree` | Default index type |
| MySQL | `BTREE` | `btree` | B-tree index |
| MySQL | `HASH` | `hash` | Hash index |
| Oracle | `BITMAP` | `gin` | Closest equivalent |

## JSON Schema Mappings

### IR → JSON Schema Types

| IR Type | JSON Schema | Format | Notes |
|---------|-------------|--------|-------|
| `string` | `string` | | |
| `text` | `string` | | |
| `integer` | `integer` | | |
| `bigint` | `integer` | | JavaScript safe range |
| `decimal` | `number` | | |
| `number` | `number` | | |
| `boolean` | `boolean` | | |
| `date` | `string` | `date` | ISO 8601 date |
| `datetime` | `string` | `date-time` | ISO 8601 datetime |
| `timestamp` | `string` | `date-time` | ISO 8601 datetime |
| `uuid` | `string` | `uuid` | RFC 4122 UUID |
| `json` | `object` | | |
| `binary` | `string` | `byte` | Base64 encoded |

### JSON Schema Constraints

| IR Constraint | JSON Schema | Example |
|---------------|-------------|---------|
| `length` | `maxLength` | `"maxLength": 255` |
| `precision` | `maximum`, `minimum` | Calculated bounds |
| `nullable` | `type: ["string", "null"]` | Union types |
| `unique` | `x-unique: true` | Extension |
| `references` | `x-foreignKey` | Extension |

## Sequelize Mappings

### IR → Sequelize DataTypes

| IR Type | Sequelize | Options |
|---------|-----------|---------|
| `string` | `DataType.STRING` | `length` |
| `text` | `DataType.TEXT` | |
| `integer` | `DataType.INTEGER` | |
| `bigint` | `DataType.BIGINT` | |
| `decimal` | `DataType.DECIMAL` | `precision`, `scale` |
| `number` | `DataType.FLOAT` | |
| `boolean` | `DataType.BOOLEAN` | |
| `date` | `DataType.DATEONLY` | |
| `datetime` | `DataType.DATE` | |
| `timestamp` | `DataType.DATE` | |
| `uuid` | `DataType.UUID` | |
| `json` | `DataType.JSON` | |
| `binary` | `DataType.BLOB` | |

### Sequelize Decorators

| IR Property | Decorator | Example |
|-------------|-----------|---------|
| `pk: true` | `@PrimaryKey` | |
| `unique: true` | `@Unique` | |
| `nullable: false` | `@AllowNull(false)` | |
| `default` | `@Default(value)` | |
| `references` | `@ForeignKey(() => Model)` | |

## Best Practices

### Type Selection Guidelines

1. **Text Data:**
   - Use `string` with `length` for bounded text (names, emails)
   - Use `text` for unbounded text (descriptions, content)

2. **Numeric Data:**
   - Use `integer` for counts, IDs, enum values
   - Use `bigint` for large sequences, timestamps
   - Use `decimal` for financial data requiring precision
   - Use `number` for scientific calculations

3. **Temporal Data:**
   - Use `date` for date-only fields (birthdate, due date)
   - Use `datetime` for local timestamps (meeting times)
   - Use `timestamp` for audit trails, creation times

4. **Identifiers:**
   - Use `uuid` for distributed systems
   - Use `integer` serial for simple auto-increment IDs

### Migration Considerations

1. **Precision Loss:**
   - Review numeric type downgrades (BIGINT → INTEGER)
   - Check date/time precision changes

2. **Character Sets:**
   - Unicode handling (NVARCHAR → VARCHAR)
   - Collation differences

3. **Default Values:**
   - Function compatibility
   - Timezone implications

4. **Constraints:**
   - CHECK constraint syntax differences
   - Index type availability

---

This mapping reference ensures consistent and accurate type conversion across all supported database engines and output formats.