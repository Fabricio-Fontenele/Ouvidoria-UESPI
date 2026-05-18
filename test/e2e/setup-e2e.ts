import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'

import { withDatabaseSchema, withDatabaseSchemaSearchPath } from '#src/infra/database/prisma/database-url.js'

const baseDatabaseUrl = process.env['DATABASE_URL_E2E'] ?? 'postgresql://postgres:postgres@localhost:5432/ouvidoria'

const schemaId = `e2e_${randomUUID().replaceAll('-', '')}`
const schemaDatabaseUrl = withDatabaseSchema(baseDatabaseUrl, schemaId)
const { connectionString: databaseUrl } = withDatabaseSchemaSearchPath(schemaDatabaseUrl)

process.env['DATABASE_URL'] = databaseUrl
process.env['JWT_SECRET'] ??= 'e2e-jwt-secret-with-at-least-32-characters'
process.env['NODE_ENV'] = 'test'
process.env['SUPABASE_URL'] ??= 'https://example.supabase.co'
process.env['SUPABASE_SERVICE_ROLE_KEY'] ??= 'supabase-service-role-key'
process.env['SUPABASE_STORAGE_BUCKET'] ??= 'manifestation-attachments'
process.env['SUPABASE_SIGNED_URL_EXPIRES_IN_SECONDS'] ??= '300'

execSync('pnpm prisma migrate deploy', {
  stdio: 'ignore',
  env: { ...process.env, DATABASE_URL: databaseUrl },
})

execSync('pnpm prisma db seed', {
  stdio: 'ignore',
  env: { ...process.env, DATABASE_URL: databaseUrl },
})

const { prisma } = await import('#src/infra/database/prisma/client.js')

await assertSchemaIsolation()

afterAll(async () => {
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`)
  await prisma.$disconnect()
})

async function assertSchemaIsolation(): Promise<void> {
  const markerEmail = `e2e-${schemaId}@test.local`
  const passwordHash = '$2b$10$123456789012345678901uJr6tP3HhFQ9Xh6l6zJ9Xx0bQ4r7mWPe'

  const currentSchemaRows = await prisma.$queryRaw<{ current_schema: string }[]>`
    SELECT current_schema() AS current_schema
  `

  const currentSchema = currentSchemaRows[0]?.current_schema

  if (currentSchema !== schemaId) {
    throw new Error(`Expected current_schema() to be "${schemaId}", received "${currentSchema ?? 'undefined'}"`)
  }

  const markerUser = await prisma.user.create({
    data: {
      name: 'E2E schema marker',
      email: markerEmail,
      passwordHash,
      role: 'manifestant',
    },
  })

  const storedUser = await prisma.user.findUnique({ where: { email: markerEmail } })

  if (storedUser?.id !== markerUser.id) {
    throw new Error(`Expected ORM read to find marker user in schema "${schemaId}"`)
  }

  const scopedRows = await prisma.$queryRawUnsafe<{ count: number }[]>(
    `SELECT COUNT(*)::int AS count FROM "${schemaId}"."users" WHERE email = $1`,
    markerEmail,
  )

  if (scopedRows[0]?.count !== 1) {
    throw new Error(`Expected marker user to be stored in schema "${schemaId}"`)
  }

  const publicTableRows = await prisma.$queryRaw<{ relation_name: string | null }[]>`
    SELECT to_regclass('public.users')::text AS relation_name
  `

  const publicUsersTableExists = publicTableRows[0]?.relation_name !== null

  if (publicUsersTableExists) {
    const publicRows = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int AS count FROM public.users WHERE email = ${markerEmail}
    `

    if (publicRows[0]?.count !== 0) {
      throw new Error(`Expected marker user to stay out of public.users for schema "${schemaId}"`)
    }
  }

  await prisma.user.delete({ where: { id: markerUser.id } })
}

export { databaseUrl, schemaId }
