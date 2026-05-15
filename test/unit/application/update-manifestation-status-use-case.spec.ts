import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToManageManifestationError } from '#src/application/use-cases/manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import { UpdateManifestationStatusUseCase } from '#src/application/use-cases/update-manifestation-status/update-manifestation-status-use-case.js'
import {
  Manifestation,
  ManifestationStatus,
  ManifestationStatusTransitionNotAllowedError,
  ManifestationType,
} from '#src/domain/entities/manifestation.js'
import { User, UserRole } from '#src/domain/entities/user.js'
import { AdministrativeUnitId } from '#src/domain/value-objects/administrative-unit-id.js'
import { CampusId } from '#src/domain/value-objects/campus-id.js'
import { Email } from '#src/domain/value-objects/email.js'
import { ManifestationDescription } from '#src/domain/value-objects/manifestation-description.js'
import { Name } from '#src/domain/value-objects/name.js'
import { Protocol } from '#src/domain/value-objects/protocol.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

describe('UpdateManifestationStatusUseCase', () => {
  let manifestationsRepository: DeepMockProxy<ManifestationsRepository>
  let usersRepository: DeepMockProxy<UsersRepository>
  let sut: UpdateManifestationStatusUseCase

  const buildRequester = (role: UserRole, id = 'ombudsman-1'): User =>
    User.create(
      {
        name: Name.create('Ombudsman User'),
        email: Email.create('ombudsman@example.com'),
        passwordHash: 'hashed-password',
        role,
        createdAt: new Date('2026-05-10T10:00:00.000Z'),
      },
      new UniqueEntityId(id),
    )

  const buildManifestation = (status: ManifestationStatus): Manifestation =>
    Manifestation.restore(
      {
        protocol: Protocol.create('2026-0001'),
        type: ManifestationType.COMPLAINT,
        status,
        campusId: CampusId.create('campus-1'),
        administrativeUnitId: AdministrativeUnitId.create('unit-1'),
        description: ManifestationDescription.create('The service was unavailable during the whole morning.'),
        involvedPeople: null,
        authorUserId: new UniqueEntityId('user-1'),
        accessCodeHash: null,
        createdAt: new Date('2026-05-10T12:00:00.000Z'),
      },
      new UniqueEntityId('manifestation-1'),
    )

  beforeEach(() => {
    manifestationsRepository = mockDeep<ManifestationsRepository>()
    usersRepository = mockDeep<UsersRepository>()

    mockReset(manifestationsRepository)
    mockReset(usersRepository)

    sut = new UpdateManifestationStatusUseCase(manifestationsRepository, usersRepository)
  })

  it('finalizes an open manifestation administratively', async () => {
    const manifestation = buildManifestation(ManifestationStatus.ANSWERED)

    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findById.mockResolvedValue(manifestation)

    const result = await sut.execute({
      requesterUserId: 'ombudsman-1',
      manifestationId: 'manifestation-1',
      status: ManifestationStatus.FINALIZED,
    })

    expect(manifestation.status).toBe(ManifestationStatus.FINALIZED)
    expect(manifestationsRepository.save.mock.calls).toStrictEqual([[manifestation]])
    expect(result.manifestation.status).toBe(ManifestationStatus.FINALIZED)
    expect(result.manifestation.id).toBe('manifestation-1')
    expect(result.manifestation.involvedPeople).toBeNull()
  })

  it('rejects unsupported in-analysis to finalized transitions', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findById.mockResolvedValue(buildManifestation(ManifestationStatus.IN_ANALYSIS))

    await expect(
      sut.execute({
        requesterUserId: 'ombudsman-1',
        manifestationId: 'manifestation-1',
        status: ManifestationStatus.FINALIZED,
      }),
    ).rejects.toBeInstanceOf(ManifestationStatusTransitionNotAllowedError)

    expect(manifestationsRepository.save.mock.calls).toHaveLength(0)
  })

  it('rejects requesters without administrative role', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.PROTESTER, 'user-1'))

    await expect(
      sut.execute({
        requesterUserId: 'user-1',
        manifestationId: 'manifestation-1',
        status: ManifestationStatus.FINALIZED,
      }),
    ).rejects.toBeInstanceOf(NotAllowedToManageManifestationError)

    expect(manifestationsRepository.findById.mock.calls).toHaveLength(0)
  })

  it('throws when the manifestation does not exist', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findById.mockResolvedValue(null)

    await expect(
      sut.execute({
        requesterUserId: 'ombudsman-1',
        manifestationId: 'missing-manifestation',
        status: ManifestationStatus.FINALIZED,
      }),
    ).rejects.toBeInstanceOf(ManifestationNotFoundError)
  })

  it('throws when the target status equals the current status', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findById.mockResolvedValue(buildManifestation(ManifestationStatus.IN_ANALYSIS))

    await expect(
      sut.execute({
        requesterUserId: 'ombudsman-1',
        manifestationId: 'manifestation-1',
        status: ManifestationStatus.IN_ANALYSIS,
      }),
    ).rejects.toBeInstanceOf(ManifestationStatusTransitionNotAllowedError)

    expect(manifestationsRepository.save.mock.calls).toHaveLength(0)
  })

  it('throws when transitioning from a terminal status', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findById.mockResolvedValue(buildManifestation(ManifestationStatus.CANCELED))

    await expect(
      sut.execute({
        requesterUserId: 'ombudsman-1',
        manifestationId: 'manifestation-1',
        status: ManifestationStatus.IN_ANALYSIS,
      }),
    ).rejects.toBeInstanceOf(ManifestationStatusTransitionNotAllowedError)

    expect(manifestationsRepository.save.mock.calls).toHaveLength(0)
  })

  it('propagates save failures', async () => {
    const saveError = new Error('save failed')

    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findById.mockResolvedValue(buildManifestation(ManifestationStatus.IN_ANALYSIS))
    manifestationsRepository.save.mockRejectedValue(saveError)

    await expect(
      sut.execute({
        requesterUserId: 'ombudsman-1',
        manifestationId: 'manifestation-1',
        status: ManifestationStatus.ANSWERED,
      }),
    ).rejects.toThrow(saveError)
  })
})
