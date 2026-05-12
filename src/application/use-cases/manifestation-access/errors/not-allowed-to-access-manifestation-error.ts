export class NotAllowedToAccessManifestationError extends Error {
  constructor() {
    super('Not allowed to access manifestation.')
    this.name = 'NotAllowedToAccessManifestationError'
  }
}
