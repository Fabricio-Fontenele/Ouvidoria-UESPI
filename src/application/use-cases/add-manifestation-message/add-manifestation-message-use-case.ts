import type { ManifestationMessageDTO } from '#src/application/dto/manifestation-query-dtos.js'
import type { ManifestationInteractionsRepository } from '#src/application/repositories/manifestation-interactions-repository.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import { ManifestationMessage } from '#src/domain/entities/manifestation-message.js'
import { ManifestationStatus } from '#src/domain/entities/manifestation.js'
import { ManifestationMessageContent } from '#src/domain/value-objects/manifestation-message-content.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

import { ManifestationInteractionNotAllowedError } from './errors/manifestation-interaction-not-allowed-error.js'
import { ManifestationNotFoundError } from '../get-manifestation-details/errors/manifestation-not-found-error.js'
import { NotAllowedToAccessManifestationError } from '../get-manifestation-details/errors/not-allowed-to-access-manifestation-error.js'
import type { UseCase } from '../use-case.js'

interface AddManifestationMessageInput {
  manifestationId: string
  userId: string
  content: string
}

interface AddManifestationMessageOutput {
  message: ManifestationMessageDTO
}

export class AddManifestationMessageUseCase implements UseCase<
  AddManifestationMessageInput,
  AddManifestationMessageOutput
> {
  constructor(
    private readonly manifestationsRepository: ManifestationsRepository,
    private readonly manifestationInteractionsRepository: ManifestationInteractionsRepository,
  ) {}

  async execute({
    manifestationId,
    userId,
    content,
  }: AddManifestationMessageInput): Promise<AddManifestationMessageOutput> {
    const normalizedContent = ManifestationMessageContent.create(content)
    const manifestation = await this.manifestationsRepository.findDetailsById(manifestationId)

    if (!manifestation) {
      throw new ManifestationNotFoundError()
    }

    if (manifestation.authorUserId !== userId) {
      throw new NotAllowedToAccessManifestationError()
    }

    if (!this.isOpenForInteraction(manifestation.status)) {
      throw new ManifestationInteractionNotAllowedError()
    }

    const message = await this.manifestationInteractionsRepository.addMessage(
      ManifestationMessage.create({
        manifestationId: new UniqueEntityId(manifestationId),
        senderUserId: new UniqueEntityId(userId),
        content: normalizedContent,
      }),
    )

    return { message }
  }

  private isOpenForInteraction(status: ManifestationStatus): boolean {
    return status !== ManifestationStatus.CANCELED && status !== ManifestationStatus.FINALIZED
  }
}
