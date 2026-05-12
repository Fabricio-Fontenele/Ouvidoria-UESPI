import type { ManifestationMessageDTO } from '#src/application/dto/manifestation-query-dtos.js'
import type { ManifestationMessage } from '#src/domain/entities/manifestation-message.js'

export interface ManifestationInteractionsRepository {
  addMessage(message: ManifestationMessage): Promise<ManifestationMessageDTO>
}
