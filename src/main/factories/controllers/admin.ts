import { z, type ZodType } from 'zod'

import { AnswerManifestationUseCase } from '#src/application/use-cases/answer-manifestation/answer-manifestation-use-case.js'
import { CancelManifestationUseCase } from '#src/application/use-cases/cancel-manifestation/cancel-manifestation-use-case.js'
import { ForwardManifestationToUnitUseCase } from '#src/application/use-cases/forward-manifestation-to-unit/forward-manifestation-to-unit-use-case.js'
import { GetAdminManifestationDetailsUseCase } from '#src/application/use-cases/get-admin-manifestation-details/get-admin-manifestation-details-use-case.js'
import { GetAdminManifestationMetricsUseCase } from '#src/application/use-cases/get-admin-manifestation-metrics/get-admin-manifestation-metrics-use-case.js'
import { ListAdminManifestationsUseCase } from '#src/application/use-cases/list-admin-manifestations/list-admin-manifestations-use-case.js'
import { GetAdminManifestationAttachmentDownloadUrlUseCase } from '#src/application/use-cases/manifestation-attachments/get-admin-manifestation-attachment-download-url-use-case.js'
import { UpdateManifestationStatusUseCase } from '#src/application/use-cases/update-manifestation-status/update-manifestation-status-use-case.js'
import { ManifestationCancellationReason, ManifestationStatus } from '#src/domain/entities/manifestation.js'
import { ZodValidator } from '#src/infra/http/fastify/validators/zod-validator.js'
import { AnswerManifestationController } from '#src/presentation/controllers/admin/answer-manifestation.controller.js'
import { CancelManifestationController } from '#src/presentation/controllers/admin/cancel-manifestation.controller.js'
import { ForwardManifestationToUnitController } from '#src/presentation/controllers/admin/forward-manifestation-to-unit.controller.js'
import { GetAdminManifestationAttachmentDownloadUrlController } from '#src/presentation/controllers/admin/get-admin-manifestation-attachment-download-url.controller.js'
import { GetAdminManifestationDetailsController } from '#src/presentation/controllers/admin/get-admin-manifestation-details.controller.js'
import { GetAdminManifestationMetricsController } from '#src/presentation/controllers/admin/get-admin-manifestation-metrics.controller.js'
import { ListAdminManifestationsController } from '#src/presentation/controllers/admin/list-admin-manifestations.controller.js'
import { UpdateManifestationStatusController } from '#src/presentation/controllers/admin/update-manifestation-status.controller.js'

import { env } from '../../config/env.js'
import { infrastructure } from '../infrastructure.js'

const answerSchema = z.object({ content: z.string() })
const forwardToUnitSchema = z.object({ administrativeUnitId: z.string() })
// Cancelamento tem fluxo próprio (POST /cancel) com motivo obrigatório, então o
// endpoint genérico de status não aceita mais a transição para `canceled`.
const updatableStatuses = Object.values(ManifestationStatus).filter((status) => status !== ManifestationStatus.CANCELED)
const updateStatusSchema = z.object({
  status: z.enum(updatableStatuses as [string, ...string[]]),
}) as unknown as ZodType<{ status: ManifestationStatus }>
const cancelSchema = z.object({
  reason: z.enum(Object.values(ManifestationCancellationReason) as [string, ...string[]]),
  note: z.string().trim().min(1).optional(),
}) as unknown as ZodType<{ reason: ManifestationCancellationReason; note?: string }>

export function makeAnswerManifestationController(): AnswerManifestationController {
  const useCase = new AnswerManifestationUseCase(
    infrastructure.manifestationsRepository,
    infrastructure.manifestationAdministrationRepository,
    infrastructure.usersRepository,
  )
  return new AnswerManifestationController(useCase, new ZodValidator(answerSchema))
}

export function makeForwardManifestationToUnitController(): ForwardManifestationToUnitController {
  const useCase = new ForwardManifestationToUnitUseCase(
    infrastructure.manifestationsRepository,
    infrastructure.manifestationAdministrationRepository,
    infrastructure.usersRepository,
    infrastructure.catalogRepository,
  )
  return new ForwardManifestationToUnitController(useCase, new ZodValidator(forwardToUnitSchema))
}

export function makeUpdateManifestationStatusController(): UpdateManifestationStatusController {
  const useCase = new UpdateManifestationStatusUseCase(
    infrastructure.manifestationAdministrationRepository,
    infrastructure.manifestationsRepository,
    infrastructure.usersRepository,
  )
  return new UpdateManifestationStatusController(useCase, new ZodValidator(updateStatusSchema))
}

export function makeCancelManifestationController(): CancelManifestationController {
  const useCase = new CancelManifestationUseCase(
    infrastructure.manifestationAdministrationRepository,
    infrastructure.manifestationsRepository,
    infrastructure.usersRepository,
  )
  return new CancelManifestationController(useCase, new ZodValidator(cancelSchema))
}

export function makeGetAdminManifestationDetailsController(): GetAdminManifestationDetailsController {
  const useCase = new GetAdminManifestationDetailsUseCase(
    infrastructure.manifestationsRepository,
    infrastructure.usersRepository,
  )
  return new GetAdminManifestationDetailsController(useCase)
}

export function makeListAdminManifestationsController(): ListAdminManifestationsController {
  const useCase = new ListAdminManifestationsUseCase(
    infrastructure.manifestationsRepository,
    infrastructure.usersRepository,
  )
  return new ListAdminManifestationsController(useCase)
}

export function makeGetAdminManifestationMetricsController(): GetAdminManifestationMetricsController {
  const useCase = new GetAdminManifestationMetricsUseCase(
    infrastructure.manifestationsRepository,
    infrastructure.usersRepository,
  )
  return new GetAdminManifestationMetricsController(useCase)
}

export function makeGetAdminManifestationAttachmentDownloadUrlController(): GetAdminManifestationAttachmentDownloadUrlController {
  const useCase = new GetAdminManifestationAttachmentDownloadUrlUseCase(
    infrastructure.usersRepository,
    infrastructure.manifestationsRepository,
    infrastructure.manifestationAttachmentsRepository,
    infrastructure.attachmentStorage,
    env.SUPABASE_SIGNED_URL_EXPIRES_IN_SECONDS,
  )
  return new GetAdminManifestationAttachmentDownloadUrlController(useCase)
}
