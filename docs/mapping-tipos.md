# Type Mapping Reference

This document provides comprehensive type mapping information for converting between different database engines to PostgreSQL/Supabase.

## Type Mapping Tables

### SQL Server → PostgreSQL

| SQL Server Type | PostgreSQL Type | Notes |
|----------------|------------------|-------|
| `BIT` | `boolean` | SQL Server BIT(1) → PostgreSQL boolean |
| `TINYINT` | `smallint` | 8-bit → 16-bit (PostgreSQL has no 8-bit integer) |
| `SMALLINT` | `smallint` | Direct mapping |
| `INT`, `INTEGER` | `integer` | Direct mapping |
| `BIGINT` | `bigint` | Direct mapping |
| `DECIMAL(p,s)`, `NUMERIC(p,s)` | `numeric(p,s)` | Precision and scale preserved |
| `MONEY` | `money` | Direct mapping |
| `SMALLMONEY` | `money` | Upgraded to standard money type |
| `FLOAT` | `double precision` | SQL Server FLOAT → PostgreSQL double precision |
| `REAL` | `real` | Direct mapping |
| `CHAR(n)` | `char(n)` | Fixed-length character data |
| `VARCHAR(n)` | `varchar(n)` | Variable-length character data |
| `NCHAR(n)` | `char(n)` | Unicode → standard char (UTF-8 in PostgreSQL) |
| `NVARCHAR(n)` | `varchar(n)` | Unicode → standard varchar |
| `TEXT` | `text` | Large text data |
| `NTEXT` | `text` | Unicode text → standard text |
| `BINARY(n)` | `bytea` | Fixed-length binary → variable binary |
| `VARBINARY(n)` | `bytea` | Variable-length binary data |
| `IMAGE` | `bytea` | Legacy binary large object |
| `DATE` | `date` | Direct mapping |
| `TIME` | `time` | Direct mapping |
| `DATETIME` | `timestamp with time zone` | Includes timezone awareness |
| `DATETIME2` | `timestamp with time zone` | Enhanced datetime with timezone |
| `SMALLDATETIME` | `timestamp` | Lower precision datetime |
| `DATETIMEOFFSET` | `timestamp with time zone` | Timezone-aware datetime |
| `UNIQUEIDENTIFIER` | `uuid` | Microsoft GUID → PostgreSQL UUID |
| `XML` | `xml` | Direct mapping |
| `JSON` | `jsonb` | Enhanced JSON with indexing |
| `GEOGRAPHY` | `geometry` | Requires PostGIS extension |
| `GEOMETRY` | `geometry` | Requires PostGIS extension |

### MySQL → PostgreSQL

| MySQL Type | PostgreSQL Type | Notes |
|------------|------------------|-------|
| `TINYINT` | `smallint` | 8-bit → 16-bit |
| `TINYINT(1)` | `boolean` | MySQL boolean convention |
| `SMALLINT` | `smallint` | Direct mapping |
| `MEDIUMINT` | `integer` | 24-bit → 32-bit |
| `INT`, `INTEGER` | `integer` | Direct mapping |
| `BIGINT` | `bigint` | Direct mapping |
| `DECIMAL(p,s)`, `NUMERIC(p,s)` | `numeric(p,s)` | Precision preserved |
| `FLOAT` | `real` | Single precision |
| `DOUBLE`, `DOUBLE PRECISION` | `double precision` | Double precision |
| `BIT(n)` | `bit(n)` | Bit string |
| `CHAR(n)` | `char(n)` | Fixed-length |
| `VARCHAR(n)` | `varchar(n)` | Variable-length |
| `BINARY(n)` | `bytea` | Fixed binary → variable |
| `VARBINARY(n)` | `bytea` | Variable binary |
| `TINYBLOB` | `bytea` | Small binary large object |
| `BLOB` | `bytea` | Binary large object |
| `MEDIUMBLOB` | `bytea` | Medium binary large object |
| `LONGBLOB` | `bytea` | Large binary large object |
| `TINYTEXT` | `text` | Small text |
| `TEXT` | `text` | Standard text |
| `MEDIUMTEXT` | `text` | Medium text |
| `LONGTEXT` | `text` | Large text |
| `DATE` | `date` | Direct mapping |
| `TIME` | `time` | Direct mapping |
| `DATETIME` | `timestamp` | Without timezone |
| `TIMESTAMP` | `timestamp with time zone` | With timezone |
| `YEAR` | `smallint` | Year as integer |
| `JSON` | `jsonb` | Enhanced JSON |
| `GEOMETRY` | `geometry` | Requires PostGIS |
| `POINT` | `point` | Geometric point |
| `LINESTRING` | `path` | Line geometry |
| `POLYGON` | `polygon` | Polygon geometry |
| `ENUM('a','b','c')` | `text` | Enum → text with CHECK constraint |
| `SET('a','b','c')` | `text[]` | Set → text array |

