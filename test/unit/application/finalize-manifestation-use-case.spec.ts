import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import { FinalizeManifestationUseCase } from '#src/application/use-cases/finalize-manifestation/finalize-manifestation-use-case.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToAccessManifestationError } from '#src/application/use-cases/manifestation-access/errors/not-allowed-to-access-manifestation-error.js'
import {
  Manifestation,
  ManifestationStatus,
  ManifestationStatusTransitionNotAllowedError,
  ManifestationType,
} from '#src/domain/entities/manifestation.js'
import { AdministrativeUnitId } from '#src/domain/value-objects/administrative-unit-id.js'
import { CampusId } from '#src/domain/value-objects/campus-id.js'
import { ManifestationDescription } from '#src/domain/value-objects/manifestation-description.js'
import { Protocol } from '#src/domain/value-objects/protocol.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

describe('FinalizeManifestationUseCase', () => {
  let manifestationsRepository: DeepMockProxy<ManifestationsRepository>
  let sut: FinalizeManifestationUseCase

  const buildManifestation = (status: ManifestationStatus, authorUserId: string | null = 'user-1'): Manifestation =>
    Manifestation.restore(
      {
        protocol: Protocol.create('2026-0001'),
        type: ManifestationType.COMPLAINT,
        status,
        campusId: CampusId.create('campus-1'),
        administrativeUnitId: AdministrativeUnitId.create('unit-1'),
        description: ManifestationDescription.create('The service was unavailable during the whole morning.'),
        authorUserId: authorUserId === null ? null : new UniqueEntityId(authorUserId),
        createdAt: new Date('2026-05-10T12:00:00.000Z'),
      },
      new UniqueEntityId('manifestation-1'),
    )

  beforeEach(() => {
    manifestationsRepository = mockDeep<ManifestationsRepository>()

    mockReset(manifestationsRepository)

    sut = new FinalizeManifestationUseCase(manifestationsRepository)
  })

  it('finalizes an answered manifestation owned by the author', async () => {
    const manifestation = buildManifestation(ManifestationStatus.ANSWERED)

    manifestationsRepository.findById.mockResolvedValue(manifestation)

    const result = await sut.execute({
      userId: 'user-1',
      manifestationId: 'manifestation-1',
    })

    expect(manifestation.status).toBe(ManifestationStatus.FINALIZED)
    expect(manifestationsRepository.findById.mock.calls).toStrictEqual([['manifestation-1']])
    expect(manifestationsRepository.save.mock.calls).toStrictEqual([[manifestation]])
    expect(result.manifestation.status).toBe(ManifestationStatus.FINALIZED)
    expect(result.manifestation.id).toBe('manifestation-1')
    expect(result.manifestation.authorUserId).toBe('user-1')
  })

  it('throws when the manifestation does not exist', async () => {
    manifestationsRepository.findById.mockResolvedValue(null)

    await expect(
      sut.execute({
        userId: 'user-1',
        manifestationId: 'missing-manifestation',
      }),
    ).rejects.toBeInstanceOf(ManifestationNotFoundError)

    expect(manifestationsRepository.save.mock.calls).toHaveLength(0)
  })

  it('throws when the manifestation belongs to another user', async () => {
    manifestationsRepository.findById.mockResolvedValue(buildManifestation(ManifestationStatus.ANSWERED, 'user-2'))

    await expect(
      sut.execute({
        userId: 'user-1',
        manifestationId: 'manifestation-1',
      }),
    ).rejects.toBeInstanceOf(NotAllowedToAccessManifestationError)

    expect(manifestationsRepository.save.mock.calls).toHaveLength(0)
  })

  it('throws when the manifestation is anonymous', async () => {
    manifestationsRepository.findById.mockResolvedValue(buildManifestation(ManifestationStatus.ANSWERED, null))

    await expect(
      sut.execute({
        userId: 'user-1',
        manifestationId: 'manifestation-1',
      }),
    ).rejects.toBeInstanceOf(NotAllowedToAccessManifestationError)

    expect(manifestationsRepository.save.mock.calls).toHaveLength(0)
  })

  it('throws when the manifestation has not been answered yet', async () => {
    manifestationsRepository.findById.mockResolvedValue(buildManifestation(ManifestationStatus.IN_ANALYSIS))

    await expect(
      sut.execute({
        userId: 'user-1',
        manifestationId: 'manifestation-1',
      }),
    ).rejects.toBeInstanceOf(ManifestationStatusTransitionNotAllowedError)

    expect(manifestationsRepository.save.mock.calls).toHaveLength(0)
  })

  it('throws when the manifestation is already finalized', async () => {
    manifestationsRepository.findById.mockResolvedValue(buildManifestation(ManifestationStatus.FINALIZED))

    await expect(
      sut.execute({
        userId: 'user-1',
        manifestationId: 'manifestation-1',
      }),
    ).rejects.toBeInstanceOf(ManifestationStatusTransitionNotAllowedError)

    expect(manifestationsRepository.save.mock.calls).toHaveLength(0)
  })

  it('throws when the manifestation has been canceled', async () => {
    manifestationsRepository.findById.mockResolvedValue(buildManifestation(ManifestationStatus.CANCELED))

    await expect(
      sut.execute({
        userId: 'user-1',
        manifestationId: 'manifestation-1',
      }),
    ).rejects.toBeInstanceOf(ManifestationStatusTransitionNotAllowedError)

    expect(manifestationsRepository.save.mock.calls).toHaveLength(0)
  })

  it('propagates save failures after the domain transition', async () => {
    const saveError = new Error('save failed')

    manifestationsRepository.findById.mockResolvedValue(buildManifestation(ManifestationStatus.ANSWERED))
    manifestationsRepository.save.mockRejectedValue(saveError)

    await expect(
      sut.execute({
        userId: 'user-1',
        manifestationId: 'manifestation-1',
      }),
    ).rejects.toThrow(saveError)
  })
})
