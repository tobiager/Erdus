import { describe, it, expect } from 'vitest'
import { convert } from '../src/convert'
import fs from 'fs'
import path from 'path'

interface Case {
  name: string
  inputFile: string
  from: 'sql' | 'prisma' | 'erdplus-old' | 'erdplus-new'
  to: 'sql' | 'prisma' | 'erdplus-old' | 'erdplus-new'
  expectContains: string[]
  expectLossy?: boolean
}

const cases: Case[] = [
  {
    name: 'SQL → Prisma PK+unique+default',
    inputFile: 'sql-a1.sql',
    from: 'sql',
    to: 'prisma',
    expectContains: ['@id', '@unique', '@default(now())'],
    expectLossy: false,
  },
  {
    name: 'SQL → Prisma FK con onDelete/onUpdate',
    inputFile: 'sql-a2.sql',
    from: 'sql',
    to: 'prisma',
    expectContains: ['onDelete: Cascade', 'onUpdate: NoAction'],
    expectLossy: false,
  },
  {
    name: 'SQL → Prisma CHECK constraint (lossy)',
    inputFile: 'sql-a3.sql',
    from: 'sql',
    to: 'prisma',
    expectContains: ['Decimal'],
    expectLossy: true,
  },
  {
    name: 'SQL → Prisma indexes',
    inputFile: 'sql-a4.sql',
    from: 'sql',
    to: 'prisma',
    expectContains: ['@@unique([sku, tienda_id]', '@@index([sku]'],
    expectLossy: false,
  },
  {
    name: 'Prisma → SQL N-M join table',
    inputFile: 'prisma-b1.prisma',
    from: 'prisma',
    to: 'sql',
    expectContains: ['PRIMARY KEY ("usuario_id","rol_id")'],
    expectLossy: false,
  },
  {
    name: 'Prisma → SQL 1-1 relation',
    inputFile: 'prisma-b2.prisma',
    from: 'prisma',
    to: 'sql',
    expectContains: ['UNIQUE'],
    expectLossy: false,
  },
  {
    name: 'ERDPlus old → SQL weak entity',
    inputFile: 'erd-c1.json',
    from: 'erdplus-old',
    to: 'sql',
    expectContains: ['FOREIGN KEY ("id_orden") REFERENCES "ORDEN"("id_orden")'],
    expectLossy: false,
  },
]

describe('Conversion cases', () => {
  for (const c of cases) {
    it(c.name, async () => {
      const input = fs.readFileSync(path.join(__dirname, 'fixtures', c.inputFile), 'utf8')
      const result = await convert(input, { from: c.from, to: c.to })
      for (const token of c.expectContains) {
        expect(result.output).toContain(token)
      }
      if (c.expectLossy !== undefined) {
        expect(result.lossReport.lossy).toBe(c.expectLossy)
      }
    })
  }
})