### Oracle → PostgreSQL

| Oracle Type | PostgreSQL Type | Notes |
|-------------|------------------|-------|
| `NUMBER` | `numeric` | General numeric type |
| `NUMBER(p)` | `numeric(p)` | With precision |
| `NUMBER(p,s)` | `numeric(p,s)` | With precision and scale |
| `INTEGER`, `INT` | `integer` | Direct mapping |
| `SMALLINT` | `smallint` | Direct mapping |
| `DECIMAL(p,s)` | `numeric(p,s)` | Direct mapping |
| `FLOAT` | `double precision` | Floating point |
| `DOUBLE PRECISION` | `double precision` | Direct mapping |
| `REAL` | `real` | Single precision |
| `BINARY_FLOAT` | `real` | Oracle binary float |
| `BINARY_DOUBLE` | `double precision` | Oracle binary double |
| `CHAR(n)` | `char(n)` | Fixed character |
| `VARCHAR(n)`, `VARCHAR2(n)` | `varchar(n)` | Variable character |
| `NCHAR(n)` | `char(n)` | National character set |
| `NVARCHAR2(n)` | `varchar(n)` | National variable character |
| `CLOB` | `text` | Character large object |
| `NCLOB` | `text` | National character large object |
| `LONG` | `text` | Legacy long text |
| `DATE` | `timestamp` | Oracle DATE includes time |
| `TIMESTAMP` | `timestamp` | Direct mapping |
| `TIMESTAMP WITH TIME ZONE` | `timestamp with time zone` | Direct mapping |
| `TIMESTAMP WITH LOCAL TIME ZONE` | `timestamp with time zone` | Local timezone |
| `INTERVAL YEAR TO MONTH` | `interval` | Year-month interval |
| `INTERVAL DAY TO SECOND` | `interval` | Day-second interval |
| `BLOB` | `bytea` | Binary large object |
| `RAW(n)` | `bytea` | Raw binary data |
| `LONG RAW` | `bytea` | Long raw binary |
| `BFILE` | `text` | File reference → text path |
| `XMLTYPE` | `xml` | XML data type |
| `JSON` | `jsonb` | JSON data (Oracle 21c+) |
| `ROWID` | `oid` | Row identifier |
| `UROWID` | `text` | Universal row identifier |

### SQLite → PostgreSQL

| SQLite Type | PostgreSQL Type | Notes |
|-------------|------------------|-------|
| `INTEGER` | `integer` | SQLite affinity → PostgreSQL integer |
| `TEXT` | `text` | Direct mapping |
| `REAL` | `real` | Floating point |
| `BLOB` | `bytea` | Binary data |
| `NUMERIC` | `numeric` | Numeric affinity |
| `BOOLEAN` | `boolean` | Boolean (SQLite extension) |
| `DATE` | `date` | Date (SQLite extension) |
| `DATETIME` | `timestamp` | Datetime (SQLite extension) |
| `TIMESTAMP` | `timestamp` | Timestamp |
| `TIME` | `time` | Time |
| `VARCHAR(n)` | `varchar(n)` | Variable character |
| `CHAR(n)` | `char(n)` | Fixed character |
| `DECIMAL(p,s)` | `numeric(p,s)` | Decimal with precision |
| `FLOAT` | `real` | Floating point |
| `DOUBLE` | `double precision` | Double precision |
| `BIGINT` | `bigint` | Big integer |
| `SMALLINT` | `smallint` | Small integer |
| `TINYINT` | `smallint` | Tiny integer → small |

