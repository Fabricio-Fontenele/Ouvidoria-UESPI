import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { ManifestationDetailsDTO } from '#src/application/dto/manifestation-query-dtos.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import { GetManifestationDetailsUseCase } from '#src/application/use-cases/get-manifestation-details/get-manifestation-details-use-case.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToAccessManifestationError } from '#src/application/use-cases/manifestation-access/errors/not-allowed-to-access-manifestation-error.js'
import { ManifestationMessageSenderType } from '#src/domain/entities/manifestation-message.js'
import { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'

describe('GetManifestationDetailsUseCase', () => {
  let manifestationsRepository: DeepMockProxy<ManifestationsRepository>
  let sut: GetManifestationDetailsUseCase

  const buildManifestationDetails = (authorUserId: string | null): ManifestationDetailsDTO => ({
    id: 'manifestation-1',
    protocol: '2026-0001',
    type: ManifestationType.COMPLAINT,
    status: ManifestationStatus.IN_ANALYSIS,
    campusId: 'campus-1',
    administrativeUnitId: 'unit-1',
    description: 'The service was unavailable during the whole morning.',
    involvedPeople: 'Coordination Team',
    authorUserId,
    createdAt: new Date('2026-05-10T12:00:00.000Z'),
    history: [
      {
        type: 'registered',
        description: 'Manifestation registered.',
        actorUserId: 'user-1',
        actorType: ManifestationMessageSenderType.MANIFESTANT,
        fromStatus: null,
        toStatus: ManifestationStatus.IN_ANALYSIS,
        createdAt: new Date('2026-05-10T12:00:00.000Z'),
      },
      {
        type: 'administrative_answered',
        description: 'Administrative answer recorded.',
        actorUserId: 'ombudsman-1',
        actorType: ManifestationMessageSenderType.OMBUDSMAN,
        fromStatus: ManifestationStatus.IN_ANALYSIS,
        toStatus: ManifestationStatus.ANSWERED,
        createdAt: new Date('2026-05-10T14:00:00.000Z'),
      },
    ],
    messages: [
      {
        id: 'message-1',
        senderUserId: 'ombudsman-1',
        senderType: ManifestationMessageSenderType.OMBUDSMAN,
        content: 'We are analyzing your report.',
        createdAt: new Date('2026-05-10T15:00:00.000Z'),
      },
    ],
  })

  beforeEach(() => {
    manifestationsRepository = mockDeep<ManifestationsRepository>()

    mockReset(manifestationsRepository)

    sut = new GetManifestationDetailsUseCase(manifestationsRepository)
  })

  it('returns the manifestation details when it belongs to the user', async () => {
    const manifestationDetails = buildManifestationDetails('user-1')

    manifestationsRepository.findDetailsById.mockResolvedValue(manifestationDetails)

    const result = await sut.execute({
      manifestationId: 'manifestation-1',
      userId: 'user-1',
    })

    expect(manifestationsRepository.findDetailsById.mock.calls).toStrictEqual([['manifestation-1']])
    expect(result).toStrictEqual({
      manifestation: {
        id: 'manifestation-1',
        protocol: '2026-0001',
        type: ManifestationType.COMPLAINT,
        status: ManifestationStatus.IN_ANALYSIS,
        campusId: 'campus-1',
        administrativeUnitId: 'unit-1',
        description: 'The service was unavailable during the whole morning.',
        involvedPeople: 'Coordination Team',
        createdAt: new Date('2026-05-10T12:00:00.000Z'),
        history: manifestationDetails.history,
        messages: manifestationDetails.messages,
      },
    })
  })

  it('throws when the manifestation does not exist', async () => {
    manifestationsRepository.findDetailsById.mockResolvedValue(null)

    await expect(
      sut.execute({
        manifestationId: 'missing-manifestation',
        userId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(ManifestationNotFoundError)
  })

  it('throws when the manifestation belongs to another user', async () => {
    manifestationsRepository.findDetailsById.mockResolvedValue(buildManifestationDetails('user-2'))

    await expect(
      sut.execute({
        manifestationId: 'manifestation-1',
        userId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(NotAllowedToAccessManifestationError)
  })

  it('throws when the manifestation is anonymous', async () => {
    manifestationsRepository.findDetailsById.mockResolvedValue(buildManifestationDetails(null))

    await expect(
      sut.execute({
        manifestationId: 'manifestation-1',
        userId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(NotAllowedToAccessManifestationError)
  })

  it('propagates repository failures', async () => {
    const repositoryError = new Error('repository failed')

    manifestationsRepository.findDetailsById.mockRejectedValue(repositoryError)

    await expect(
      sut.execute({
        manifestationId: 'manifestation-1',
        userId: 'user-1',
      }),
    ).rejects.toThrow(repositoryError)
  })
})
