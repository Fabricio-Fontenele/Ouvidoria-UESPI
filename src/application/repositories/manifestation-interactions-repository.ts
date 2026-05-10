import type { ManifestationMessageDTO } from '#src/application/dto/manifestation-query-dtos.js'

export interface AddManifestationMessageParams {
  manifestationId: string
  senderUserId: string
  content: string
}

export interface ManifestationInteractionsRepository {
  addMessage(params: AddManifestationMessageParams): Promise<ManifestationMessageDTO>
}
