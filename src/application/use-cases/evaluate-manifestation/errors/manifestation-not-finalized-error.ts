export class ManifestationNotFinalizedError extends Error {
  constructor() {
    super('Manifestation must be finalized before it can be evaluated.')
    this.name = 'ManifestationNotFinalizedError'
  }
}
