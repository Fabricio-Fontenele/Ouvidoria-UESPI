import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { CatalogRepository } from '#src/application/repositories/catalog-repository.js'
import type { ManifestationAdministrationRepository } from '#src/application/repositories/manifestation-administration-repository.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { ForwardTargetUnitInactiveError } from '#src/application/use-cases/forward-manifestation-to-unit/errors/forward-target-unit-inactive-error.js'
import { ForwardTargetUnitNotFoundError } from '#src/application/use-cases/forward-manifestation-to-unit/errors/forward-target-unit-not-found-error.js'
import { ForwardManifestationToUnitUseCase } from '#src/application/use-cases/forward-manifestation-to-unit/forward-manifestation-to-unit-use-case.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToManageManifestationError } from '#src/application/use-cases/manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import { ManifestationMessageSenderType } from '#src/domain/entities/manifestation-message.js'
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

describe('ForwardManifestationToUnitUseCase', () => {
  let manifestationsRepository: DeepMockProxy<ManifestationsRepository>
  let manifestationAdministrationRepository: DeepMockProxy<ManifestationAdministrationRepository>
  let usersRepository: DeepMockProxy<UsersRepository>
  let catalogRepository: DeepMockProxy<CatalogRepository>
  let sut: ForwardManifestationToUnitUseCase

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

  const activeUnit = {
    id: 'unit-2',
    name: 'Coordenação de TI',
    description: null,
    campusId: 'campus-1',
    isActive: true,
  }

  beforeEach(() => {
    manifestationsRepository = mockDeep<ManifestationsRepository>()
    manifestationAdministrationRepository = mockDeep<ManifestationAdministrationRepository>()
    usersRepository = mockDeep<UsersRepository>()
    catalogRepository = mockDeep<CatalogRepository>()

    mockReset(manifestationsRepository)
    mockReset(manifestationAdministrationRepository)
    mockReset(usersRepository)
    mockReset(catalogRepository)

    sut = new ForwardManifestationToUnitUseCase(
      manifestationsRepository,
      manifestationAdministrationRepository,
      usersRepository,
      catalogRepository,
    )
  })

  it('forwards an in-analysis manifestation to the chosen unit and assigns the attendant', async () => {
    const manifestation = buildManifestation(ManifestationStatus.IN_ANALYSIS)

    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findById.mockResolvedValue(manifestation)
    catalogRepository.findAdministrativeUnitById.mockResolvedValue(activeUnit)

    const result = await sut.execute({
      requesterUserId: 'ombudsman-1',
      manifestationId: 'manifestation-1',
      administrativeUnitId: 'unit-2',
    })

    expect(manifestation.status).toBe(ManifestationStatus.AWAITING_UNIT)
    expect(manifestation.forwardedToUnitId?.getValue()).toBe('unit-2')
    expect(manifestation.attendantUserId?.toValue()).toBe('ombudsman-1')
    expect(manifestationsRepository.save.mock.calls).toHaveLength(0)
    expect(manifestationAdministrationRepository.forwardToUnit.mock.calls).toStrictEqual([
      [
        {
          manifestation,
          actorUserId: 'ombudsman-1',
          actorType: ManifestationMessageSenderType.OMBUDSMAN,
          forwardedToUnitName: 'Coordenação de TI',
          fromStatus: ManifestationStatus.IN_ANALYSIS,
          toStatus: ManifestationStatus.AWAITING_UNIT,
        },
      ],
    ])
    expect(result.manifestation).toStrictEqual({
      id: 'manifestation-1',
      status: ManifestationStatus.AWAITING_UNIT,
      forwardedToUnit: { id: 'unit-2', name: 'Coordenação de TI' },
    })
  })

  it('rejects requesters without administrative role', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.MANIFESTANT, 'user-1'))

    await expect(
      sut.execute({ requesterUserId: 'user-1', manifestationId: 'manifestation-1', administrativeUnitId: 'unit-2' }),
    ).rejects.toBeInstanceOf(NotAllowedToManageManifestationError)

    expect(manifestationsRepository.findById.mock.calls).toHaveLength(0)
    expect(manifestationAdministrationRepository.forwardToUnit.mock.calls).toHaveLength(0)
  })

  it('throws when the manifestation does not exist', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findById.mockResolvedValue(null)

    await expect(
      sut.execute({ requesterUserId: 'ombudsman-1', manifestationId: 'missing', administrativeUnitId: 'unit-2' }),
    ).rejects.toBeInstanceOf(ManifestationNotFoundError)
  })

  it('throws when the target unit does not exist', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findById.mockResolvedValue(buildManifestation(ManifestationStatus.IN_ANALYSIS))
    catalogRepository.findAdministrativeUnitById.mockResolvedValue(null)

    await expect(
      sut.execute({
        requesterUserId: 'ombudsman-1',
        manifestationId: 'manifestation-1',
        administrativeUnitId: 'ghost',
      }),
    ).rejects.toBeInstanceOf(ForwardTargetUnitNotFoundError)

    expect(manifestationAdministrationRepository.forwardToUnit.mock.calls).toHaveLength(0)
  })

  it('throws when the target unit is inactive', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findById.mockResolvedValue(buildManifestation(ManifestationStatus.IN_ANALYSIS))
    catalogRepository.findAdministrativeUnitById.mockResolvedValue({ ...activeUnit, isActive: false })

    await expect(
      sut.execute({
        requesterUserId: 'ombudsman-1',
        manifestationId: 'manifestation-1',
        administrativeUnitId: 'unit-2',
      }),
    ).rejects.toBeInstanceOf(ForwardTargetUnitInactiveError)

    expect(manifestationAdministrationRepository.forwardToUnit.mock.calls).toHaveLength(0)
  })

  it('rejects forwarding a terminal manifestation', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findById.mockResolvedValue(buildManifestation(ManifestationStatus.FINALIZED))
    catalogRepository.findAdministrativeUnitById.mockResolvedValue(activeUnit)

    await expect(
      sut.execute({
        requesterUserId: 'ombudsman-1',
        manifestationId: 'manifestation-1',
        administrativeUnitId: 'unit-2',
      }),
    ).rejects.toBeInstanceOf(ManifestationStatusTransitionNotAllowedError)

    expect(manifestationAdministrationRepository.forwardToUnit.mock.calls).toHaveLength(0)
  })
})
