export class InvalidManifestationInvolvedPeopleError extends Error {
  constructor() {
    super('Invalid manifestation involved people')
    this.name = 'InvalidManifestationInvolvedPeopleError'
  }
}

export class ManifestationInvolvedPeople {
  private constructor(private readonly value: string) {}

  static create(involvedPeople: string): ManifestationInvolvedPeople {
    const normalizedInvolvedPeople = involvedPeople.trim()

    if (!normalizedInvolvedPeople) {
      throw new InvalidManifestationInvolvedPeopleError()
    }

    return new ManifestationInvolvedPeople(normalizedInvolvedPeople)
  }

  getValue(): string {
    return this.value
  }
}
