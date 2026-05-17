export class ManifestationHasNoAttendantError extends Error {
  constructor() {
    super('Manifestation has no attendant to be evaluated.')
    this.name = 'ManifestationHasNoAttendantError'
  }
}
