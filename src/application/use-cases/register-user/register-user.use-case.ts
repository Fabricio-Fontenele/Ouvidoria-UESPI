import { User, UserRole } from '#src/domain/entities/user.js'
import { Email } from '#src/domain/value-objects/email.js'
import { Name } from '#src/domain/value-objects/name.js'
import { PlainPassword } from '#src/domain/value-objects/password.js'

import { UserAlreadyExistsError } from './errors/user-already-exists-error.js'
import type { PasswordHasher } from '../../cryptography/password-hasher.js'
import type { EmailSender } from '../../email/email-sender.js'
import type { VerificationCodeGenerator } from '../../protocol/verification-code-generator.js'
import type { UsersRepository } from '../../repositories/users-repository.js'
import type { UseCase } from '../use-case.js'

interface RegisterUserInput {
  name: string
  email: string
  password: string
}

interface RegisterUserOutput {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
    emailVerifiedAt: Date | null
    createdAt: Date
  }
  emailVerificationRequired: true
}

const EMAIL_VERIFICATION_CODE_TTL_MS = 15 * 60 * 1000

export class RegisterUserUseCase implements UseCase<RegisterUserInput, RegisterUserOutput> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly verificationCodeGenerator: VerificationCodeGenerator,
    private readonly emailSender: EmailSender,
  ) {}

  async execute({ name, email, password }: RegisterUserInput): Promise<RegisterUserOutput> {
    const normalizedName = Name.create(name)
    const normalizedEmail = Email.create(email)
    const plainPassword = PlainPassword.create(password)

    const userWithSameEmail = await this.usersRepository.findByEmail(normalizedEmail.getValue())

    if (userWithSameEmail) {
      throw new UserAlreadyExistsError()
    }

    const hashedPassword = await this.passwordHasher.hash(plainPassword.getValue())
    const verificationCode = await this.verificationCodeGenerator.generate()
    const verificationCodeHash = await this.passwordHasher.hash(verificationCode)
    const verificationCodeExpiresAt = new Date(Date.now() + EMAIL_VERIFICATION_CODE_TTL_MS)

    const user = User.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash: hashedPassword,
      role: UserRole.MANIFESTANT,
      emailVerificationCodeHash: verificationCodeHash,
      emailVerificationCodeExpiresAt: verificationCodeExpiresAt,
    })

    await this.usersRepository.save(user)
    await this.emailSender.send({
      to: user.email.getValue(),
      subject: 'Codigo de verificacao da Ouvidoria UESPI',
      text: `Seu codigo de verificacao e ${verificationCode}. Ele expira em 15 minutos.`,
    })

    return {
      user: {
        id: user.id.toString(),
        name: user.name.getValue(),
        email: user.email.getValue(),
        role: user.role,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
      },
      emailVerificationRequired: true,
    }
  }
}
