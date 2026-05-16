import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'

const baseDatabaseUrl = process.env['DATABASE_URL_E2E'] ?? 'postgresql://postgres:postgres@localhost:5432/ouvidoria'

const schemaId = `e2e_${randomUUID().replaceAll('-', '')}`
const databaseUrl = `${baseDatabaseUrl}?schema=${schemaId}`

process.env['DATABASE_URL'] = databaseUrl
process.env['JWT_SECRET'] ??= 'e2e-jwt-secret-with-at-least-32-characters'
process.env['NODE_ENV'] = 'test'

execSync('pnpm prisma migrate deploy', {
  stdio: 'ignore',
  env: { ...process.env, DATABASE_URL: databaseUrl },
})

const { prisma } = await import('#src/infra/database/prisma/client.js')

afterAll(async () => {
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`)
  await prisma.$disconnect()
})

export { databaseUrl, schemaId }
