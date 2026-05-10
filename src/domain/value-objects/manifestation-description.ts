export class InvalidManifestationDescriptionError extends Error {
  constructor() {
    super('Invalid manifestation description')
    this.name = 'InvalidManifestationDescriptionError'
  }
}

export class ManifestationDescription {
  private constructor(private readonly value: string) {}

  static create(description: string): ManifestationDescription {
    const normalizedDescription = description.trim()

    if (!normalizedDescription) {
      throw new InvalidManifestationDescriptionError()
    }

    return new ManifestationDescription(normalizedDescription)
  }

  getValue(): string {
    return this.value
  }
}
