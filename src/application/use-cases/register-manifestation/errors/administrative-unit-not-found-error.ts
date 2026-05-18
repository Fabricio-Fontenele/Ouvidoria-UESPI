export class AdministrativeUnitNotFoundError extends Error {
  constructor() {
    super('Administrative unit not found')
    this.name = 'AdministrativeUnitNotFoundError'
  }
}