### MongoDB → PostgreSQL

| MongoDB/BSON Type | PostgreSQL Type | Notes |
|-------------------|------------------|-------|
| `ObjectId` | `uuid` | MongoDB identifier → UUID |
| `String` | `text` | Text data |
| `Number` | `numeric` | General numeric |
| `Boolean` | `boolean` | Direct mapping |
| `Date` | `timestamp with time zone` | Date with timezone |
| `Array` | `jsonb` | Array → JSON array |
| `Object` | `jsonb` | Embedded document → JSON |
| `Binary` | `bytea` | Binary data |
| `Decimal128` | `numeric` | High precision decimal |
| `Double` | `double precision` | Double precision float |
| `Int32` | `integer` | 32-bit integer |
| `Int64` | `bigint` | 64-bit integer |
| `Timestamp` | `timestamp` | BSON timestamp |
| `Mixed` | `jsonb` | Mixed types → JSON |
| `null` | `NULL` | Null value |

## Function Mapping

### SQL Server Functions → PostgreSQL

| SQL Server Function | PostgreSQL Equivalent | Notes |
|--------------------|----------------------|-------|
| `GETDATE()` | `now()` | Current timestamp |
| `GETUTCDATE()` | `now() AT TIME ZONE 'UTC'` | UTC timestamp |
| `NEWID()` | `gen_random_uuid()` | Generate UUID |
| `LEN(string)` | `length(string)` | String length |
| `DATALENGTH(data)` | `octet_length(data)` | Data length in bytes |
| `ISNULL(expr, replacement)` | `COALESCE(expr, replacement)` | Null handling |
| `CHARINDEX(substring, string)` | `strpos(string, substring)` | Find substring position |
| `SUBSTRING(string, start, length)` | `substr(string, start, length)` | Extract substring |
| `DATEPART(part, date)` | `extract(part from date)` | Extract date part |
| `DATEADD(part, number, date)` | `date + interval 'number part'` | Add to date |
| `DATEDIFF(part, date1, date2)` | `extract(part from (date2 - date1))` | Date difference |
| `CAST(expr AS type)` | `CAST(expr AS type)` | Type conversion |
| `CONVERT(type, expr)` | `CAST(expr AS type)` | Type conversion |
| `TOP n` | `LIMIT n` | Limit results |

### MySQL Functions → PostgreSQL

| MySQL Function | PostgreSQL Equivalent | Notes |
|----------------|----------------------|-------|
| `NOW()` | `now()` | Current timestamp |
| `CURDATE()` | `current_date` | Current date |
| `CURTIME()` | `current_time` | Current time |
| `UNIX_TIMESTAMP()` | `extract(epoch from now())` | Unix timestamp |
| `UUID()` | `gen_random_uuid()` | Generate UUID |
| `LENGTH(string)` | `length(string)` | String length |
| `CONCAT(str1, str2, ...)` | `CONCAT(str1, str2, ...)` | String concatenation |
| `IFNULL(expr, replacement)` | `COALESCE(expr, replacement)` | Null handling |
| `IF(condition, true_val, false_val)` | `CASE WHEN condition THEN true_val ELSE false_val END` | Conditional |
| `SUBSTR(string, pos, len)` | `substr(string, pos, len)` | Substring |
| `SUBSTRING(string, pos, len)` | `substr(string, pos, len)` | Substring |
| `LOCATE(substring, string)` | `strpos(string, substring)` | Find position |
| `REPLACE(string, from, to)` | `replace(string, from, to)` | String replacement |
| `UPPER(string)` | `upper(string)` | Uppercase |
| `LOWER(string)` | `lower(string)` | Lowercase |
| `LIMIT n` | `LIMIT n` | Direct mapping |

