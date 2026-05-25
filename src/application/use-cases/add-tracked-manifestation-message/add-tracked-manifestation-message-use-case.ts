import type { HashComparer } from '#src/application/cryptography/hash-comparer.js'
import type { ManifestationInteractionsRepository } from '#src/application/repositories/manifestation-interactions-repository.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import { ManifestationMessage, ManifestationMessageSenderType } from '#src/domain/entities/manifestation-message.js'
import { ManifestationMessageContent } from '#src/domain/value-objects/manifestation-message-content.js'

import { AnonymousManifestationAccessService } from '../anonymous-manifestation-access/anonymous-manifestation-access-service.js'
import { ManifestationInteractionNotAllowedError } from '../manifestation-messaging/errors/manifestation-interaction-not-allowed-error.js'
import type { UseCase } from '../use-case.js'

interface AddTrackedManifestationMessageInput {
  protocol: string
  accessCode: string
  content: string
}

interface AddTrackedManifestationMessageOutput {
  message: {
    id: string
    senderType: ManifestationMessageSenderType
    content: string
    createdAt: Date
  }
}

export class AddTrackedManifestationMessageUseCase implements UseCase<
  AddTrackedManifestationMessageInput,
  AddTrackedManifestationMessageOutput
> {
  private readonly anonymousManifestationAccessService: AnonymousManifestationAccessService

  constructor(
    manifestationsRepository: ManifestationsRepository,
    private readonly manifestationInteractionsRepository: ManifestationInteractionsRepository,
    hashComparer: HashComparer,
  ) {
    this.anonymousManifestationAccessService = new AnonymousManifestationAccessService(
      manifestationsRepository,
      hashComparer,
    )
  }

  async execute({
    protocol,
    accessCode,
    content,
  }: AddTrackedManifestationMessageInput): Promise<AddTrackedManifestationMessageOutput> {
    const normalizedContent = ManifestationMessageContent.create(content)
    const manifestation = await this.anonymousManifestationAccessService.getAuthorizedManifestation({
      protocol,
      accessCode,
    })

    if (!manifestation.canReceiveMessages()) {
      throw new ManifestationInteractionNotAllowedError()
    }

    const message = await this.manifestationInteractionsRepository.addMessage(
      ManifestationMessage.create({
        manifestationId: manifestation.id,
        senderUserId: null,
        senderType: ManifestationMessageSenderType.ANONYMOUS_MANIFESTANT,
        content: normalizedContent,
      }),
    )

    return {
      message: {
        id: message.id,
        senderType: message.senderType,
        content: message.content,
        createdAt: message.createdAt,
      },
    }
  }
}
