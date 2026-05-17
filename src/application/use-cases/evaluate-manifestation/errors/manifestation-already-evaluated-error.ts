export class ManifestationAlreadyEvaluatedError extends Error {
  constructor() {
    super('Manifestation has already been evaluated.')
    this.name = 'ManifestationAlreadyEvaluatedError'
  }
}