### Oracle Functions → PostgreSQL

| Oracle Function | PostgreSQL Equivalent | Notes |
|----------------|----------------------|-------|
| `SYSDATE` | `now()` | Current timestamp |
| `SYSTIMESTAMP` | `now()` | Current timestamp with timezone |
| `SYS_GUID()` | `gen_random_uuid()` | Generate UUID |
| `LENGTH(string)` | `length(string)` | String length |
| `SUBSTR(string, pos, len)` | `substr(string, pos, len)` | Substring |
| `INSTR(string, substring)` | `strpos(string, substring)` | Find position |
| `NVL(expr, replacement)` | `COALESCE(expr, replacement)` | Null handling |
| `NVL2(expr, not_null_val, null_val)` | `CASE WHEN expr IS NULL THEN null_val ELSE not_null_val END` | Extended null handling |
| `DECODE(expr, search1, result1, ...)` | `CASE expr WHEN search1 THEN result1 ... END` | Multi-way branch |
| `TO_CHAR(date, format)` | `to_char(date, format)` | Date to string |
| `TO_DATE(string, format)` | `to_date(string, format)` | String to date |
| `TO_NUMBER(string)` | `to_number(string, '999999999999')` | String to number |
| `TRUNC(number, decimals)` | `trunc(number, decimals)` | Truncate number |
| `ROUND(number, decimals)` | `round(number, decimals)` | Round number |
| `ROWNUM` | `ROW_NUMBER() OVER ()` | Row numbering |

## Default Value Mapping

### Common Default Expressions

| Source | Target | Description |
|--------|--------|-------------|
| `GETDATE()` | `now()` | Current timestamp |
| `GETUTCDATE()` | `now() AT TIME ZONE 'UTC'` | UTC timestamp |
| `NEWID()` | `gen_random_uuid()` | New UUID |
| `UUID()` | `gen_random_uuid()` | New UUID |
| `CURRENT_TIMESTAMP` | `now()` | Current timestamp |
| `CURRENT_DATE` | `current_date` | Current date |
| `CURRENT_TIME` | `current_time` | Current time |
| `SYSDATE` | `now()` | Oracle current date |
| `SYS_GUID()` | `gen_random_uuid()` | Oracle UUID |
| `AUTO_INCREMENT` | `serial` or `bigserial` | Auto-incrementing |
| `IDENTITY(1,1)` | `serial` | SQL Server identity |
| `GENERATED BY DEFAULT AS IDENTITY` | `serial` | Standard identity |

### Boolean Defaults

| Source | Target | Notes |
|--------|--------|-------|
| `1` | `true` | SQL Server bit |
| `0` | `false` | SQL Server bit |
| `TRUE` | `true` | Direct mapping |
| `FALSE` | `false` | Direct mapping |
| `'Y'` | `true` | Character boolean |
| `'N'` | `false` | Character boolean |

## Constraint Mapping

### Primary Key Constraints

```sql
-- SQL Server
CONSTRAINT [PK_Users] PRIMARY KEY ([Id])

-- PostgreSQL
CONSTRAINT "Users_pkey" PRIMARY KEY ("Id")
```

### Foreign Key Constraints

```sql
-- SQL Server
CONSTRAINT [FK_Posts_Users] FOREIGN KEY ([UserId]) 
REFERENCES [Users]([Id]) ON DELETE CASCADE

-- PostgreSQL  
CONSTRAINT "fk_Posts_UserId" FOREIGN KEY ("UserId")
REFERENCES "Users" ("Id") ON DELETE CASCADE
```

### Check Constraints

```sql
-- SQL Server
CONSTRAINT [CK_Users_Age] CHECK ([Age] >= 0 AND [Age] <= 150)

-- PostgreSQL
CONSTRAINT "CK_Users_Age" CHECK ("Age" >= 0 AND "Age" <= 150)
```

### Unique Constraints

