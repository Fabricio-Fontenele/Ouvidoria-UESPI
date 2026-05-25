export class ManifestationInteractionNotAllowedError extends Error {
  constructor() {
    super('Manifestation does not allow new messages.')
    this.name = 'ManifestationInteractionNotAllowedError'
  }
}
