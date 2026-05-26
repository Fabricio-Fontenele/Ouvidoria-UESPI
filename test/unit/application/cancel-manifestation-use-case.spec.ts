import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { ManifestationAdministrationRepository } from '#src/application/repositories/manifestation-administration-repository.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { CancelManifestationUseCase } from '#src/application/use-cases/cancel-manifestation/cancel-manifestation-use-case.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToManageManifestationError } from '#src/application/use-cases/manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import { ManifestationMessageSenderType } from '#src/domain/entities/manifestation-message.js'
import {
  CancellationReasonRequiresNoteError,
  Manifestation,
  ManifestationCancellationReason,
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

describe('CancelManifestationUseCase', () => {
  let manifestationAdministrationRepository: DeepMockProxy<ManifestationAdministrationRepository>
  let manifestationsRepository: DeepMockProxy<ManifestationsRepository>
  let usersRepository: DeepMockProxy<UsersRepository>
  let sut: CancelManifestationUseCase

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
        attendantUserId: null,
        accessCodeHash: null,
        createdAt: new Date('2026-05-10T12:00:00.000Z'),
      },
      new UniqueEntityId('manifestation-1'),
    )

  beforeEach(() => {
    manifestationAdministrationRepository = mockDeep<ManifestationAdministrationRepository>()
    manifestationsRepository = mockDeep<ManifestationsRepository>()
    usersRepository = mockDeep<UsersRepository>()

    mockReset(manifestationAdministrationRepository)
    mockReset(manifestationsRepository)
    mockReset(usersRepository)

    sut = new CancelManifestationUseCase(
      manifestationAdministrationRepository,
      manifestationsRepository,
      usersRepository,
    )
  })

  it('cancels an answered manifestation with a reason and persists the audit entry', async () => {
    const manifestation = buildManifestation(ManifestationStatus.ANSWERED)

    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findById.mockResolvedValue(manifestation)

    const result = await sut.execute({
      requesterUserId: 'ombudsman-1',
      manifestationId: 'manifestation-1',
      reason: ManifestationCancellationReason.DUPLICATE,
      note: null,
    })

    expect(manifestation.status).toBe(ManifestationStatus.CANCELED)
    expect(manifestationsRepository.save.mock.calls).toHaveLength(0)
    expect(manifestationAdministrationRepository.cancel.mock.calls).toStrictEqual([
      [
        {
          manifestation,
          actorUserId: 'ombudsman-1',
          actorType: ManifestationMessageSenderType.OMBUDSMAN,
          fromStatus: ManifestationStatus.ANSWERED,
          toStatus: ManifestationStatus.CANCELED,
          reason: ManifestationCancellationReason.DUPLICATE,
          note: null,
        },
      ],
    ])
    expect(result.manifestation.status).toBe(ManifestationStatus.CANCELED)
    expect(result.manifestation.id).toBe('manifestation-1')
  })

  it('records the admin actor type for admin requesters', async () => {
    const manifestation = buildManifestation(ManifestationStatus.IN_ANALYSIS)

    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.ADMIN, 'admin-1'))
    manifestationsRepository.findById.mockResolvedValue(manifestation)

    await sut.execute({
      requesterUserId: 'admin-1',
      manifestationId: 'manifestation-1',
      reason: ManifestationCancellationReason.OTHER,
      note: 'Closed via in-person request.',
    })

    expect(manifestationAdministrationRepository.cancel.mock.calls[0]?.[0].actorType).toBe(
      ManifestationMessageSenderType.ADMIN,
    )
    expect(manifestationAdministrationRepository.cancel.mock.calls[0]?.[0].note).toBe('Closed via in-person request.')
  })

  it('rejects requesters without administrative role', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.MANIFESTANT, 'user-1'))

    await expect(
      sut.execute({
        requesterUserId: 'user-1',
        manifestationId: 'manifestation-1',
        reason: ManifestationCancellationReason.DUPLICATE,
        note: null,
      }),
    ).rejects.toBeInstanceOf(NotAllowedToManageManifestationError)

    expect(manifestationsRepository.findById.mock.calls).toHaveLength(0)
    expect(manifestationAdministrationRepository.cancel.mock.calls).toHaveLength(0)
  })

  it('throws when the manifestation does not exist', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findById.mockResolvedValue(null)

    await expect(
      sut.execute({
        requesterUserId: 'ombudsman-1',
        manifestationId: 'missing-manifestation',
        reason: ManifestationCancellationReason.DUPLICATE,
        note: null,
      }),
    ).rejects.toBeInstanceOf(ManifestationNotFoundError)
  })

  it('refuses to cancel a terminal manifestation', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findById.mockResolvedValue(buildManifestation(ManifestationStatus.FINALIZED))

    await expect(
      sut.execute({
        requesterUserId: 'ombudsman-1',
        manifestationId: 'manifestation-1',
        reason: ManifestationCancellationReason.DUPLICATE,
        note: null,
      }),
    ).rejects.toBeInstanceOf(ManifestationStatusTransitionNotAllowedError)

    expect(manifestationAdministrationRepository.cancel.mock.calls).toHaveLength(0)
  })

  it('requires a note for the "other" reason before reaching the repository', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findById.mockResolvedValue(buildManifestation(ManifestationStatus.IN_ANALYSIS))

    await expect(
      sut.execute({
        requesterUserId: 'ombudsman-1',
        manifestationId: 'manifestation-1',
        reason: ManifestationCancellationReason.OTHER,
        note: null,
      }),
    ).rejects.toBeInstanceOf(CancellationReasonRequiresNoteError)

    expect(manifestationAdministrationRepository.cancel.mock.calls).toHaveLength(0)
  })

  it('propagates administrative persistence failures', async () => {
    const saveError = new Error('save failed')

    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findById.mockResolvedValue(buildManifestation(ManifestationStatus.IN_ANALYSIS))
    manifestationAdministrationRepository.cancel.mockRejectedValue(saveError)

    await expect(
      sut.execute({
        requesterUserId: 'ombudsman-1',
        manifestationId: 'manifestation-1',
        reason: ManifestationCancellationReason.DUPLICATE,
        note: null,
      }),
    ).rejects.toThrow(saveError)
  })
})
