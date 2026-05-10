export class IdentifiedManifestationRequiresRequesterError extends Error {
  constructor() {
    super('Identified manifestation requires requester')
    this.name = 'IdentifiedManifestationRequiresRequesterError'
  }
}
