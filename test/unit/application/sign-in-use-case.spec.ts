import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { TokenGenerator } from '#src/application/auth/token-generator.js'
import type { HashComparer } from '#src/application/cryptography/hash-comparer.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { EmailNotVerifiedError } from '#src/application/use-cases/signin/errors/email-not-verified-error.js'
import { InvalidCredentialsError } from '#src/application/use-cases/signin/errors/invalid-credentials-error.js'
import { SignInUseCase, type SignInInput } from '#src/application/use-cases/signin/sign-in-use-case.js'
import { User, UserRole } from '#src/domain/entities/user.js'
import { Email, InvalidEmailError } from '#src/domain/value-objects/email.js'
import { Name } from '#src/domain/value-objects/name.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

describe('SignInUseCase', () => {
  let input: SignInInput
  let UsersRepository: DeepMockProxy<UsersRepository>
  let hashComparer: DeepMockProxy<HashComparer>
  let tokenGenerator: DeepMockProxy<TokenGenerator>
  let sut: SignInUseCase

  const buildUser = (): User =>
    User.create(
      {
        name: Name.create('User Name'),
        email: Email.create('user@example.com'),
        passwordHash: 'hashed-password',
        role: UserRole.MANIFESTANT,
        emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: new Date(),
      },
      new UniqueEntityId('any_user_id'),
    )

  beforeEach(() => {
    input = {
      email: 'user@example.com',
      password: 'Password123',
    }

    UsersRepository = mockDeep<UsersRepository>()
    hashComparer = mockDeep<HashComparer>()
    tokenGenerator = mockDeep<TokenGenerator>()

    mockReset(UsersRepository)
    mockReset(hashComparer)
    mockReset(tokenGenerator)

    sut = new SignInUseCase(UsersRepository, hashComparer, tokenGenerator)
  })

  it('signs in with normalized email, preserves the typed password and returns a token', async () => {
    const user = buildUser()

    UsersRepository.findByEmail.mockResolvedValue(user)
    hashComparer.compare.mockResolvedValue(true)
    tokenGenerator.generate.mockResolvedValue('access-token')

    const result = await sut.execute({
      ...input,
      email: '  USER@example.com  ',
      password: '  Password123  ',
    })

    expect(UsersRepository.findByEmail.mock.calls).toStrictEqual([['user@example.com']])
    expect(hashComparer.compare.mock.calls).toStrictEqual([['  Password123  ', 'hashed-password']])
    expect(tokenGenerator.generate.mock.calls).toStrictEqual([
      [
        {
          sub: user.id.toString(),
          role: UserRole.MANIFESTANT,
        },
      ],
    ])
    expect(result).toStrictEqual({ token: 'access-token' })
  })

  it('throws invalid credentials when no user is found', async () => {
    UsersRepository.findByEmail.mockResolvedValue(null)

    await expect(sut.execute(input)).rejects.toBeInstanceOf(InvalidCredentialsError)

    expect(hashComparer.compare.mock.calls).toHaveLength(0)
    expect(tokenGenerator.generate.mock.calls).toHaveLength(0)
  })

  it('throws invalid credentials when the password does not match', async () => {
    UsersRepository.findByEmail.mockResolvedValue(buildUser())
    hashComparer.compare.mockResolvedValue(false)

    await expect(sut.execute(input)).rejects.toBeInstanceOf(InvalidCredentialsError)

    expect(hashComparer.compare.mock.calls).toHaveLength(1)
    expect(tokenGenerator.generate.mock.calls).toHaveLength(0)
  })

  it('throws when the email has a pending verification code', async () => {
    const user = User.create({
      name: Name.create('User Name'),
      email: Email.create('user@example.com'),
      passwordHash: 'hashed-password',
      role: UserRole.MANIFESTANT,
      emailVerificationCodeHash: 'hashed-code',
      emailVerificationCodeExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    })

    UsersRepository.findByEmail.mockResolvedValue(user)
    hashComparer.compare.mockResolvedValue(true)

    await expect(sut.execute(input)).rejects.toBeInstanceOf(EmailNotVerifiedError)

    expect(tokenGenerator.generate.mock.calls).toHaveLength(0)
  })

  it('allows legacy users without a pending verification code to sign in', async () => {
    const user = User.create({
      name: Name.create('User Name'),
      email: Email.create('user@example.com'),
      passwordHash: 'hashed-password',
      role: UserRole.MANIFESTANT,
    })

    UsersRepository.findByEmail.mockResolvedValue(user)
    hashComparer.compare.mockResolvedValue(true)
    tokenGenerator.generate.mockResolvedValue('access-token')

    const result = await sut.execute(input)

    expect(tokenGenerator.generate.mock.calls).toStrictEqual([
      [
        {
          sub: user.id.toString(),
          role: UserRole.MANIFESTANT,
        },
      ],
    ])
    expect(result).toStrictEqual({ token: 'access-token' })
  })

  it('rejects invalid emails before touching dependencies', async () => {
    await expect(
      sut.execute({
        ...input,
        email: 'invalid-email',
      }),
    ).rejects.toBeInstanceOf(InvalidEmailError)

    expect(UsersRepository.findByEmail.mock.calls).toHaveLength(0)
    expect(hashComparer.compare.mock.calls).toHaveLength(0)
    expect(tokenGenerator.generate.mock.calls).toHaveLength(0)
  })

  it('propagates hash comparer failures and does not generate a token', async () => {
    const comparerError = new Error('compare failed')

    UsersRepository.findByEmail.mockResolvedValue(buildUser())
    hashComparer.compare.mockRejectedValue(comparerError)

    await expect(sut.execute(input)).rejects.toThrow(comparerError)

    expect(tokenGenerator.generate.mock.calls).toHaveLength(0)
  })

  it('propagates token generator failures after validating credentials', async () => {
    const generatorError = new Error('token failed')
    const user = buildUser()

    UsersRepository.findByEmail.mockResolvedValue(user)
    hashComparer.compare.mockResolvedValue(true)
    tokenGenerator.generate.mockRejectedValue(generatorError)

    await expect(sut.execute(input)).rejects.toThrow(generatorError)

    expect(hashComparer.compare.mock.calls).toHaveLength(1)
    expect(tokenGenerator.generate.mock.calls).toStrictEqual([
      [
        {
          sub: user.id.toString(),
          role: UserRole.MANIFESTANT,
        },
      ],
    ])
  })
})
