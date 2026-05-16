import type { FastifyReply, FastifyRequest } from 'fastify'

import { UserRole } from '#src/domain/entities/user.js'

const ROLE_VALUES: readonly UserRole[] = Object.values(UserRole)

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && ROLE_VALUES.includes(value as UserRole)
}

export async function ensureAuthenticated(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify()
  } catch {
    await reply.status(401).send({ error: 'UnauthenticatedError', message: 'Authentication is required.' })
    return
  }

  const payload = request.user as unknown

  if (payload === null || typeof payload !== 'object') {
    await reply.status(401).send({ error: 'UnauthenticatedError', message: 'Invalid authentication payload.' })
    return
  }

  const candidate = payload as Record<string, unknown>
  const sub = candidate['sub']
  const role = candidate['role']

  if (typeof sub !== 'string' || !isUserRole(role)) {
    await reply.status(401).send({ error: 'UnauthenticatedError', message: 'Invalid authentication payload.' })
    return
  }

  request.user = { id: sub, role }
}

export async function optionalAuthenticate(request: FastifyRequest): Promise<void> {
  if (request.headers.authorization === undefined) {
    return
  }
  try {
    await request.jwtVerify()
    const payload = request.user as unknown
    if (payload !== null && typeof payload === 'object') {
      const candidate = payload as Record<string, unknown>
      const sub = candidate['sub']
      const role = candidate['role']
      if (typeof sub === 'string' && isUserRole(role)) {
        request.user = { id: sub, role }
      }
    }
  } catch {
    // optional auth: ignore invalid token, treat request as anonymous
  }
}

export function requireRoles(...allowedRoles: readonly UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const user = request.user as unknown
    if (user === null || typeof user !== 'object') {
      await reply.status(401).send({ error: 'UnauthenticatedError', message: 'Authentication is required.' })
      return
    }

    const role = (user as { role?: unknown }).role
    if (!isUserRole(role) || !allowedRoles.includes(role)) {
      await reply.status(403).send({ error: 'ForbiddenError', message: 'Insufficient role.' })
    }
  }
}
