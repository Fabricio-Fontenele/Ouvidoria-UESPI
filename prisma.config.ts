import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// `prisma generate` does not need a real database — only the schema. We fall back to a
// placeholder URL so installs (CI, fresh contributors) succeed without a populated `.env`.
// Commands that actually open a connection (e.g. `prisma migrate deploy`, runtime client)
// still require a real `DATABASE_URL` and will fail loudly when given the placeholder.
const PLACEHOLDER_URL = 'postgresql://placeholder:placeholder@localhost:5432/placeholder'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env['DATABASE_URL'] ?? PLACEHOLDER_URL,
  },
})
