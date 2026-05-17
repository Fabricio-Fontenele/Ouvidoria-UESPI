import type { FastifyInstance } from 'fastify'

import { UserRole } from '#src/domain/entities/user.js'
import { adaptRoute } from '#src/infra/http/fastify/fastify-route-adapter.js'
import {
  ensureAuthenticated,
  optionalAuthenticate,
  requireRoles,
} from '#src/infra/http/fastify/middlewares/auth-middleware.js'

import {
  makeAddManifestationMessageController,
  makeEvaluateManifestationController,
  makeFinalizeManifestationController,
  makeGetManifestationDetailsController,
  makeListUserManifestationsController,
  makeRegisterManifestationController,
  makeTrackManifestationByProtocolController,
} from '../factories/controllers/manifestation.js'

export async function registerManifestationRoutes(app: FastifyInstance): Promise<void> {
  app.post('/manifestations/track', adaptRoute(makeTrackManifestationByProtocolController()))

  app.post('/manifestations', { preHandler: optionalAuthenticate }, adaptRoute(makeRegisterManifestationController()))

  const authenticatedManifestant: ReadonlyArray<typeof ensureAuthenticated> = [
    ensureAuthenticated,
    requireRoles(UserRole.MANIFESTANT),
  ]

  app.get(
    '/manifestations',
    { preHandler: [...authenticatedManifestant] },
    adaptRoute(makeListUserManifestationsController()),
  )

  app.get(
    '/manifestations/:manifestationId',
    { preHandler: [...authenticatedManifestant] },
    adaptRoute(makeGetManifestationDetailsController()),
  )

  app.post(
    '/manifestations/:manifestationId/messages',
    { preHandler: [...authenticatedManifestant] },
    adaptRoute(makeAddManifestationMessageController()),
  )

  app.post(
    '/manifestations/:manifestationId/finalize',
    { preHandler: [...authenticatedManifestant] },
    adaptRoute(makeFinalizeManifestationController()),
  )

  app.post(
    '/manifestations/:manifestationId/evaluation',
    { preHandler: [...authenticatedManifestant] },
    adaptRoute(makeEvaluateManifestationController()),
  )
}
