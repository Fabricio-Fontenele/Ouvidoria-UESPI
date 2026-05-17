export class ManifestationAttachmentsLimitExceededError extends Error {
  constructor() {
    super('Manifestation attachments limit exceeded.')
    this.name = 'ManifestationAttachmentsLimitExceededError'
  }
}