```sql
-- SQL Server
CONSTRAINT [UK_Users_Email] UNIQUE ([Email])

-- PostgreSQL
CONSTRAINT "Users_email_unique" UNIQUE ("Email")
```

## Index Mapping

### Standard Indexes

```sql
-- SQL Server
CREATE INDEX [IX_Orders_CustomerId] ON [Orders]([CustomerId])

-- PostgreSQL
CREATE INDEX "IX_Orders_CustomerId" ON "Orders" ("CustomerId")
```

### Unique Indexes

```sql
-- SQL Server
CREATE UNIQUE INDEX [UX_Users_Email] ON [Users]([Email])

-- PostgreSQL
CREATE UNIQUE INDEX "UX_Users_Email" ON "Users" ("Email")
```

## Special Considerations

### Case Sensitivity

- **SQL Server**: Case-insensitive by default (depends on collation)
- **MySQL**: Case-insensitive by default (depends on collation)
- **PostgreSQL**: Case-sensitive; identifiers are folded to lowercase unless quoted

**Recommendation**: Always use quoted identifiers for exact case preservation.

### Identifier Length Limits

| Database | Max Identifier Length |
|----------|----------------------|
| SQL Server | 128 characters |
| MySQL | 64 characters |
| Oracle | 30 characters (128 in 12.2+) |
| PostgreSQL | 63 characters |
| SQLite | No limit |

### Character Encoding

- **SQL Server**: Uses UTF-16 for NVARCHAR/NCHAR
- **MySQL**: UTF-8 support with utf8mb4 charset
- **Oracle**: Multiple character sets supported
- **PostgreSQL**: UTF-8 by default
- **SQLite**: UTF-8/UTF-16 support

### Numeric Precision

| Database | Max Decimal Precision |
|----------|----------------------|
| SQL Server | 38 digits |
| MySQL | 65 digits |
| Oracle | 38 digits |
| PostgreSQL | 131072 digits before decimal, 16383 digits after |
| SQLite | No precision limit |

## Unsupported Features

### Currently Not Migrated

1. **Stored Procedures/Functions**: Require manual conversion due to syntax differences
2. **Triggers**: Need manual rewriting for PostgreSQL syntax
3. **User-Defined Types**: Complex types need individual assessment
4. **Full-Text Indexes**: Different implementations across databases
5. **Partitioning**: PostgreSQL partitioning syntax differs significantly
6. **Computed Columns**: PostgreSQL uses generated columns (different syntax)
7. **Sequences**: Handled differently across databases
8. **Views**: Basic views supported, complex views may need adjustment

### Manual Review Required

- Complex expressions in CHECK constraints
- Database-specific functions not listed in mappings
- Collation specifications
- Custom data types
- Advanced indexing options (filtered indexes, included columns)
- Security policies beyond basic RLS

## Performance Considerations

### Type Choices

- **Use `text` over `varchar(max)`**: PostgreSQL `text` is more efficient
- **Prefer `jsonb` over `json`**: Better indexing and query performance
- **Use appropriate integer sizes**: Don't always use `bigint` if `integer` suffices
- **Consider `uuid` vs `serial`**: UUIDs provide global uniqueness but are larger

### Indexing Strategy

- **B-tree indexes**: Default and most common
- **GIN indexes**: For JSONB and array data
- **GIST indexes**: For geometric and full-text data
- **Partial indexes**: For filtered data (WHERE clause)

## Testing Recommendations

1. **Schema Validation**: Verify all tables, columns, and constraints are created correctly
2. **Data Type Testing**: Insert test data to verify type compatibility
3. **Constraint Testing**: Test all constraints work as expected
4. **Performance Testing**: Compare query performance between source and target
5. **Application Testing**: Verify applications work with migrated schema

## Getting Help

For types or functions not covered in this mapping:

1. Check PostgreSQL documentation for equivalent functions
2. File an issue with specific mapping requests
3. Consider creating custom functions for complex conversions
4. Use PostgreSQL extensions for specialized data types (PostGIS, etc.)