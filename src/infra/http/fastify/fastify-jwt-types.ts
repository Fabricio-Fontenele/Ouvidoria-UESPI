import '@fastify/jwt'

import type { UserRole } from '#src/domain/entities/user.js'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; role: UserRole }
    user: { id: string; role: UserRole }
  }
}
