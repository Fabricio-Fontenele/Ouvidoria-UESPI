export class AdministrativeUnitInactiveError extends Error {
  constructor() {
    super('Administrative unit is inactive')
    this.name = 'AdministrativeUnitInactiveError'
  }
}
