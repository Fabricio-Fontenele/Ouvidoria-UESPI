import type { FastifyInstance } from 'fastify'

import { UserRole } from '#src/domain/entities/user.js'
import { adaptRoute } from '#src/infra/http/fastify/fastify-route-adapter.js'
import { ensureAuthenticated, requireRoles } from '#src/infra/http/fastify/middlewares/auth-middleware.js'

import {
  makeAnswerManifestationController,
  makeGetAdminManifestationAttachmentDownloadUrlController,
  makeGetAdminManifestationDetailsController,
  makeListAdminManifestationsController,
  makeUpdateManifestationStatusController,
} from '../factories/controllers/admin.js'

export async function registerAdminRoutes(app: FastifyInstance): Promise<void> {
  const preHandler = [ensureAuthenticated, requireRoles(UserRole.OMBUDSMAN, UserRole.ADMIN)]

  app.get('/admin/manifestations', { preHandler }, adaptRoute(makeListAdminManifestationsController()))

  app.get(
    '/admin/manifestations/:manifestationId',
    { preHandler },
    adaptRoute(makeGetAdminManifestationDetailsController()),
  )

  app.post(
    '/admin/manifestations/:manifestationId/attachments/:attachmentId/download-url',
    { preHandler },
    adaptRoute(makeGetAdminManifestationAttachmentDownloadUrlController()),
  )

  app.post(
    '/admin/manifestations/:manifestationId/answer',
    { preHandler },
    adaptRoute(makeAnswerManifestationController()),
  )

  app.patch(
    '/admin/manifestations/:manifestationId/status',
    { preHandler },
    adaptRoute(makeUpdateManifestationStatusController()),
  )
}
