import type { FastifyReply, FastifyRequest } from 'fastify'

export function makeApiKeyAuth(expectedApiKey: string) {
  return async function apiKeyAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const providedRaw = request.headers['x-api-key']
    const provided = Array.isArray(providedRaw) ? providedRaw[0] : providedRaw

    if (typeof provided !== 'string' || provided.length === 0) {
      await reply.code(401).send({ error: 'missing_api_key' })
      return
    }

    if (!timingSafeEqual(provided, expectedApiKey)) {
      await reply.code(401).send({ error: 'invalid_api_key' })
      return
    }
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  let diff = 0
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}
