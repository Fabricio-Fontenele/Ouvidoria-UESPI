export class ManifestationNotFoundError extends Error {
  constructor() {
    super('Manifestation not found.')
    this.name = 'ManifestationNotFoundError'
  }
}
