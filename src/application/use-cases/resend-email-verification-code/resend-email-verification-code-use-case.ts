import type { PasswordHasher } from '#src/application/cryptography/password-hasher.js'
import type { EmailSender } from '#src/application/email/email-sender.js'
import type { VerificationCodeGenerator } from '#src/application/protocol/verification-code-generator.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { Email } from '#src/domain/value-objects/email.js'

import type { UseCase } from '../use-case.js'

interface ResendEmailVerificationCodeInput {
  email: string
}

interface ResendEmailVerificationCodeOutput {
  sent: boolean
}

const EMAIL_VERIFICATION_CODE_TTL_MS = 15 * 60 * 1000

export class ResendEmailVerificationCodeUseCase implements UseCase<
  ResendEmailVerificationCodeInput,
  ResendEmailVerificationCodeOutput
> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly verificationCodeGenerator: VerificationCodeGenerator,
    private readonly emailSender: EmailSender,
  ) {}

  async execute({ email }: ResendEmailVerificationCodeInput): Promise<ResendEmailVerificationCodeOutput> {
    const normalizedEmail = Email.create(email)
    const user = await this.usersRepository.findByEmail(normalizedEmail.getValue())

    if (user === null || user.isEmailVerified) {
      return { sent: false }
    }

    const code = await this.verificationCodeGenerator.generate()
    const codeHash = await this.passwordHasher.hash(code)
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_CODE_TTL_MS)

    user.startEmailVerification(codeHash, expiresAt)
    await this.usersRepository.save(user)
    await this.emailSender.send({
      to: user.email.getValue(),
      subject: 'Codigo de verificacao da Ouvidoria UESPI',
      text: `Seu codigo de verificacao e ${code}. Ele expira em 15 minutos.`,
    })

    return { sent: true }
  }
}
