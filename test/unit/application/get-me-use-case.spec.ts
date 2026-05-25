import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { ManifestationEvaluationsRepository } from '#src/application/repositories/manifestation-evaluations-repository.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { UserNotFoundError } from '#src/application/use-cases/get-me/errors/user-not-found-error.js'
import { GetMeUseCase } from '#src/application/use-cases/get-me/get-me-use-case.js'
import { User, UserRole } from '#src/domain/entities/user.js'
import { Email } from '#src/domain/value-objects/email.js'
import { Name } from '#src/domain/value-objects/name.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

describe('GetMeUseCase', () => {
  let usersRepository: DeepMockProxy<UsersRepository>
  let manifestationEvaluationsRepository: DeepMockProxy<ManifestationEvaluationsRepository>
  let sut: GetMeUseCase

  const createdAt = new Date('2026-05-25T12:00:00.000Z')

  const buildUser = (role: UserRole): User =>
    User.create(
      {
        name: Name.create('User Name'),
        email: Email.create('user@example.com'),
        passwordHash: 'hashed-password',
        role,
        createdAt,
      },
      new UniqueEntityId('user-1'),
    )

  beforeEach(() => {
    usersRepository = mockDeep<UsersRepository>()
    manifestationEvaluationsRepository = mockDeep<ManifestationEvaluationsRepository>()

    mockReset(usersRepository)
    mockReset(manifestationEvaluationsRepository)

    sut = new GetMeUseCase(usersRepository, manifestationEvaluationsRepository)
  })

  it('returns the authenticated manifestant profile without attendance rating', async () => {
    usersRepository.findById.mockResolvedValue(buildUser(UserRole.MANIFESTANT))

    const result = await sut.execute({ userId: 'user-1' })

    expect(usersRepository.findById.mock.calls).toStrictEqual([['user-1']])
    expect(manifestationEvaluationsRepository.getRatingSummaryByAttendantUserId.mock.calls).toHaveLength(0)
    expect(result).toStrictEqual({
      user: {
        id: 'user-1',
        name: 'User Name',
        email: 'user@example.com',
        role: UserRole.MANIFESTANT,
        createdAt,
        attendanceRating: null,
      },
    })
  })

  it.each([UserRole.OMBUDSMAN, UserRole.ADMIN])('returns attendance rating summary for %s users', async (role) => {
    usersRepository.findById.mockResolvedValue(buildUser(role))
    manifestationEvaluationsRepository.getRatingSummaryByAttendantUserId.mockResolvedValue({
      average: 4.5,
      count: 2,
    })

    const result = await sut.execute({ userId: 'user-1' })

    expect(manifestationEvaluationsRepository.getRatingSummaryByAttendantUserId.mock.calls).toStrictEqual([['user-1']])
    expect(result.user.attendanceRating).toStrictEqual({ average: 4.5, count: 2 })
  })

  it('returns an empty attendance rating summary for administrative users without evaluations', async () => {
    usersRepository.findById.mockResolvedValue(buildUser(UserRole.OMBUDSMAN))
    manifestationEvaluationsRepository.getRatingSummaryByAttendantUserId.mockResolvedValue({
      average: null,
      count: 0,
    })

    const result = await sut.execute({ userId: 'user-1' })

    expect(result.user.attendanceRating).toStrictEqual({ average: null, count: 0 })
  })

  it('throws when the authenticated user no longer exists', async () => {
    usersRepository.findById.mockResolvedValue(null)

    await expect(sut.execute({ userId: 'missing-user' })).rejects.toBeInstanceOf(UserNotFoundError)

    expect(manifestationEvaluationsRepository.getRatingSummaryByAttendantUserId.mock.calls).toHaveLength(0)
  })

  it('propagates repository failures', async () => {
    const repositoryError = new Error('database unavailable')

    usersRepository.findById.mockRejectedValue(repositoryError)

    await expect(sut.execute({ userId: 'user-1' })).rejects.toThrow(repositoryError)
  })
})
