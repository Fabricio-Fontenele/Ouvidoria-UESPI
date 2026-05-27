import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { PasswordHasher } from '#src/application/cryptography/password-hasher.js'
import type { EmailSender } from '#src/application/email/email-sender.js'
import type { VerificationCodeGenerator } from '#src/application/protocol/verification-code-generator.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { ResendEmailVerificationCodeUseCase } from '#src/application/use-cases/resend-email-verification-code/resend-email-verification-code-use-case.js'
import { User, UserRole } from '#src/domain/entities/user.js'
import { Email, InvalidEmailError } from '#src/domain/value-objects/email.js'
import { Name } from '#src/domain/value-objects/name.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

const NOW = new Date('2026-05-27T12:00:00.000Z')
const TTL_MS = 15 * 60 * 1000

describe('ResendEmailVerificationCodeUseCase', () => {
  let usersRepository: DeepMockProxy<UsersRepository>
  let passwordHasher: DeepMockProxy<PasswordHasher>
  let verificationCodeGenerator: DeepMockProxy<VerificationCodeGenerator>
  let emailSender: DeepMockProxy<EmailSender>
  let sut: ResendEmailVerificationCodeUseCase

  const buildUser = (verifiedAt: Date | null): User =>
    User.create(
      {
        name: Name.create('User Name'),
        email: Email.create('user@example.com'),
        passwordHash: 'hashed-password',
        role: UserRole.MANIFESTANT,
        emailVerifiedAt: verifiedAt,
      },
      new UniqueEntityId('any_user_id'),
    )

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)

    usersRepository = mockDeep<UsersRepository>()
    passwordHasher = mockDeep<PasswordHasher>()
    verificationCodeGenerator = mockDeep<VerificationCodeGenerator>()
    emailSender = mockDeep<EmailSender>()

    mockReset(usersRepository)
    mockReset(passwordHasher)
    mockReset(verificationCodeGenerator)
    mockReset(emailSender)

    sut = new ResendEmailVerificationCodeUseCase(
      usersRepository,
      passwordHasher,
      verificationCodeGenerator,
      emailSender,
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('issues a fresh code, persists the verification window and emails the plain code', async () => {
    const user = buildUser(null)

    usersRepository.findByEmail.mockResolvedValue(user)
    verificationCodeGenerator.generate.mockResolvedValue('123456')
    passwordHasher.hash.mockResolvedValue('hashed-code')

    const result = await sut.execute({ email: '  USER@example.com  ' })

    expect(usersRepository.findByEmail.mock.calls).toStrictEqual([['user@example.com']])
    expect(passwordHasher.hash.mock.calls).toStrictEqual([['123456']])
    expect(user.emailVerificationCodeHash).toBe('hashed-code')
    expect(user.emailVerificationCodeExpiresAt).toStrictEqual(new Date(NOW.getTime() + TTL_MS))
    expect(usersRepository.save.mock.calls).toStrictEqual([[user]])
    expect(emailSender.send.mock.calls).toStrictEqual([
      [
        {
          to: 'user@example.com',
          subject: 'Codigo de verificacao da Ouvidoria UESPI',
          text: 'Seu codigo de verificacao e 123456. Ele expira em 15 minutos.',
        },
      ],
    ])
    expect(result).toStrictEqual({ sent: true })
  })

  it('returns sent:false without side effects when the email is unknown', async () => {
    usersRepository.findByEmail.mockResolvedValue(null)

    const result = await sut.execute({ email: 'ghost@example.com' })

    expect(result).toStrictEqual({ sent: false })
    expect(verificationCodeGenerator.generate.mock.calls).toHaveLength(0)
    expect(usersRepository.save.mock.calls).toHaveLength(0)
    expect(emailSender.send.mock.calls).toHaveLength(0)
  })

  it('returns sent:false without side effects when the email is already verified', async () => {
    usersRepository.findByEmail.mockResolvedValue(buildUser(new Date('2026-01-01T00:00:00.000Z')))

    const result = await sut.execute({ email: 'user@example.com' })

    expect(result).toStrictEqual({ sent: false })
    expect(verificationCodeGenerator.generate.mock.calls).toHaveLength(0)
    expect(emailSender.send.mock.calls).toHaveLength(0)
  })

  it('rejects invalid emails before touching dependencies', async () => {
    await expect(sut.execute({ email: 'invalid-email' })).rejects.toBeInstanceOf(InvalidEmailError)

    expect(usersRepository.findByEmail.mock.calls).toHaveLength(0)
  })
})
