export class ManifestationTrackingNotFoundError extends Error {
  constructor() {
    super('Manifestation tracking not found.')
    this.name = 'ManifestationTrackingNotFoundError'
  }
}
