export class NotAllowedToAccessManifestationError extends Error {
  constructor() {
    super('You are not allowed to access this manifestation.')
    this.name = 'NotAllowedToAccessManifestationError'
  }
}
