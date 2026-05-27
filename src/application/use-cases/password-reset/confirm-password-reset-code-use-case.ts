import type { HashComparer } from '#src/application/cryptography/hash-comparer.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { Email } from '#src/domain/value-objects/email.js'

import type { UseCase } from '../use-case.js'
import { InvalidPasswordResetCodeError } from './errors/invalid-password-reset-code-error.js'
import { PasswordResetCodeExpiredError } from './errors/password-reset-code-expired-error.js'

interface ConfirmPasswordResetCodeInput {
  email: string
  code: string
}

interface ConfirmPasswordResetCodeOutput {
  passwordResetAllowed: true
}

export class ConfirmPasswordResetCodeUseCase implements UseCase<
  ConfirmPasswordResetCodeInput,
  ConfirmPasswordResetCodeOutput
> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly hashComparer: HashComparer,
  ) {}

  async execute({ code, email }: ConfirmPasswordResetCodeInput): Promise<ConfirmPasswordResetCodeOutput> {
    const normalizedEmail = Email.create(email)
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

    return { passwordResetAllowed: true }
  }
}
