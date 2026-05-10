export class InvalidCampusIdError extends Error {
  constructor() {
    super('Invalid campus id')
    this.name = 'InvalidCampusIdError'
  }
}

export class CampusId {
  private constructor(private readonly value: string) {}

  static create(campusId: string): CampusId {
    const normalizedCampusId = campusId.trim()

    if (!normalizedCampusId) {
      throw new InvalidCampusIdError()
    }

    return new CampusId(normalizedCampusId)
  }

  getValue(): string {
    return this.value
  }
}
