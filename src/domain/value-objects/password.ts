export class InvalidPasswordError extends Error {
  constructor() {
    super('Invalid password')
    this.name = 'InvalidPasswordError'
  }
}

export class PlainPassword {
  private static readonly complexityPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/

  private constructor(private readonly value: string) {}

  static create(password: string): PlainPassword {
    if (!password || password.trim().length === 0) {
      throw new InvalidPasswordError()
    }

    if (password.length < 8) {
      throw new InvalidPasswordError()
    }

    if (!PlainPassword.complexityPattern.test(password)) {
      throw new InvalidPasswordError()
    }

    return new PlainPassword(password)
  }

  getValue(): string {
    return this.value
  }
}
