import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { ManifestationListItemDTO } from '#src/application/dto/manifestation-query-dtos.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import { MANIFESTATIONS_PAGE_SIZE } from '#src/application/repositories/pagination-params.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { ListAdminManifestationsUseCase } from '#src/application/use-cases/list-admin-manifestations/list-admin-manifestations-use-case.js'
import { InvalidPageNumberError } from '#src/application/use-cases/list-user-manifestations/errors/invalid-page-number-error.js'
import { NotAllowedToManageManifestationError } from '#src/application/use-cases/manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import { User, UserRole } from '#src/domain/entities/user.js'
import { Email } from '#src/domain/value-objects/email.js'
import { Name } from '#src/domain/value-objects/name.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

describe('ListAdminManifestationsUseCase', () => {
  let manifestationsRepository: DeepMockProxy<ManifestationsRepository>
  let usersRepository: DeepMockProxy<UsersRepository>
  let sut: ListAdminManifestationsUseCase

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

  const buildManifestation = (id: string): ManifestationListItemDTO => ({
    id,
    protocol: `2026-${id}`,
    type: ManifestationType.COMPLAINT,
    status: ManifestationStatus.IN_ANALYSIS,
    campusId: 'campus-1',
    administrativeUnitId: 'unit-1',
    description: `Description for ${id}`,
    authorUserId: 'user-1',
    createdAt: new Date('2026-05-10T12:00:00.000Z'),
  })
  const statusTotals = {
    [ManifestationStatus.ANSWERED]: 5,
    [ManifestationStatus.AWAITING_UNIT]: 4,
    [ManifestationStatus.CANCELED]: 3,
    [ManifestationStatus.FINALIZED]: 2,
    [ManifestationStatus.IN_ANALYSIS]: 27,
  }

  beforeEach(() => {
    manifestationsRepository = mockDeep<ManifestationsRepository>()
    usersRepository = mockDeep<UsersRepository>()

    mockReset(manifestationsRepository)
    mockReset(usersRepository)

    sut = new ListAdminManifestationsUseCase(manifestationsRepository, usersRepository)
  })

  it('lists manifestations for an ombudsman with filters and pagination', async () => {
    const manifestations = [buildManifestation('manifestation-1'), buildManifestation('manifestation-2')]
    const filters = {
      status: ManifestationStatus.IN_ANALYSIS,
      type: ManifestationType.COMPLAINT,
      campusId: 'campus-1',
      administrativeUnitId: 'unit-1',
      from: new Date('2026-05-01T00:00:00.000Z'),
      to: new Date('2026-05-31T23:59:59.999Z'),
    }

    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findManyForAdmin.mockResolvedValue({ manifestations, statusTotals, totalItems: 41 })

    const result = await sut.execute({
      requesterUserId: 'ombudsman-1',
      page: 2,
      filters,
    })

    expect(usersRepository.findById.mock.calls).toStrictEqual([['ombudsman-1']])
    expect(manifestationsRepository.findManyForAdmin.mock.calls).toStrictEqual([[filters, { page: 2 }]])
    expect(result).toStrictEqual({
      manifestations,
      page: 2,
      pageSize: MANIFESTATIONS_PAGE_SIZE,
      statusTotals,
      totalItems: 41,
      totalPages: Math.ceil(41 / MANIFESTATIONS_PAGE_SIZE),
    })
  })

  it('lists manifestations for an admin without filters', async () => {
    const manifestations = [buildManifestation('manifestation-1')]

    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.ADMIN, 'admin-1'))
    manifestationsRepository.findManyForAdmin.mockResolvedValue({ manifestations, statusTotals, totalItems: 1 })

    const result = await sut.execute({
      requesterUserId: 'admin-1',
      page: 1,
    })

    expect(manifestationsRepository.findManyForAdmin.mock.calls).toStrictEqual([[{}, { page: 1 }]])
    expect(result).toStrictEqual({
      manifestations,
      page: 1,
      pageSize: MANIFESTATIONS_PAGE_SIZE,
      statusTotals,
      totalItems: 1,
      totalPages: 1,
    })
  })

  it('rejects invalid page numbers before touching repositories', async () => {
    await expect(
      sut.execute({
        requesterUserId: 'ombudsman-1',
        page: 0,
      }),
    ).rejects.toBeInstanceOf(InvalidPageNumberError)

    expect(usersRepository.findById.mock.calls).toHaveLength(0)
    expect(manifestationsRepository.findManyForAdmin.mock.calls).toHaveLength(0)
  })

  it('rejects requesters without administrative role', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.MANIFESTANT, 'user-1'))

    await expect(
      sut.execute({
        requesterUserId: 'user-1',
        page: 1,
      }),
    ).rejects.toBeInstanceOf(NotAllowedToManageManifestationError)

    expect(manifestationsRepository.findManyForAdmin.mock.calls).toHaveLength(0)
  })

  it('rejects requesters that no longer exist', async () => {
    usersRepository.findById.mockResolvedValue(null)

    await expect(
      sut.execute({
        requesterUserId: 'missing-user',
        page: 1,
      }),
    ).rejects.toBeInstanceOf(NotAllowedToManageManifestationError)

    expect(manifestationsRepository.findManyForAdmin.mock.calls).toHaveLength(0)
  })

  it('propagates repository failures', async () => {
    const repositoryError = new Error('repository failed')

    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findManyForAdmin.mockRejectedValue(repositoryError)

    await expect(
      sut.execute({
        requesterUserId: 'ombudsman-1',
        page: 1,
      }),
    ).rejects.toThrow(repositoryError)
  })
})
