import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { PasswordHasher } from '#src/application/cryptography/password-hasher.js'
import type { UserRepository } from '#src/application/repositories/users-repository.js'
import { UserAlreadyExistsError } from '#src/application/use-cases/register-user/errors/user-already-exists-error.js'
import { RegisterUserUseCase } from '#src/application/use-cases/register-user/register-user.use-case.js'
import { User, UserRole } from '#src/domain/entities/user.js'
import { Email, InvalidEmailError } from '#src/domain/value-objects/email.js'
import { InvalidNameError, Name } from '#src/domain/value-objects/name.js'
import { InvalidPasswordError } from '#src/domain/value-objects/password.js'

describe('RegisterUserUseCase', () => {
  let usersRepository: DeepMockProxy<UserRepository>
  let passwordHasher: DeepMockProxy<PasswordHasher>
  let sut: RegisterUserUseCase
  let validInput: {
    name: string
    email: string
    password: string
  }

  const buildExistingUser = (): User =>
    User.create({
      name: Name.create('Maria Silva'),
      email: Email.create('maria@email.com'),
      passwordHash: 'hashed-password',
      role: UserRole.PROTESTER,
    })

  beforeEach(() => {
    usersRepository = mockDeep<UserRepository>()
    passwordHasher = mockDeep<PasswordHasher>()
    validInput = {
      name: 'Maria Silva',
      email: 'maria@email.com',
      password: '12345678',
    }

    mockReset(usersRepository)
    mockReset(passwordHasher)

    sut = new RegisterUserUseCase(usersRepository, passwordHasher)
  })

  it('registers a user with normalized data', async () => {
    usersRepository.findByEmail.mockResolvedValue(null)
    passwordHasher.hash.mockResolvedValue('hashed-password')

    const result = await sut.execute({
      ...validInput,
      name: '  Maria Silva  ',
      email: '  MARIA@Email.com  ',
    })

    expect(usersRepository.findByEmail.mock.calls).toStrictEqual([['maria@email.com']])
    expect(passwordHasher.hash.mock.calls).toStrictEqual([['12345678']])
    expect(usersRepository.save.mock.calls).toHaveLength(1)

    const saveCall = usersRepository.save.mock.calls[0] as [User] | undefined

    expect(saveCall).toBeDefined()

    if (!saveCall) {
      throw new Error('Expected saved user to be provided to repository')
    }

    const savedUser = saveCall[0]

    expect(savedUser.name.getValue()).toBe('Maria Silva')
    expect(savedUser.email.getValue()).toBe('maria@email.com')
    expect(savedUser.passwordHash).toBe('hashed-password')
    expect(savedUser.role).toBe(UserRole.PROTESTER)
    expect(savedUser.createdAt).toBeInstanceOf(Date)

    expect(result.user.id).toBe(savedUser.id.toString())
    expect(result.user.name).toBe('Maria Silva')
    expect(result.user.email).toBe('maria@email.com')
    expect(result.user.role).toBe(UserRole.PROTESTER)
    expect(result.user.createdAt).toBe(savedUser.createdAt.toString())
  })

  it('throws when a user with the same email already exists', async () => {
    usersRepository.findByEmail.mockResolvedValue(buildExistingUser())

    await expect(sut.execute(validInput)).rejects.toBeInstanceOf(UserAlreadyExistsError)

    expect(passwordHasher.hash.mock.calls).toHaveLength(0)
    expect(usersRepository.save.mock.calls).toHaveLength(0)
  })

  it('rejects invalid names before touching dependencies', async () => {
    await expect(
      sut.execute({
        ...validInput,
        name: 'Ana',
      }),
    ).rejects.toBeInstanceOf(InvalidNameError)

    expect(usersRepository.findByEmail.mock.calls).toHaveLength(0)
    expect(passwordHasher.hash.mock.calls).toHaveLength(0)
    expect(usersRepository.save.mock.calls).toHaveLength(0)
  })

  it('rejects invalid emails before touching dependencies', async () => {
    await expect(
      sut.execute({
        ...validInput,
        email: 'email-invalido',
      }),
    ).rejects.toBeInstanceOf(InvalidEmailError)

    expect(usersRepository.findByEmail.mock.calls).toHaveLength(0)
    expect(passwordHasher.hash.mock.calls).toHaveLength(0)
    expect(usersRepository.save.mock.calls).toHaveLength(0)
  })

  it('rejects invalid passwords before touching repository or hasher', async () => {
    await expect(
      sut.execute({
        ...validInput,
        password: '123',
      }),
    ).rejects.toBeInstanceOf(InvalidPasswordError)

    expect(usersRepository.findByEmail.mock.calls).toHaveLength(0)
    expect(passwordHasher.hash.mock.calls).toHaveLength(0)
    expect(usersRepository.save.mock.calls).toHaveLength(0)
  })

  it('propagates hasher failures and does not persist the user', async () => {
    const hasherError = new Error('hash failed')

    usersRepository.findByEmail.mockResolvedValue(null)
    passwordHasher.hash.mockRejectedValue(hasherError)

    await expect(sut.execute(validInput)).rejects.toThrow(hasherError)

    expect(usersRepository.save.mock.calls).toHaveLength(0)
  })
})
