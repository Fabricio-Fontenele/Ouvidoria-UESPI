import type { ManifestationMessageDTO } from '#src/application/dto/manifestation-query-dtos.js'
import type {
  ManifestationMessage,
  ManifestationMessageSenderType,
} from '#src/domain/entities/manifestation-message.js'
import type { Manifestation, ManifestationStatus } from '#src/domain/entities/manifestation.js'

interface RecordManifestationAnswerParams {
  manifestation: Manifestation
  message: ManifestationMessage
  fromStatus: ManifestationStatus
  toStatus: ManifestationStatus
}

interface UpdateManifestationStatusParams {
  manifestation: Manifestation
  actorUserId: string
  actorType: ManifestationMessageSenderType
  fromStatus: ManifestationStatus
  toStatus: ManifestationStatus
}

interface FinalizeManifestationByAuthorParams {
  manifestation: Manifestation
  actorUserId: string
  actorType: ManifestationMessageSenderType
  fromStatus: ManifestationStatus
  toStatus: ManifestationStatus
}

interface ForwardManifestationToUnitParams {
  manifestation: Manifestation
  actorUserId: string
  actorType: ManifestationMessageSenderType
  forwardedToUnitName: string
  fromStatus: ManifestationStatus
  toStatus: ManifestationStatus
}

export interface ManifestationAdministrationRepository {
  recordAnswer(params: RecordManifestationAnswerParams): Promise<ManifestationMessageDTO>
  updateStatus(params: UpdateManifestationStatusParams): Promise<void>
  finalizeByAuthor(params: FinalizeManifestationByAuthorParams): Promise<void>
  forwardToUnit(params: ForwardManifestationToUnitParams): Promise<void>
}
