import type { ManifestationMessageDTO } from '#src/application/dto/manifestation-query-dtos.js'
import type { ManifestationInteractionsRepository } from '#src/application/repositories/manifestation-interactions-repository.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { ManifestationMessage } from '#src/domain/entities/manifestation-message.js'
import { UserRole } from '#src/domain/entities/user.js'
import { ManifestationMessageContent } from '#src/domain/value-objects/manifestation-message-content.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

import { ManifestationNotFoundError } from '../manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToManageManifestationError } from '../manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import type { UseCase } from '../use-case.js'

interface AnswerManifestationInput {
  requesterUserId: string
  manifestationId: string
  content: string
}

interface AnswerManifestationOutput {
  message: ManifestationMessageDTO
}

export class AnswerManifestationUseCase implements UseCase<AnswerManifestationInput, AnswerManifestationOutput> {
  constructor(
    private readonly manifestationsRepository: ManifestationsRepository,
    private readonly manifestationInteractionsRepository: ManifestationInteractionsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute({
    requesterUserId,
    manifestationId,
    content,
  }: AnswerManifestationInput): Promise<AnswerManifestationOutput> {
    const normalizedContent = ManifestationMessageContent.create(content)
    const senderUserId = new UniqueEntityId(requesterUserId)
    const targetManifestationId = new UniqueEntityId(manifestationId)

    const requester = await this.usersRepository.findById(requesterUserId)

    if (!requester || (requester.role !== UserRole.OMBUDSMAN && requester.role !== UserRole.ADMIN)) {
      throw new NotAllowedToManageManifestationError()
    }

    const manifestation = await this.manifestationsRepository.findById(manifestationId)

    if (!manifestation) {
      throw new ManifestationNotFoundError()
    }

    manifestation.recordAdministrativeAnswer()

    await this.manifestationsRepository.save(manifestation)

    const message = await this.manifestationInteractionsRepository.addMessage(
      ManifestationMessage.create({
        manifestationId: targetManifestationId,
        senderUserId,
        content: normalizedContent,
      }),
    )

    return { message }
  }
}
