import { z, type ZodType } from 'zod'

import { AnswerManifestationUseCase } from '#src/application/use-cases/answer-manifestation/answer-manifestation-use-case.js'
import { GetAdminManifestationDetailsUseCase } from '#src/application/use-cases/get-admin-manifestation-details/get-admin-manifestation-details-use-case.js'
import { ListAdminManifestationsUseCase } from '#src/application/use-cases/list-admin-manifestations/list-admin-manifestations-use-case.js'
import { UpdateManifestationStatusUseCase } from '#src/application/use-cases/update-manifestation-status/update-manifestation-status-use-case.js'
import { ManifestationStatus } from '#src/domain/entities/manifestation.js'
import { ZodValidator } from '#src/infra/http/fastify/validators/zod-validator.js'
import { AnswerManifestationController } from '#src/presentation/controllers/admin/answer-manifestation.controller.js'
import { GetAdminManifestationDetailsController } from '#src/presentation/controllers/admin/get-admin-manifestation-details.controller.js'
import { ListAdminManifestationsController } from '#src/presentation/controllers/admin/list-admin-manifestations.controller.js'
import { UpdateManifestationStatusController } from '#src/presentation/controllers/admin/update-manifestation-status.controller.js'

import { infrastructure } from '../infrastructure.js'

const answerSchema = z.object({ content: z.string() })
const updateStatusSchema = z.object({
  status: z.enum(Object.values(ManifestationStatus) as [string, ...string[]]),
}) as unknown as ZodType<{ status: ManifestationStatus }>

export function makeAnswerManifestationController(): AnswerManifestationController {
  const useCase = new AnswerManifestationUseCase(
    infrastructure.manifestationsRepository,
    infrastructure.manifestationAdministrationRepository,
    infrastructure.usersRepository,
  )
  return new AnswerManifestationController(useCase, new ZodValidator(answerSchema))
}

export function makeUpdateManifestationStatusController(): UpdateManifestationStatusController {
  const useCase = new UpdateManifestationStatusUseCase(
    infrastructure.manifestationAdministrationRepository,
    infrastructure.manifestationsRepository,
    infrastructure.usersRepository,
  )
  return new UpdateManifestationStatusController(useCase, new ZodValidator(updateStatusSchema))
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
