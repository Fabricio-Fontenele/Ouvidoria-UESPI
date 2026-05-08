export class InvalidEmailError extends Error {
  public constructor() {
    super('Invalid email')
    this.name = 'InvalidEmailError'
  }
}

export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      throw new InvalidEmailError()
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new InvalidEmailError()
    }

    return new Email(normalizedEmail)
  }

  getValue(): string {
    return this.value
  }
}
