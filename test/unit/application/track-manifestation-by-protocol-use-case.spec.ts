import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { HashComparer } from '#src/application/cryptography/hash-comparer.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import { ManifestationTrackingNotFoundError } from '#src/application/use-cases/track-manifestation-by-protocol/errors/manifestation-tracking-not-found-error.js'
import { TrackManifestationByProtocolUseCase } from '#src/application/use-cases/track-manifestation-by-protocol/track-manifestation-by-protocol-use-case.js'
import { Manifestation, ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import { AdministrativeUnitId } from '#src/domain/value-objects/administrative-unit-id.js'
import { CampusId } from '#src/domain/value-objects/campus-id.js'
import { ManifestationDescription } from '#src/domain/value-objects/manifestation-description.js'
import { Protocol } from '#src/domain/value-objects/protocol.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

describe('TrackManifestationByProtocolUseCase', () => {
  let manifestationsRepository: DeepMockProxy<ManifestationsRepository>
  let hashComparer: DeepMockProxy<HashComparer>
  let sut: TrackManifestationByProtocolUseCase

  const buildAnonymousManifestation = ({
    status = ManifestationStatus.IN_ANALYSIS,
    accessCodeHash = 'hashed-access-code',
  }: {
    status?: ManifestationStatus
    accessCodeHash?: string | null
  } = {}): Manifestation =>
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
        accessCodeHash,
        createdAt: new Date('2026-05-10T12:00:00.000Z'),
      },
      new UniqueEntityId('manifestation-1'),
    )

  const buildIdentifiedManifestation = (): Manifestation =>
    Manifestation.restore(
      {
        protocol: Protocol.create('OUV-2026-K7F9Q2'),
        type: ManifestationType.COMPLAINT,
        status: ManifestationStatus.IN_ANALYSIS,
        campusId: CampusId.create('campus-1'),
        administrativeUnitId: AdministrativeUnitId.create('unit-1'),
        description: ManifestationDescription.create('The service was unavailable during the whole morning.'),
        involvedPeople: null,
        authorUserId: new UniqueEntityId('user-1'),
        attendantUserId: null,
        accessCodeHash: null,
        createdAt: new Date('2026-05-10T12:00:00.000Z'),
      },
      new UniqueEntityId('manifestation-1'),
    )

  beforeEach(() => {
    manifestationsRepository = mockDeep<ManifestationsRepository>()
    hashComparer = mockDeep<HashComparer>()

    mockReset(manifestationsRepository)
    mockReset(hashComparer)

    sut = new TrackManifestationByProtocolUseCase(manifestationsRepository, hashComparer)
  })

  it('returns the public tracking projection when the access code matches', async () => {
    manifestationsRepository.findByProtocol.mockResolvedValue(buildAnonymousManifestation())
    hashComparer.compare.mockResolvedValue(true)

    const result = await sut.execute({
      protocol: '  OUV-2026-K7F9Q2  ',
      accessCode: '  plain-access-code  ',
    })

    expect(manifestationsRepository.findByProtocol.mock.calls).toStrictEqual([['OUV-2026-K7F9Q2']])
    expect(hashComparer.compare.mock.calls).toStrictEqual([['plain-access-code', 'hashed-access-code']])
    expect(manifestationsRepository.save.mock.calls).toHaveLength(0)
    expect(result).toStrictEqual({
      manifestation: {
        protocol: 'OUV-2026-K7F9Q2',
        type: ManifestationType.COMPLAINT,
        status: ManifestationStatus.IN_ANALYSIS,
        campusId: 'campus-1',
        administrativeUnitId: 'unit-1',
        createdAt: new Date('2026-05-10T12:00:00.000Z'),
      },
    })
  })

  it('exposes only the public allow-list of fields in the output', async () => {
    manifestationsRepository.findByProtocol.mockResolvedValue(buildAnonymousManifestation())
    hashComparer.compare.mockResolvedValue(true)

    const result = await sut.execute({
      protocol: 'OUV-2026-K7F9Q2',
      accessCode: 'plain-access-code',
    })

    expect(Object.keys(result.manifestation).sort()).toStrictEqual(
      ['protocol', 'type', 'status', 'campusId', 'administrativeUnitId', 'createdAt'].sort(),
    )
  })

  it('returns tracking for terminal statuses as read-only', async () => {
    for (const status of [ManifestationStatus.ANSWERED, ManifestationStatus.FINALIZED, ManifestationStatus.CANCELED]) {
      mockReset(manifestationsRepository)
      mockReset(hashComparer)

      manifestationsRepository.findByProtocol.mockResolvedValue(buildAnonymousManifestation({ status }))
      hashComparer.compare.mockResolvedValue(true)

      const result = await sut.execute({
        protocol: 'OUV-2026-K7F9Q2',
        accessCode: 'plain-access-code',
      })

      expect(result.manifestation.status).toBe(status)
      expect(manifestationsRepository.save.mock.calls).toHaveLength(0)
    }
  })

  it('throws the generic tracking error when the protocol is unknown', async () => {
    manifestationsRepository.findByProtocol.mockResolvedValue(null)

    await expect(
      sut.execute({
        protocol: 'OUV-2026-UNKNOWN',
        accessCode: 'plain-access-code',
      }),
    ).rejects.toBeInstanceOf(ManifestationTrackingNotFoundError)

    expect(hashComparer.compare.mock.calls).toHaveLength(0)
    expect(manifestationsRepository.save.mock.calls).toHaveLength(0)
  })

  it('throws the generic tracking error when the manifestation is identified', async () => {
    manifestationsRepository.findByProtocol.mockResolvedValue(buildIdentifiedManifestation())

    await expect(
      sut.execute({
        protocol: 'OUV-2026-K7F9Q2',
        accessCode: 'plain-access-code',
      }),
    ).rejects.toBeInstanceOf(ManifestationTrackingNotFoundError)

    expect(hashComparer.compare.mock.calls).toHaveLength(0)
    expect(manifestationsRepository.save.mock.calls).toHaveLength(0)
  })

  it('throws the generic tracking error when the access code does not match', async () => {
    manifestationsRepository.findByProtocol.mockResolvedValue(buildAnonymousManifestation())
    hashComparer.compare.mockResolvedValue(false)

    await expect(
      sut.execute({
        protocol: 'OUV-2026-K7F9Q2',
        accessCode: 'wrong-code',
      }),
    ).rejects.toBeInstanceOf(ManifestationTrackingNotFoundError)

    expect(manifestationsRepository.save.mock.calls).toHaveLength(0)
  })

  it('throws the generic tracking error when the protocol is blank', async () => {
    await expect(
      sut.execute({
        protocol: '   ',
        accessCode: 'plain-access-code',
      }),
    ).rejects.toBeInstanceOf(ManifestationTrackingNotFoundError)

    expect(manifestationsRepository.findByProtocol.mock.calls).toHaveLength(0)
    expect(hashComparer.compare.mock.calls).toHaveLength(0)
  })

  it('throws the generic tracking error when the access code is blank', async () => {
    await expect(
      sut.execute({
        protocol: 'OUV-2026-K7F9Q2',
        accessCode: '   ',
      }),
    ).rejects.toBeInstanceOf(ManifestationTrackingNotFoundError)

    expect(manifestationsRepository.findByProtocol.mock.calls).toHaveLength(0)
    expect(hashComparer.compare.mock.calls).toHaveLength(0)
  })
})
