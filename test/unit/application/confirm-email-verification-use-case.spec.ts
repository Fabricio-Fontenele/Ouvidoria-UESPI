import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { TokenGenerator } from '#src/application/auth/token-generator.js'
import type { HashComparer } from '#src/application/cryptography/hash-comparer.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { ConfirmEmailVerificationUseCase } from '#src/application/use-cases/confirm-email-verification/confirm-email-verification-use-case.js'
import { EmailAlreadyVerifiedError } from '#src/application/use-cases/confirm-email-verification/errors/email-already-verified-error.js'
import { EmailVerificationCodeExpiredError } from '#src/application/use-cases/confirm-email-verification/errors/email-verification-code-expired-error.js'
import { InvalidEmailVerificationCodeError } from '#src/application/use-cases/confirm-email-verification/errors/invalid-email-verification-code-error.js'
import { User, UserRole } from '#src/domain/entities/user.js'
import { Email, InvalidEmailError } from '#src/domain/value-objects/email.js'
import { Name } from '#src/domain/value-objects/name.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

const NOW = new Date('2026-05-27T12:00:00.000Z')

interface BuildUserProps {
  verifiedAt?: Date | null
  codeHash?: string | null
  expiresAt?: Date | null
}

describe('ConfirmEmailVerificationUseCase', () => {
  let usersRepository: DeepMockProxy<UsersRepository>
  let hashComparer: DeepMockProxy<HashComparer>
  let tokenGenerator: DeepMockProxy<TokenGenerator>
  let sut: ConfirmEmailVerificationUseCase

  const buildUser = ({ verifiedAt = null, codeHash = 'hashed-code', expiresAt }: BuildUserProps = {}): User =>
    User.create(
      {
        name: Name.create('User Name'),
        email: Email.create('user@example.com'),
        passwordHash: 'hashed-password',
        role: UserRole.MANIFESTANT,
        emailVerifiedAt: verifiedAt,
        emailVerificationCodeHash: codeHash,
        emailVerificationCodeExpiresAt: expiresAt ?? new Date(NOW.getTime() + 60_000),
      },
      new UniqueEntityId('any_user_id'),
    )

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)

    usersRepository = mockDeep<UsersRepository>()
    hashComparer = mockDeep<HashComparer>()
    tokenGenerator = mockDeep<TokenGenerator>()

    mockReset(usersRepository)
    mockReset(hashComparer)
    mockReset(tokenGenerator)

    sut = new ConfirmEmailVerificationUseCase(usersRepository, hashComparer, tokenGenerator)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('verifies the email, persists the user and returns a token', async () => {
    const user = buildUser()

    usersRepository.findByEmail.mockResolvedValue(user)
    hashComparer.compare.mockResolvedValue(true)
    tokenGenerator.generate.mockResolvedValue('access-token')

    const result = await sut.execute({ email: '  USER@example.com  ', code: '  123456  ' })

    expect(usersRepository.findByEmail.mock.calls).toStrictEqual([['user@example.com']])
    expect(hashComparer.compare.mock.calls).toStrictEqual([['123456', 'hashed-code']])
    expect(user.isEmailVerified).toBe(true)
    expect(user.emailVerificationCodeHash).toBeNull()
    expect(usersRepository.save.mock.calls).toStrictEqual([[user]])
    expect(tokenGenerator.generate.mock.calls).toStrictEqual([
      [{ sub: user.id.toString(), role: UserRole.MANIFESTANT }],
    ])
    expect(result).toStrictEqual({ token: 'access-token' })
  })

  it('throws invalid code when the user is unknown', async () => {
    usersRepository.findByEmail.mockResolvedValue(null)

    await expect(sut.execute({ email: 'user@example.com', code: '123456' })).rejects.toBeInstanceOf(
      InvalidEmailVerificationCodeError,
    )
  })

  it('throws already verified when there is no pending code on a verified account', async () => {
    usersRepository.findByEmail.mockResolvedValue(buildUser({ verifiedAt: NOW, codeHash: null }))

    await expect(sut.execute({ email: 'user@example.com', code: '123456' })).rejects.toBeInstanceOf(
      EmailAlreadyVerifiedError,
    )
    expect(hashComparer.compare.mock.calls).toHaveLength(0)
  })

  it('throws invalid code when there is no pending code on an unverified account', async () => {
    usersRepository.findByEmail.mockResolvedValue(buildUser({ codeHash: null }))

    await expect(sut.execute({ email: 'user@example.com', code: '123456' })).rejects.toBeInstanceOf(
      InvalidEmailVerificationCodeError,
    )
  })

  it('throws expired when the verification window has elapsed', async () => {
    usersRepository.findByEmail.mockResolvedValue(buildUser({ expiresAt: new Date(NOW.getTime() - 1) }))

    await expect(sut.execute({ email: 'user@example.com', code: '123456' })).rejects.toBeInstanceOf(
      EmailVerificationCodeExpiredError,
    )
    expect(hashComparer.compare.mock.calls).toHaveLength(0)
  })

  it('throws invalid code when the code does not match', async () => {
    usersRepository.findByEmail.mockResolvedValue(buildUser())
    hashComparer.compare.mockResolvedValue(false)

    await expect(sut.execute({ email: 'user@example.com', code: '000000' })).rejects.toBeInstanceOf(
      InvalidEmailVerificationCodeError,
    )
    expect(usersRepository.save.mock.calls).toHaveLength(0)
    expect(tokenGenerator.generate.mock.calls).toHaveLength(0)
  })

  it('rejects invalid emails before touching dependencies', async () => {
    await expect(sut.execute({ email: 'invalid-email', code: '123456' })).rejects.toBeInstanceOf(InvalidEmailError)

    expect(usersRepository.findByEmail.mock.calls).toHaveLength(0)
  })
})
