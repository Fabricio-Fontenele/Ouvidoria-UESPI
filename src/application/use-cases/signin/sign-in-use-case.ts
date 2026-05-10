import type { TokenGenerator } from '#src/application/auth/token-generator.js'
import type { HashComparer } from '#src/application/cryptography/hash-comparer.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { Email } from '#src/domain/value-objects/email.js'

import type { UseCase } from '../use-case.js'
import { InvalidCredentialsError } from './errors/invalid-credentials-error.js'

export interface SignInInput {
  email: string
  password: string
}

export interface SignInOutput {
  token: string
}

export class SignInUseCase implements UseCase<SignInInput, SignInOutput> {
  constructor(
    private UsersRepository: UsersRepository,
    private hashComparer: HashComparer,
    private tokenGenerator: TokenGenerator,
  ) {}

  async execute({ email, password }: SignInInput): Promise<SignInOutput> {
    const normalizedEmail = Email.create(email)

    const user = await this.UsersRepository.findByEmail(normalizedEmail.getValue())

    if (!user) {
      throw new InvalidCredentialsError()
    }

    const isPasswordValid = await this.hashComparer.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      throw new InvalidCredentialsError()
    }

    const token = await this.tokenGenerator.generate({
      sub: user.id,
      role: user.role,
    })

    return { token }
  }
}
