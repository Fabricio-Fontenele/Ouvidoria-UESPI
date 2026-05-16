export class IdentifiedManifestationRequiresManifestantRoleError extends Error {
  constructor() {
    super('Only users with the manifestant role can open identified manifestations.')
    this.name = 'IdentifiedManifestationRequiresManifestantRoleError'
  }
}
