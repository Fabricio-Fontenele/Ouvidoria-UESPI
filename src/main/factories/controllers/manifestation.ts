import { z, type ZodType } from 'zod'

import { AddManifestationMessageUseCase } from '#src/application/use-cases/add-manifestation-message/add-manifestation-message-use-case.js'
import { FinalizeManifestationUseCase } from '#src/application/use-cases/finalize-manifestation/finalize-manifestation-use-case.js'
import { GetManifestationDetailsUseCase } from '#src/application/use-cases/get-manifestation-details/get-manifestation-details-use-case.js'
import { ListUserManifestationsUseCase } from '#src/application/use-cases/list-user-manifestations/list-user-manifestations-use-case.js'
import { RegisterManifestationUseCase } from '#src/application/use-cases/register-manifestation/register-manifestation.use-case.js'
import { TrackManifestationByProtocolUseCase } from '#src/application/use-cases/track-manifestation-by-protocol/track-manifestation-by-protocol-use-case.js'
import { ManifestationType } from '#src/domain/entities/manifestation.js'
import { ZodValidator } from '#src/infra/http/fastify/validators/zod-validator.js'
import { AddManifestationMessageController } from '#src/presentation/controllers/manifestation/add-manifestation-message.controller.js'
import { FinalizeManifestationController } from '#src/presentation/controllers/manifestation/finalize-manifestation.controller.js'
import { GetManifestationDetailsController } from '#src/presentation/controllers/manifestation/get-manifestation-details.controller.js'
import { ListUserManifestationsController } from '#src/presentation/controllers/manifestation/list-user-manifestations.controller.js'
import { RegisterManifestationController } from '#src/presentation/controllers/manifestation/register-manifestation.controller.js'
import { TrackManifestationByProtocolController } from '#src/presentation/controllers/manifestation/track-manifestation-by-protocol.controller.js'

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

export function makeRegisterManifestationController(): RegisterManifestationController {
  const useCase = new RegisterManifestationUseCase(
    infrastructure.manifestationsRepository,
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

export function makeGetManifestationDetailsController(): GetManifestationDetailsController {
  const useCase = new GetManifestationDetailsUseCase(infrastructure.manifestationsRepository)
  return new GetManifestationDetailsController(useCase)
}

export function makeListUserManifestationsController(): ListUserManifestationsController {
  const useCase = new ListUserManifestationsUseCase(infrastructure.manifestationsRepository)
  return new ListUserManifestationsController(useCase)
}

export function makeTrackManifestationByProtocolController(): TrackManifestationByProtocolController {
  const useCase = new TrackManifestationByProtocolUseCase(
    infrastructure.manifestationsRepository,
    infrastructure.hashComparer,
  )
  return new TrackManifestationByProtocolController(useCase, new ZodValidator(trackByProtocolSchema))
}
