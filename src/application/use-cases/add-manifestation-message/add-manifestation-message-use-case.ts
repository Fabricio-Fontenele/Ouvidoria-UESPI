import type { ManifestationMessageDTO } from '#src/application/dto/manifestation-query-dtos.js'
import type { ManifestationInteractionsRepository } from '#src/application/repositories/manifestation-interactions-repository.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToAccessManifestationError } from '#src/application/use-cases/manifestation-access/errors/not-allowed-to-access-manifestation-error.js'
import { ManifestationMessage, ManifestationMessageSenderType } from '#src/domain/entities/manifestation-message.js'
import { ManifestationMessageContent } from '#src/domain/value-objects/manifestation-message-content.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

import { ManifestationInteractionNotAllowedError } from '../manifestation-messaging/errors/manifestation-interaction-not-allowed-error.js'
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
    const senderUserId = new UniqueEntityId(userId)
    const targetManifestationId = new UniqueEntityId(manifestationId)
    const manifestation = await this.manifestationsRepository.findById(manifestationId)

    if (!manifestation) {
      throw new ManifestationNotFoundError()
    }

    if (!manifestation.belongsTo(senderUserId)) {
      throw new NotAllowedToAccessManifestationError()
    }

    if (!manifestation.canReceiveMessages()) {
      throw new ManifestationInteractionNotAllowedError()
    }

    const message = await this.manifestationInteractionsRepository.addMessage(
      ManifestationMessage.create({
        manifestationId: targetManifestationId,
        senderUserId,
        senderType: ManifestationMessageSenderType.MANIFESTANT,
        content: normalizedContent,
      }),
    )

    return { message }
  }
}
