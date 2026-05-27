import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { TokenGenerator } from '#src/application/auth/token-generator.js'
import type { HashComparer } from '#src/application/cryptography/hash-comparer.js'
import type { PasswordHasher } from '#src/application/cryptography/password-hasher.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { InvalidPasswordResetCodeError } from '#src/application/use-cases/password-reset/errors/invalid-password-reset-code-error.js'
import { PasswordResetCodeExpiredError } from '#src/application/use-cases/password-reset/errors/password-reset-code-expired-error.js'
import { ResetPasswordUseCase } from '#src/application/use-cases/password-reset/reset-password-use-case.js'
import { User, UserRole } from '#src/domain/entities/user.js'
import { Email, InvalidEmailError } from '#src/domain/value-objects/email.js'
import { Name } from '#src/domain/value-objects/name.js'
import { InvalidPasswordError } from '#src/domain/value-objects/password.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

const NOW = new Date('2026-05-27T12:00:00.000Z')

describe('ResetPasswordUseCase', () => {
  let usersRepository: DeepMockProxy<UsersRepository>
  let hashComparer: DeepMockProxy<HashComparer>
  let passwordHasher: DeepMockProxy<PasswordHasher>
  let tokenGenerator: DeepMockProxy<TokenGenerator>
  let sut: ResetPasswordUseCase

  const buildUser = (resetCodeHash: string | null, expiresAt: Date | null): User =>
    User.create(
      {
        name: Name.create('User Name'),
        email: Email.create('user@example.com'),
        passwordHash: 'old-hashed-password',
        role: UserRole.MANIFESTANT,
        emailVerifiedAt: null,
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
    passwordHasher = mockDeep<PasswordHasher>()
    tokenGenerator = mockDeep<TokenGenerator>()

    mockReset(usersRepository)
    mockReset(hashComparer)
    mockReset(passwordHasher)
    mockReset(tokenGenerator)

    sut = new ResetPasswordUseCase(usersRepository, hashComparer, passwordHasher, tokenGenerator)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('changes the password, verifies the email, clears the reset and returns a token', async () => {
    const user = buildUser('hashed-code', new Date(NOW.getTime() + 60_000))

    usersRepository.findByEmail.mockResolvedValue(user)
    hashComparer.compare.mockResolvedValue(true)
    passwordHasher.hash.mockResolvedValue('new-hashed-password')
    tokenGenerator.generate.mockResolvedValue('access-token')

    const result = await sut.execute({ email: '  USER@example.com  ', code: '  123456  ', password: 'NewPass123' })

    expect(hashComparer.compare.mock.calls).toStrictEqual([['123456', 'hashed-code']])
    expect(passwordHasher.hash.mock.calls).toStrictEqual([['NewPass123']])
    expect(user.passwordHash).toBe('new-hashed-password')
    expect(user.isEmailVerified).toBe(true)
    expect(user.passwordResetCodeHash).toBeNull()
    expect(user.passwordResetCodeExpiresAt).toBeNull()
    expect(usersRepository.save.mock.calls).toStrictEqual([[user]])
    expect(tokenGenerator.generate.mock.calls).toStrictEqual([
      [{ sub: user.id.toString(), role: UserRole.MANIFESTANT }],
    ])
    expect(result).toStrictEqual({ token: 'access-token' })
  })

  it('throws invalid code when the user is unknown', async () => {
    usersRepository.findByEmail.mockResolvedValue(null)

    await expect(
      sut.execute({ email: 'user@example.com', code: '123456', password: 'NewPass123' }),
    ).rejects.toBeInstanceOf(InvalidPasswordResetCodeError)
    expect(usersRepository.save.mock.calls).toHaveLength(0)
  })

  it('throws invalid code when there is no pending reset on the account', async () => {
    usersRepository.findByEmail.mockResolvedValue(buildUser(null, null))

    await expect(
      sut.execute({ email: 'user@example.com', code: '123456', password: 'NewPass123' }),
    ).rejects.toBeInstanceOf(InvalidPasswordResetCodeError)
    expect(hashComparer.compare.mock.calls).toHaveLength(0)
  })

  it('throws expired when the reset window has elapsed', async () => {
    usersRepository.findByEmail.mockResolvedValue(buildUser('hashed-code', new Date(NOW.getTime() - 1)))

    await expect(
      sut.execute({ email: 'user@example.com', code: '123456', password: 'NewPass123' }),
    ).rejects.toBeInstanceOf(PasswordResetCodeExpiredError)
    expect(passwordHasher.hash.mock.calls).toHaveLength(0)
  })

  it('throws invalid code when the code does not match and leaves the account untouched', async () => {
    usersRepository.findByEmail.mockResolvedValue(buildUser('hashed-code', new Date(NOW.getTime() + 60_000)))
    hashComparer.compare.mockResolvedValue(false)

    await expect(
      sut.execute({ email: 'user@example.com', code: '000000', password: 'NewPass123' }),
    ).rejects.toBeInstanceOf(InvalidPasswordResetCodeError)
    expect(passwordHasher.hash.mock.calls).toHaveLength(0)
    expect(usersRepository.save.mock.calls).toHaveLength(0)
    expect(tokenGenerator.generate.mock.calls).toHaveLength(0)
  })

  it('rejects invalid emails before touching dependencies', async () => {
    await expect(
      sut.execute({ email: 'invalid-email', code: '123456', password: 'NewPass123' }),
    ).rejects.toBeInstanceOf(InvalidEmailError)
    expect(usersRepository.findByEmail.mock.calls).toHaveLength(0)
  })

  it('rejects weak passwords before touching dependencies', async () => {
    await expect(sut.execute({ email: 'user@example.com', code: '123456', password: 'weak' })).rejects.toBeInstanceOf(
      InvalidPasswordError,
    )
    expect(usersRepository.findByEmail.mock.calls).toHaveLength(0)
  })
})
