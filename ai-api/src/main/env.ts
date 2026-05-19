import 'dotenv/config'
import { z } from 'zod'

const PLACEHOLDER_API_KEY = 'change-me'

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    HOST: z.string().default('0.0.0.0'),

    GOOGLE_API_KEY: z.string().min(1, 'GOOGLE_API_KEY is required'),
    GOOGLE_EMBEDDING_MODEL: z.string().default('models/gemini-embedding-001'),
    GOOGLE_EMBEDDING_DIMS: z.coerce.number().int().positive().default(3072),
    GOOGLE_CHAT_MODEL: z.string().default('models/gemini-3-flash'),
    LLM_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.1),

    DATABASE_URL: z.url(),
    PG_VECTOR_COLLECTION_NAME: z.string().default('ouvidoria_kb'),

    KB_DIR: z.string().default('./docs/knowledge-base'),
    RAG_CHUNK_SIZE: z.coerce.number().int().positive().default(400),
    RAG_CHUNK_OVERLAP: z.coerce.number().int().min(0).default(0),
    RAG_TOP_K: z.coerce.number().int().positive().default(4),
    RAG_EMBEDDING_BATCH_SIZE: z.coerce.number().int().positive().default(5),
    RAG_EMBEDDING_MAX_RETRIES: z.coerce.number().int().min(0).default(6),

    AI_API_KEY: z.string().min(1, 'AI_API_KEY is required'),

    REQUEST_BODY_LIMIT_BYTES: z.coerce
      .number()
      .int()
      .positive()
      .default(1024 * 64),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production' && data.AI_API_KEY === PLACEHOLDER_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['AI_API_KEY'],
        message: `AI_API_KEY must be changed from "${PLACEHOLDER_API_KEY}" in production`,
      })
    }
  })

export function parseEnv(input: NodeJS.ProcessEnv): z.infer<typeof envSchema> {
  const parsed = envSchema.safeParse(input)

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n  ')
    throw new Error(`Invalid environment configuration:\n  ${issues}`)
  }

  return parsed.data
}

export const env = parseEnv(process.env)
export type Env = typeof env
