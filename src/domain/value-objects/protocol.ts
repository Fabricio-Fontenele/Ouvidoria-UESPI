export class InvalidProtocolError extends Error {
  constructor() {
    super('Invalid protocol')
    this.name = 'InvalidProtocolError'
  }
}

export class Protocol {
  private constructor(private readonly value: string) {}

  static create(protocol: string): Protocol {
    const normalizedProtocol = protocol.trim()

    if (!normalizedProtocol) {
      throw new InvalidProtocolError()
    }

    return new Protocol(normalizedProtocol)
  }

  getValue(): string {
    return this.value
  }
}
