import type { TokenGenerator } from '#src/application/auth/token-generator.js'
import type { HashComparer } from '#src/application/cryptography/hash-comparer.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { Email } from '#src/domain/value-objects/email.js'

import type { UseCase } from '../use-case.js'
import { EmailAlreadyVerifiedError } from './errors/email-already-verified-error.js'
import { EmailVerificationCodeExpiredError } from './errors/email-verification-code-expired-error.js'
import { InvalidEmailVerificationCodeError } from './errors/invalid-email-verification-code-error.js'

interface ConfirmEmailVerificationInput {
  email: string
  code: string
}

interface ConfirmEmailVerificationOutput {
  token: string
}

export class ConfirmEmailVerificationUseCase implements UseCase<
  ConfirmEmailVerificationInput,
  ConfirmEmailVerificationOutput
> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly hashComparer: HashComparer,
    private readonly tokenGenerator: TokenGenerator,
  ) {}

  async execute({ code, email }: ConfirmEmailVerificationInput): Promise<ConfirmEmailVerificationOutput> {
    const normalizedEmail = Email.create(email)
    const user = await this.usersRepository.findByEmail(normalizedEmail.getValue())

    if (user === null || user.emailVerificationCodeHash === null || user.emailVerificationCodeExpiresAt === null) {
      throw user?.isEmailVerified === true ? new EmailAlreadyVerifiedError() : new InvalidEmailVerificationCodeError()
    }

    if (user.emailVerificationCodeExpiresAt.getTime() < Date.now()) {
      throw new EmailVerificationCodeExpiredError()
    }

    const isCodeValid = await this.hashComparer.compare(code.trim(), user.emailVerificationCodeHash)

    if (!isCodeValid) {
      throw new InvalidEmailVerificationCodeError()
    }

    user.verifyEmail()
    await this.usersRepository.save(user)

    const token = await this.tokenGenerator.generate({
      sub: user.id.toString(),
      role: user.role,
    })

    return { token }
  }
}
