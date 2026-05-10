export class InvalidAdministrativeUnitIdError extends Error {
  constructor() {
    super('Invalid administrative unit id')
    this.name = 'InvalidAdministrativeUnitIdError'
  }
}

export class AdministrativeUnitId {
  private constructor(private readonly value: string) {}

  static create(administrativeUnitId: string): AdministrativeUnitId {
    const normalizedAdministrativeUnitId = administrativeUnitId.trim()

    if (!normalizedAdministrativeUnitId) {
      throw new InvalidAdministrativeUnitIdError()
    }

    return new AdministrativeUnitId(normalizedAdministrativeUnitId)
  }

  getValue(): string {
    return this.value
  }
}
