import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { ManifestationDetailsDTO, ManifestationMessageDTO } from '#src/application/dto/manifestation-query-dtos.js'
import type { ManifestationInteractionsRepository } from '#src/application/repositories/manifestation-interactions-repository.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import { AddManifestationMessageUseCase } from '#src/application/use-cases/add-manifestation-message/add-manifestation-message-use-case.js'
import { ManifestationInteractionNotAllowedError } from '#src/application/use-cases/add-manifestation-message/errors/manifestation-interaction-not-allowed-error.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/get-manifestation-details/errors/manifestation-not-found-error.js'
import { NotAllowedToAccessManifestationError } from '#src/application/use-cases/get-manifestation-details/errors/not-allowed-to-access-manifestation-error.js'
import { ManifestationMessage } from '#src/domain/entities/manifestation-message.js'
import { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import { InvalidManifestationMessageContentError } from '#src/domain/value-objects/manifestation-message-content.js'

describe('AddManifestationMessageUseCase', () => {
  let manifestationsRepository: DeepMockProxy<ManifestationsRepository>
  let manifestationInteractionsRepository: DeepMockProxy<ManifestationInteractionsRepository>
  let sut: AddManifestationMessageUseCase

  const buildManifestationDetails = (
    status: ManifestationStatus,
    authorUserId: string | null,
  ): ManifestationDetailsDTO => ({
    id: 'manifestation-1',
    protocol: '2026-0001',
    type: ManifestationType.COMPLAINT,
    status,
    campusId: 'campus-1',
    administrativeUnitId: 'unit-1',
    description: 'The service was unavailable during the whole morning.',
    authorUserId,
    createdAt: new Date('2026-05-10T12:00:00.000Z'),
    history: [],
    messages: [],
  })

  const buildMessage = (): ManifestationMessageDTO => ({
    id: 'message-1',
    senderUserId: 'user-1',
    content: 'Can you share an update?',
    createdAt: new Date('2026-05-10T15:00:00.000Z'),
  })

  beforeEach(() => {
    manifestationsRepository = mockDeep<ManifestationsRepository>()
    manifestationInteractionsRepository = mockDeep<ManifestationInteractionsRepository>()

    mockReset(manifestationsRepository)
    mockReset(manifestationInteractionsRepository)

    sut = new AddManifestationMessageUseCase(manifestationsRepository, manifestationInteractionsRepository)
  })

  it('adds a message for an owned manifestation that is open for interaction', async () => {
    const message = buildMessage()

    manifestationsRepository.findDetailsById.mockResolvedValue(
      buildManifestationDetails(ManifestationStatus.IN_ANALYSIS, 'user-1'),
    )
    manifestationInteractionsRepository.addMessage.mockResolvedValue(message)

    const result = await sut.execute({
      manifestationId: 'manifestation-1',
      userId: 'user-1',
      content: '  Can you share an update?  ',
    })

    const addMessageCall = manifestationInteractionsRepository.addMessage.mock.calls[0] as
      | [ManifestationMessage]
      | undefined
    const savedMessage = addMessageCall?.[0]

    expect(manifestationsRepository.findDetailsById.mock.calls).toStrictEqual([['manifestation-1']])
    expect(manifestationInteractionsRepository.addMessage.mock.calls).toHaveLength(1)
    expect(savedMessage).toBeInstanceOf(ManifestationMessage)
    expect(savedMessage?.manifestationId.toValue()).toBe('manifestation-1')
    expect(savedMessage?.senderUserId.toValue()).toBe('user-1')
    expect(savedMessage?.content.getValue()).toBe('Can you share an update?')
    expect(result).toStrictEqual({ message })
  })

  it('rejects invalid message content before touching dependencies', async () => {
    await expect(
      sut.execute({
        manifestationId: 'manifestation-1',
        userId: 'user-1',
        content: '   ',
      }),
    ).rejects.toBeInstanceOf(InvalidManifestationMessageContentError)

    expect(manifestationsRepository.findDetailsById.mock.calls).toHaveLength(0)
    expect(manifestationInteractionsRepository.addMessage.mock.calls).toHaveLength(0)
  })

  it('throws when the manifestation does not exist', async () => {
    manifestationsRepository.findDetailsById.mockResolvedValue(null)

    await expect(
      sut.execute({
        manifestationId: 'missing-manifestation',
        userId: 'user-1',
        content: 'Can you share an update?',
      }),
    ).rejects.toBeInstanceOf(ManifestationNotFoundError)

    expect(manifestationInteractionsRepository.addMessage.mock.calls).toHaveLength(0)
  })

  it('throws when the manifestation belongs to another user', async () => {
    manifestationsRepository.findDetailsById.mockResolvedValue(
      buildManifestationDetails(ManifestationStatus.IN_ANALYSIS, 'user-2'),
    )

    await expect(
      sut.execute({
        manifestationId: 'manifestation-1',
        userId: 'user-1',
        content: 'Can you share an update?',
      }),
    ).rejects.toBeInstanceOf(NotAllowedToAccessManifestationError)

    expect(manifestationInteractionsRepository.addMessage.mock.calls).toHaveLength(0)
  })

  it('throws when the manifestation is anonymous', async () => {
    manifestationsRepository.findDetailsById.mockResolvedValue(
      buildManifestationDetails(ManifestationStatus.IN_ANALYSIS, null),
    )

    await expect(
      sut.execute({
        manifestationId: 'manifestation-1',
        userId: 'user-1',
        content: 'Can you share an update?',
      }),
    ).rejects.toBeInstanceOf(NotAllowedToAccessManifestationError)

    expect(manifestationInteractionsRepository.addMessage.mock.calls).toHaveLength(0)
  })

  it('throws when the manifestation is closed for interaction', async () => {
    manifestationsRepository.findDetailsById.mockResolvedValue(
      buildManifestationDetails(ManifestationStatus.FINALIZED, 'user-1'),
    )

    await expect(
      sut.execute({
        manifestationId: 'manifestation-1',
        userId: 'user-1',
        content: 'Can you share an update?',
      }),
    ).rejects.toBeInstanceOf(ManifestationInteractionNotAllowedError)

    expect(manifestationInteractionsRepository.addMessage.mock.calls).toHaveLength(0)
  })

  it('propagates manifestation lookup failures', async () => {
    const repositoryError = new Error('lookup failed')

    manifestationsRepository.findDetailsById.mockRejectedValue(repositoryError)

    await expect(
      sut.execute({
        manifestationId: 'manifestation-1',
        userId: 'user-1',
        content: 'Can you share an update?',
      }),
    ).rejects.toThrow(repositoryError)

    expect(manifestationInteractionsRepository.addMessage.mock.calls).toHaveLength(0)
  })

  it('propagates interaction repository failures after validation', async () => {
    const repositoryError = new Error('message failed')

    manifestationsRepository.findDetailsById.mockResolvedValue(
      buildManifestationDetails(ManifestationStatus.ANSWERED, 'user-1'),
    )
    manifestationInteractionsRepository.addMessage.mockRejectedValue(repositoryError)

    await expect(
      sut.execute({
        manifestationId: 'manifestation-1',
        userId: 'user-1',
        content: 'Can you share an update?',
      }),
    ).rejects.toThrow(repositoryError)

    const addMessageCall = manifestationInteractionsRepository.addMessage.mock.calls[0] as
      | [ManifestationMessage]
      | undefined
    const savedMessage = addMessageCall?.[0]

    expect(manifestationInteractionsRepository.addMessage.mock.calls).toHaveLength(1)
    expect(savedMessage).toBeInstanceOf(ManifestationMessage)
    expect(savedMessage?.manifestationId.toValue()).toBe('manifestation-1')
    expect(savedMessage?.senderUserId.toValue()).toBe('user-1')
    expect(savedMessage?.content.getValue()).toBe('Can you share an update?')
  })
})
