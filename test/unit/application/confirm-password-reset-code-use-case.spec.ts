import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { HashComparer } from '#src/application/cryptography/hash-comparer.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { ConfirmPasswordResetCodeUseCase } from '#src/application/use-cases/password-reset/confirm-password-reset-code-use-case.js'
import { InvalidPasswordResetCodeError } from '#src/application/use-cases/password-reset/errors/invalid-password-reset-code-error.js'
import { PasswordResetCodeExpiredError } from '#src/application/use-cases/password-reset/errors/password-reset-code-expired-error.js'
import { User, UserRole } from '#src/domain/entities/user.js'
import { Email, InvalidEmailError } from '#src/domain/value-objects/email.js'
import { Name } from '#src/domain/value-objects/name.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

const NOW = new Date('2026-05-27T12:00:00.000Z')

describe('ConfirmPasswordResetCodeUseCase', () => {
  let usersRepository: DeepMockProxy<UsersRepository>
  let hashComparer: DeepMockProxy<HashComparer>
  let sut: ConfirmPasswordResetCodeUseCase

  const buildUser = (resetCodeHash: string | null, expiresAt: Date | null): User =>
    User.create(
      {
        name: Name.create('User Name'),
        email: Email.create('user@example.com'),
        passwordHash: 'hashed-password',
        role: UserRole.MANIFESTANT,
        emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
        passwordResetCodeHash: resetCodeHash,
        passwordResetCodeExpiresAt: expiresAt,
      },
      new UniqueEntityId('any_user_id'),
    )

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)

    usersRepository = mockDeep<UsersRepository>()
    hashComparer = mockDeep<HashComparer>()

    mockReset(usersRepository)
    mockReset(hashComparer)

    sut = new ConfirmPasswordResetCodeUseCase(usersRepository, hashComparer)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('confirms a valid, unexpired code against the stored hash', async () => {
    usersRepository.findByEmail.mockResolvedValue(buildUser('hashed-code', new Date(NOW.getTime() + 60_000)))
    hashComparer.compare.mockResolvedValue(true)

    const result = await sut.execute({ email: '  USER@example.com  ', code: '  123456  ' })

    expect(usersRepository.findByEmail.mock.calls).toStrictEqual([['user@example.com']])
    expect(hashComparer.compare.mock.calls).toStrictEqual([['123456', 'hashed-code']])
    expect(result).toStrictEqual({ passwordResetAllowed: true })
  })

  it('throws invalid code when the user is unknown', async () => {
    usersRepository.findByEmail.mockResolvedValue(null)

    await expect(sut.execute({ email: 'user@example.com', code: '123456' })).rejects.toBeInstanceOf(
      InvalidPasswordResetCodeError,
    )
    expect(hashComparer.compare.mock.calls).toHaveLength(0)
  })

  it('throws invalid code when there is no pending reset on the account', async () => {
    usersRepository.findByEmail.mockResolvedValue(buildUser(null, null))

    await expect(sut.execute({ email: 'user@example.com', code: '123456' })).rejects.toBeInstanceOf(
      InvalidPasswordResetCodeError,
    )
    expect(hashComparer.compare.mock.calls).toHaveLength(0)
  })

  it('throws expired when the reset window has elapsed', async () => {
    usersRepository.findByEmail.mockResolvedValue(buildUser('hashed-code', new Date(NOW.getTime() - 1)))

    await expect(sut.execute({ email: 'user@example.com', code: '123456' })).rejects.toBeInstanceOf(
      PasswordResetCodeExpiredError,
    )
    expect(hashComparer.compare.mock.calls).toHaveLength(0)
  })

  it('throws invalid code when the code does not match', async () => {
    usersRepository.findByEmail.mockResolvedValue(buildUser('hashed-code', new Date(NOW.getTime() + 60_000)))
    hashComparer.compare.mockResolvedValue(false)

    await expect(sut.execute({ email: 'user@example.com', code: '000000' })).rejects.toBeInstanceOf(
      InvalidPasswordResetCodeError,
    )
  })

  it('rejects invalid emails before touching dependencies', async () => {
    await expect(sut.execute({ email: 'invalid-email', code: '123456' })).rejects.toBeInstanceOf(InvalidEmailError)

    expect(usersRepository.findByEmail.mock.calls).toHaveLength(0)
  })
})
