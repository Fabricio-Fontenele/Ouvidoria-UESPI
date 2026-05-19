import 'dotenv/config'
import { z } from 'zod'

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3333),
    HOST: z.string().default('0.0.0.0'),
    DATABASE_URL: z.url(),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(60 * 60 * 8),
    PASSWORD_HASH_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),
    SUPABASE_URL: z.url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
    SUPABASE_STORAGE_BUCKET: z.string().min(1, 'SUPABASE_STORAGE_BUCKET is required'),
    SUPABASE_SIGNED_URL_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(300),
    AI_GATEWAY_PROVIDER: z.enum(['fake', 'http']).default('fake'),
    AI_SERVICE_BASE_URL: z.url().optional(),
    AI_SERVICE_API_KEY: z.string().min(1).optional(),
    AI_SERVICE_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
    AI_HISTORY_MAX_CHARS: z.coerce.number().int().positive().default(12_000),
    CATALOG_CACHE_TTL_MS: z.coerce
      .number()
      .int()
      .nonnegative()
      .default(5 * 60_000),
  })
  .superRefine((data, ctx) => {
    if (data.AI_GATEWAY_PROVIDER !== 'http') {
      return
    }
    if (data.AI_SERVICE_BASE_URL === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['AI_SERVICE_BASE_URL'],
        message: 'AI_SERVICE_BASE_URL is required when AI_GATEWAY_PROVIDER=http',
      })
    }
    if (data.AI_SERVICE_API_KEY === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['AI_SERVICE_API_KEY'],
        message: 'AI_SERVICE_API_KEY is required when AI_GATEWAY_PROVIDER=http',
      })
    }
  })

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n  ')
  throw new Error(`Invalid environment configuration:\n  ${issues}`)
}

export const env = parsed.data
