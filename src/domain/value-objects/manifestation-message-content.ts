export class InvalidManifestationMessageContentError extends Error {
  constructor() {
    super('Invalid manifestation message content')
    this.name = 'InvalidManifestationMessageContentError'
  }
}

export class ManifestationMessageContent {
  private constructor(private readonly value: string) {}

  static create(content: string): ManifestationMessageContent {
    const normalizedContent = content.trim()

    if (!normalizedContent) {
      throw new InvalidManifestationMessageContentError()
    }

    return new ManifestationMessageContent(normalizedContent)
  }

  getValue(): string {
    return this.value
  }
}
