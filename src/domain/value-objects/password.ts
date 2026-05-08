export class InvalidPasswordError extends Error {
  constructor() {
    super('Invalid password')
    this.name = 'InvalidPasswordError'
  }
}

export class PlainPassword {
  private constructor(private readonly value: string) {}

  static create(password: string): PlainPassword {
    if (!password) {
      throw new InvalidPasswordError()
    }

    if (password.length < 8) {
      throw new InvalidPasswordError()
    }

    return new PlainPassword(password)
  }

  getValue(): string {
    return this.value
  }
}
