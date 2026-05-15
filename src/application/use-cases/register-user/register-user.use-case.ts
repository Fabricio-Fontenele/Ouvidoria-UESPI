import { User, UserRole } from '#src/domain/entities/user.js'
import { Email } from '#src/domain/value-objects/email.js'
import { Name } from '#src/domain/value-objects/name.js'
import { PlainPassword } from '#src/domain/value-objects/password.js'

import { UserAlreadyExistsError } from './errors/user-already-exists-error.js'
import type { PasswordHasher } from '../../cryptography/password-hasher.js'
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
    createdAt: Date
  }
}

export class RegisterUserUseCase implements UseCase<RegisterUserInput, RegisterUserOutput> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordHasher: PasswordHasher,
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

    const user = User.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash: hashedPassword,
      role: UserRole.MANIFESTANT,
    })

    await this.usersRepository.save(user)

    return {
      user: {
        id: user.id.toString(),
        name: user.name.getValue(),
        email: user.email.getValue(),
        role: user.role,
        createdAt: user.createdAt,
      },
    }
  }
}
