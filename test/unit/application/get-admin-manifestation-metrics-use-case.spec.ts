import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { AdminManifestationFilters } from '#src/application/repositories/admin-manifestation-filters.js'
import type {
  ManifestationMetrics,
  ManifestationsRepository,
} from '#src/application/repositories/manifestations-repository.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { GetAdminManifestationMetricsUseCase } from '#src/application/use-cases/get-admin-manifestation-metrics/get-admin-manifestation-metrics-use-case.js'
import { NotAllowedToManageManifestationError } from '#src/application/use-cases/manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import { ManifestationStatus } from '#src/domain/entities/manifestation.js'
import { User, UserRole } from '#src/domain/entities/user.js'
import { Email } from '#src/domain/value-objects/email.js'
import { Name } from '#src/domain/value-objects/name.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

const metrics: ManifestationMetrics = {
  statusTotals: {
    [ManifestationStatus.IN_ANALYSIS]: 4,
    [ManifestationStatus.AWAITING_UNIT]: 1,
    [ManifestationStatus.ANSWERED]: 2,
    [ManifestationStatus.CANCELED]: 1,
    [ManifestationStatus.FINALIZED]: 5,
  },
  totalItems: 13,
}

describe('GetAdminManifestationMetricsUseCase', () => {
  let manifestationsRepository: DeepMockProxy<ManifestationsRepository>
  let usersRepository: DeepMockProxy<UsersRepository>
  let sut: GetAdminManifestationMetricsUseCase

  const buildRequester = (role: UserRole): User =>
    User.create(
      {
        name: Name.create('Staff Member'),
        email: Email.create('staff@example.com'),
        passwordHash: 'hashed-password',
        role,
        emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      new UniqueEntityId('requester-1'),
    )

  beforeEach(() => {
    manifestationsRepository = mockDeep<ManifestationsRepository>()
    usersRepository = mockDeep<UsersRepository>()
    mockReset(manifestationsRepository)
    mockReset(usersRepository)
    sut = new GetAdminManifestationMetricsUseCase(manifestationsRepository, usersRepository)
  })

  it('returns admin metrics forwarding the provided filters for an ombudsman', async () => {
    const filters: AdminManifestationFilters = { status: ManifestationStatus.ANSWERED, campusId: 'campus-1' }

    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.getMetricsForAdmin.mockResolvedValue(metrics)

    const result = await sut.execute({ requesterUserId: 'requester-1', filters })

    expect(usersRepository.findById.mock.calls).toStrictEqual([['requester-1']])
    expect(manifestationsRepository.getMetricsForAdmin.mock.calls).toStrictEqual([[filters]])
    expect(result).toStrictEqual(metrics)
  })

  it('defaults to empty filters when none are provided for an admin', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.ADMIN))
    manifestationsRepository.getMetricsForAdmin.mockResolvedValue(metrics)

    await sut.execute({ requesterUserId: 'requester-1' })

    expect(manifestationsRepository.getMetricsForAdmin.mock.calls).toStrictEqual([[{}]])
  })

  it('throws when the requester does not exist', async () => {
    usersRepository.findById.mockResolvedValue(null)

    await expect(sut.execute({ requesterUserId: 'ghost' })).rejects.toBeInstanceOf(NotAllowedToManageManifestationError)
    expect(manifestationsRepository.getMetricsForAdmin.mock.calls).toHaveLength(0)
  })

  it('throws when the requester is a manifestant', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.MANIFESTANT))

    await expect(sut.execute({ requesterUserId: 'requester-1' })).rejects.toBeInstanceOf(
      NotAllowedToManageManifestationError,
    )
    expect(manifestationsRepository.getMetricsForAdmin.mock.calls).toHaveLength(0)
  })
})
