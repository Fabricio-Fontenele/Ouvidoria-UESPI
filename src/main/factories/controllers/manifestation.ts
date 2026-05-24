import { z, type ZodType } from 'zod'

import { AddManifestationMessageUseCase } from '#src/application/use-cases/add-manifestation-message/add-manifestation-message-use-case.js'
import { EvaluateManifestationUseCase } from '#src/application/use-cases/evaluate-manifestation/evaluate-manifestation-use-case.js'
import { FinalizeManifestationUseCase } from '#src/application/use-cases/finalize-manifestation/finalize-manifestation-use-case.js'
import { GetManifestationDetailsUseCase } from '#src/application/use-cases/get-manifestation-details/get-manifestation-details-use-case.js'
import { GetUserManifestationMetricsUseCase } from '#src/application/use-cases/get-user-manifestation-metrics/get-user-manifestation-metrics-use-case.js'
import { ListUserManifestationsUseCase } from '#src/application/use-cases/list-user-manifestations/list-user-manifestations-use-case.js'
import { GetManifestationAttachmentDownloadUrlUseCase } from '#src/application/use-cases/manifestation-attachments/get-manifestation-attachment-download-url-use-case.js'
import { GetTrackedManifestationAttachmentDownloadUrlUseCase } from '#src/application/use-cases/manifestation-attachments/get-tracked-manifestation-attachment-download-url-use-case.js'
import { GetTrackedManifestationDetailsUseCase } from '#src/application/use-cases/manifestation-attachments/get-tracked-manifestation-details-use-case.js'
import { UploadAnonymousManifestationAttachmentUseCase } from '#src/application/use-cases/manifestation-attachments/upload-anonymous-manifestation-attachment-use-case.js'
import { UploadManifestationAttachmentUseCase } from '#src/application/use-cases/manifestation-attachments/upload-manifestation-attachment-use-case.js'
import { RegisterManifestationUseCase } from '#src/application/use-cases/register-manifestation/register-manifestation.use-case.js'
import { TrackManifestationByProtocolUseCase } from '#src/application/use-cases/track-manifestation-by-protocol/track-manifestation-by-protocol-use-case.js'
import { ManifestationType } from '#src/domain/entities/manifestation.js'
import { ZodValidator } from '#src/infra/http/fastify/validators/zod-validator.js'
import { AddManifestationMessageController } from '#src/presentation/controllers/manifestation/add-manifestation-message.controller.js'
import { EvaluateManifestationController } from '#src/presentation/controllers/manifestation/evaluate-manifestation.controller.js'
import { FinalizeManifestationController } from '#src/presentation/controllers/manifestation/finalize-manifestation.controller.js'
import { GetManifestationAttachmentDownloadUrlController } from '#src/presentation/controllers/manifestation/get-manifestation-attachment-download-url.controller.js'
import { GetManifestationDetailsController } from '#src/presentation/controllers/manifestation/get-manifestation-details.controller.js'
import { GetTrackedManifestationAttachmentDownloadUrlController } from '#src/presentation/controllers/manifestation/get-tracked-manifestation-attachment-download-url.controller.js'
import { GetTrackedManifestationDetailsController } from '#src/presentation/controllers/manifestation/get-tracked-manifestation-details.controller.js'
import { GetUserManifestationMetricsController } from '#src/presentation/controllers/manifestation/get-user-manifestation-metrics.controller.js'
import { ListUserManifestationsController } from '#src/presentation/controllers/manifestation/list-user-manifestations.controller.js'
import { RegisterManifestationController } from '#src/presentation/controllers/manifestation/register-manifestation.controller.js'
import { TrackManifestationByProtocolController } from '#src/presentation/controllers/manifestation/track-manifestation-by-protocol.controller.js'
import { UploadAnonymousManifestationAttachmentController } from '#src/presentation/controllers/manifestation/upload-anonymous-manifestation-attachment.controller.js'
import { UploadManifestationAttachmentController } from '#src/presentation/controllers/manifestation/upload-manifestation-attachment.controller.js'

import { env } from '../../config/env.js'
import { infrastructure } from '../infrastructure.js'

const registerManifestationSchema = z.object({
  isAnonymous: z.boolean(),
  type: z.enum(Object.values(ManifestationType) as [string, ...string[]]),
  campusId: z.string(),
  administrativeUnitId: z.string(),
  description: z.string(),
  involvedPeople: z.string().nullable().optional(),
}) as unknown as ZodType<{
  isAnonymous: boolean
  type: ManifestationType
  campusId: string
  administrativeUnitId: string
  description: string
  involvedPeople?: string | null
}>

const addMessageSchema = z.object({ content: z.string() })

const trackByProtocolSchema = z.object({
  protocol: z.string(),
  accessCode: z.string(),
})

const multipartTrackSchema = trackByProtocolSchema

const evaluateManifestationSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(1000).nullable().optional(),
}) as unknown as ZodType<{
  rating: number
  comment?: string | null
}>

export function makeRegisterManifestationController(): RegisterManifestationController {
  const useCase = new RegisterManifestationUseCase(
    infrastructure.manifestationsRepository,
    infrastructure.catalogRepository,
    infrastructure.protocolGenerator,
    infrastructure.accessCodeGenerator,
    infrastructure.passwordHasher,
  )
  return new RegisterManifestationController(useCase, new ZodValidator(registerManifestationSchema))
}

export function makeAddManifestationMessageController(): AddManifestationMessageController {
  const useCase = new AddManifestationMessageUseCase(
    infrastructure.manifestationsRepository,
    infrastructure.manifestationInteractionsRepository,
  )
  return new AddManifestationMessageController(useCase, new ZodValidator(addMessageSchema))
}

export function makeFinalizeManifestationController(): FinalizeManifestationController {
  const useCase = new FinalizeManifestationUseCase(
    infrastructure.manifestationsRepository,
    infrastructure.manifestationAdministrationRepository,
  )
  return new FinalizeManifestationController(useCase)
}

export function makeEvaluateManifestationController(): EvaluateManifestationController {
  const useCase = new EvaluateManifestationUseCase(
    infrastructure.manifestationsRepository,
    infrastructure.usersRepository,
    infrastructure.manifestationEvaluationsRepository,
  )
  return new EvaluateManifestationController(useCase, new ZodValidator(evaluateManifestationSchema))
}

export function makeGetManifestationDetailsController(): GetManifestationDetailsController {
  const useCase = new GetManifestationDetailsUseCase(infrastructure.manifestationsRepository)
  return new GetManifestationDetailsController(useCase)
}

export function makeListUserManifestationsController(): ListUserManifestationsController {
  const useCase = new ListUserManifestationsUseCase(infrastructure.manifestationsRepository)
  return new ListUserManifestationsController(useCase)
}

export function makeGetUserManifestationMetricsController(): GetUserManifestationMetricsController {
  const useCase = new GetUserManifestationMetricsUseCase(infrastructure.manifestationsRepository)
  return new GetUserManifestationMetricsController(useCase)
}

export function makeTrackManifestationByProtocolController(): TrackManifestationByProtocolController {
  const useCase = new TrackManifestationByProtocolUseCase(
    infrastructure.manifestationsRepository,
    infrastructure.hashComparer,
  )
  return new TrackManifestationByProtocolController(useCase, new ZodValidator(trackByProtocolSchema))
}

export function makeUploadManifestationAttachmentController(): UploadManifestationAttachmentController {
  const useCase = new UploadManifestationAttachmentUseCase(
    infrastructure.manifestationsRepository,
    infrastructure.manifestationAttachmentsRepository,
    infrastructure.attachmentStorage,
  )
  return new UploadManifestationAttachmentController(useCase)
}

export function makeUploadAnonymousManifestationAttachmentController(): UploadAnonymousManifestationAttachmentController {
  const useCase = new UploadAnonymousManifestationAttachmentUseCase(
    infrastructure.manifestationsRepository,
    infrastructure.hashComparer,
    infrastructure.manifestationAttachmentsRepository,
    infrastructure.attachmentStorage,
  )
  return new UploadAnonymousManifestationAttachmentController(useCase, new ZodValidator(multipartTrackSchema))
}

export function makeGetManifestationAttachmentDownloadUrlController(): GetManifestationAttachmentDownloadUrlController {
  const useCase = new GetManifestationAttachmentDownloadUrlUseCase(
    infrastructure.manifestationsRepository,
    infrastructure.manifestationAttachmentsRepository,
    infrastructure.attachmentStorage,
    env.SUPABASE_SIGNED_URL_EXPIRES_IN_SECONDS,
  )
  return new GetManifestationAttachmentDownloadUrlController(useCase)
}

export function makeGetTrackedManifestationAttachmentDownloadUrlController(): GetTrackedManifestationAttachmentDownloadUrlController {
  const useCase = new GetTrackedManifestationAttachmentDownloadUrlUseCase(
    infrastructure.manifestationsRepository,
    infrastructure.hashComparer,
    infrastructure.manifestationAttachmentsRepository,
    infrastructure.attachmentStorage,
    env.SUPABASE_SIGNED_URL_EXPIRES_IN_SECONDS,
  )
  return new GetTrackedManifestationAttachmentDownloadUrlController(useCase, new ZodValidator(trackByProtocolSchema))
}

export function makeGetTrackedManifestationDetailsController(): GetTrackedManifestationDetailsController {
  const useCase = new GetTrackedManifestationDetailsUseCase(
    infrastructure.manifestationsRepository,
    infrastructure.hashComparer,
  )
  return new GetTrackedManifestationDetailsController(useCase, new ZodValidator(trackByProtocolSchema))
}
