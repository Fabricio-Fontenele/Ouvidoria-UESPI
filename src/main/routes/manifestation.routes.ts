import type { FastifyInstance } from 'fastify'

import { MAX_ATTACHMENT_SIZE_IN_BYTES } from '#src/application/attachments/attachment-policy.js'
import { UserRole } from '#src/domain/entities/user.js'
import { adaptMultipartRoute } from '#src/infra/http/fastify/fastify-multipart-route-adapter.js'
import { adaptRoute } from '#src/infra/http/fastify/fastify-route-adapter.js'
import {
  ensureAuthenticated,
  optionalAuthenticate,
  requireRoles,
} from '#src/infra/http/fastify/middlewares/auth-middleware.js'

import {
  makeAddManifestationMessageController,
  makeAddTrackedManifestationMessageController,
  makeEvaluateManifestationController,
  makeFinalizeManifestationController,
  makeGetManifestationAttachmentDownloadUrlController,
  makeGetManifestationDetailsController,
  makeGetTrackedManifestationAttachmentDownloadUrlController,
  makeGetTrackedManifestationDetailsController,
  makeGetUserManifestationMetricsController,
  makeListUserManifestationsController,
  makeRegisterManifestationController,
  makeTrackManifestationByProtocolController,
  makeUploadAnonymousManifestationAttachmentController,
  makeUploadManifestationAttachmentController,
} from '../factories/controllers/manifestation.js'

const anonymousAccessRateLimit = {
  config: {
    rateLimit: { max: 10, timeWindow: '1 minute' },
  },
} as const

const publicWriteRateLimit = {
  config: {
    rateLimit: { max: 20, timeWindow: '10 minutes' },
  },
} as const

export async function registerManifestationRoutes(app: FastifyInstance): Promise<void> {
  app.post('/manifestations/track', anonymousAccessRateLimit, adaptRoute(makeTrackManifestationByProtocolController()))
  app.post(
    '/manifestations/track/details',
    anonymousAccessRateLimit,
    adaptRoute(makeGetTrackedManifestationDetailsController()),
  )
  app.post(
    '/manifestations/track/messages',
    publicWriteRateLimit,
    adaptRoute(makeAddTrackedManifestationMessageController()),
  )
  app.post(
    '/manifestations/track/attachments',
    publicWriteRateLimit,
    adaptMultipartRoute(makeUploadAnonymousManifestationAttachmentController(), {
      expectedFieldNames: ['protocol', 'accessCode'],
      multipartOptions: {
        limits: {
          files: 1,
          fields: 2,
          parts: 3,
          fileSize: MAX_ATTACHMENT_SIZE_IN_BYTES,
        },
      },
      buildBody: ({ file, fields }) => ({
        protocol: fields['protocol'] ?? '',
        accessCode: fields['accessCode'] ?? '',
        file,
      }),
    }),
  )
  app.post(
    '/manifestations/track/attachments/:attachmentId/download-url',
    anonymousAccessRateLimit,
    adaptRoute(makeGetTrackedManifestationAttachmentDownloadUrlController()),
  )

  app.post(
    '/manifestations',
    { preHandler: optionalAuthenticate, ...publicWriteRateLimit },
    adaptRoute(makeRegisterManifestationController()),
  )

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
    '/manifestations/metrics',
    { preHandler: [...authenticatedManifestant] },
    adaptRoute(makeGetUserManifestationMetricsController()),
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
    '/manifestations/:manifestationId/attachments',
    { preHandler: [...authenticatedManifestant] },
    adaptMultipartRoute(makeUploadManifestationAttachmentController(), {
      expectedFieldNames: [],
      multipartOptions: {
        limits: {
          files: 1,
          fields: 0,
          parts: 1,
          fileSize: MAX_ATTACHMENT_SIZE_IN_BYTES,
        },
      },
      buildBody: ({ file }) => ({ file }),
    }),
  )

  app.post(
    '/manifestations/:manifestationId/attachments/:attachmentId/download-url',
    { preHandler: [...authenticatedManifestant] },
    adaptRoute(makeGetManifestationAttachmentDownloadUrlController()),
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
