import type { ManifestationMessageDTO } from '#src/application/dto/manifestation-query-dtos.js'
import type { ManifestationMessage } from '#src/domain/entities/manifestation-message.js'
import type { Manifestation } from '#src/domain/entities/manifestation.js'

export interface ManifestationAdministrationRepository {
  recordAnswer(manifestation: Manifestation, message: ManifestationMessage): Promise<ManifestationMessageDTO>
}
