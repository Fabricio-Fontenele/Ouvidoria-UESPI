export class ManifestationCannotReceiveAttachmentsError extends Error {
  constructor() {
    super('Manifestation cannot receive attachments in its current state.')
    this.name = 'ManifestationCannotReceiveAttachmentsError'
  }
}
