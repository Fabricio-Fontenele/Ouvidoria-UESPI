export class NotAllowedToManageManifestationError extends Error {
  constructor() {
    super('Not allowed to manage manifestations.')
    this.name = 'NotAllowedToManageManifestationError'
  }
}
