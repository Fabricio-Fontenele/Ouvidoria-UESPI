import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { HashComparer } from '#src/application/cryptography/hash-comparer.js'
import type { ManifestationMessageDTO } from '#src/application/dto/manifestation-query-dtos.js'
import type { ManifestationInteractionsRepository } from '#src/application/repositories/manifestation-interactions-repository.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import { AddTrackedManifestationMessageUseCase } from '#src/application/use-cases/add-tracked-manifestation-message/add-tracked-manifestation-message-use-case.js'
import { ManifestationTrackingNotFoundError } from '#src/application/use-cases/anonymous-manifestation-access/errors/manifestation-tracking-not-found-error.js'
import { ManifestationInteractionNotAllowedError } from '#src/application/use-cases/manifestation-messaging/errors/manifestation-interaction-not-allowed-error.js'
import { ManifestationMessage, ManifestationMessageSenderType } from '#src/domain/entities/manifestation-message.js'
import { Manifestation, ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import { AdministrativeUnitId } from '#src/domain/value-objects/administrative-unit-id.js'
import { CampusId } from '#src/domain/value-objects/campus-id.js'
import { ManifestationDescription } from '#src/domain/value-objects/manifestation-description.js'
import { InvalidManifestationMessageContentError } from '#src/domain/value-objects/manifestation-message-content.js'
import { Protocol } from '#src/domain/value-objects/protocol.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

describe('AddTrackedManifestationMessageUseCase', () => {
  let manifestationsRepository: DeepMockProxy<ManifestationsRepository>
  let manifestationInteractionsRepository: DeepMockProxy<ManifestationInteractionsRepository>
  let hashComparer: DeepMockProxy<HashComparer>
  let sut: AddTrackedManifestationMessageUseCase

  const buildAnonymousManifestation = (status: ManifestationStatus): Manifestation =>
    Manifestation.restore(
      {
        protocol: Protocol.create('OUV-2026-K7F9Q2'),
        type: ManifestationType.COMPLAINT,
        status,
        campusId: CampusId.create('campus-1'),
        administrativeUnitId: AdministrativeUnitId.create('unit-1'),
        description: ManifestationDescription.create('The service was unavailable during the whole morning.'),
        involvedPeople: null,
        authorUserId: null,
        attendantUserId: null,
        accessCodeHash: 'hashed-access-code',
        createdAt: new Date('2026-05-10T12:00:00.000Z'),
      },
      new UniqueEntityId('manifestation-1'),
    )

  const persistedMessage: ManifestationMessageDTO = {
    id: 'message-1',
    senderUserId: null,
    senderType: ManifestationMessageSenderType.ANONYMOUS_MANIFESTANT,
    content: 'Can you share an update?',
    createdAt: new Date('2026-05-10T15:00:00.000Z'),
  }

  beforeEach(() => {
    manifestationsRepository = mockDeep<ManifestationsRepository>()
    manifestationInteractionsRepository = mockDeep<ManifestationInteractionsRepository>()
    hashComparer = mockDeep<HashComparer>()

    mockReset(manifestationsRepository)
    mockReset(manifestationInteractionsRepository)
    mockReset(hashComparer)

    sut = new AddTrackedManifestationMessageUseCase(
      manifestationsRepository,
      manifestationInteractionsRepository,
      hashComparer,
    )
  })

  it('persists an anonymous message and returns it without the internal sender id', async () => {
    manifestationsRepository.findByProtocol.mockResolvedValue(
      buildAnonymousManifestation(ManifestationStatus.IN_ANALYSIS),
    )
    manifestationInteractionsRepository.addMessage.mockResolvedValue(persistedMessage)
    hashComparer.compare.mockResolvedValue(true)

    const result = await sut.execute({
      protocol: 'OUV-2026-K7F9Q2',
      accessCode: 'plain-access-code',
      content: '  Can you share an update?  ',
    })

    const savedMessage = (
      manifestationInteractionsRepository.addMessage.mock.calls[0] as [ManifestationMessage] | undefined
    )?.[0]

    expect(savedMessage).toBeInstanceOf(ManifestationMessage)
    expect(savedMessage?.manifestationId.toValue()).toBe('manifestation-1')
    expect(savedMessage?.senderUserId).toBeNull()
    expect(savedMessage?.senderType).toBe(ManifestationMessageSenderType.ANONYMOUS_MANIFESTANT)
    expect(savedMessage?.content.getValue()).toBe('Can you share an update?')
    expect(result).toStrictEqual({
      message: {
        id: persistedMessage.id,
        senderType: persistedMessage.senderType,
        content: persistedMessage.content,
        createdAt: persistedMessage.createdAt,
      },
    })
  })

  it('rejects invalid message content before touching dependencies', async () => {
    await expect(
      sut.execute({ protocol: 'OUV-2026-K7F9Q2', accessCode: 'plain-access-code', content: '   ' }),
    ).rejects.toBeInstanceOf(InvalidManifestationMessageContentError)

    expect(manifestationsRepository.findByProtocol.mock.calls).toHaveLength(0)
    expect(manifestationInteractionsRepository.addMessage.mock.calls).toHaveLength(0)
  })

  it('throws the generic tracking error when the protocol is unknown', async () => {
    manifestationsRepository.findByProtocol.mockResolvedValue(null)

    await expect(
      sut.execute({ protocol: 'OUV-2026-UNKNOWN', accessCode: 'plain-access-code', content: 'Hello there.' }),
    ).rejects.toBeInstanceOf(ManifestationTrackingNotFoundError)

    expect(manifestationInteractionsRepository.addMessage.mock.calls).toHaveLength(0)
  })

  it('throws the generic tracking error when the access code does not match', async () => {
    manifestationsRepository.findByProtocol.mockResolvedValue(
      buildAnonymousManifestation(ManifestationStatus.IN_ANALYSIS),
    )
    hashComparer.compare.mockResolvedValue(false)

    await expect(
      sut.execute({ protocol: 'OUV-2026-K7F9Q2', accessCode: 'wrong-code', content: 'Hello there.' }),
    ).rejects.toBeInstanceOf(ManifestationTrackingNotFoundError)

    expect(manifestationInteractionsRepository.addMessage.mock.calls).toHaveLength(0)
  })

  it('throws when the manifestation is closed for interaction', async () => {
    manifestationsRepository.findByProtocol.mockResolvedValue(
      buildAnonymousManifestation(ManifestationStatus.FINALIZED),
    )
    hashComparer.compare.mockResolvedValue(true)

    await expect(
      sut.execute({ protocol: 'OUV-2026-K7F9Q2', accessCode: 'plain-access-code', content: 'Hello there.' }),
    ).rejects.toBeInstanceOf(ManifestationInteractionNotAllowedError)

    expect(manifestationInteractionsRepository.addMessage.mock.calls).toHaveLength(0)
  })
})
