import type { TokenGenerator } from '#src/application/auth/token-generator.js'
import type { HashComparer } from '#src/application/cryptography/hash-comparer.js'
import type { PasswordHasher } from '#src/application/cryptography/password-hasher.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { Email } from '#src/domain/value-objects/email.js'
import { PlainPassword } from '#src/domain/value-objects/password.js'

import type { UseCase } from '../use-case.js'
import { InvalidPasswordResetCodeError } from './errors/invalid-password-reset-code-error.js'
import { PasswordResetCodeExpiredError } from './errors/password-reset-code-expired-error.js'

interface ResetPasswordInput {
  email: string
  code: string
  password: string
}

interface ResetPasswordOutput {
  token: string
}

export class ResetPasswordUseCase implements UseCase<ResetPasswordInput, ResetPasswordOutput> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly hashComparer: HashComparer,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenGenerator: TokenGenerator,
  ) {}

  async execute({ code, email, password }: ResetPasswordInput): Promise<ResetPasswordOutput> {
    const normalizedEmail = Email.create(email)
    const plainPassword = PlainPassword.create(password)
    const user = await this.usersRepository.findByEmail(normalizedEmail.getValue())

    if (user === null || user.passwordResetCodeHash === null || user.passwordResetCodeExpiresAt === null) {
      throw new InvalidPasswordResetCodeError()
    }

    if (user.passwordResetCodeExpiresAt.getTime() < Date.now()) {
      throw new PasswordResetCodeExpiredError()
    }

    const isCodeValid = await this.hashComparer.compare(code.trim(), user.passwordResetCodeHash)

    if (!isCodeValid) {
      throw new InvalidPasswordResetCodeError()
    }

    const passwordHash = await this.passwordHasher.hash(plainPassword.getValue())

    user.changePassword(passwordHash)
    user.verifyEmail()
    user.clearPasswordReset()
    await this.usersRepository.save(user)

    const token = await this.tokenGenerator.generate({
      sub: user.id.toString(),
      role: user.role,
    })

    return { token }
  }
}
