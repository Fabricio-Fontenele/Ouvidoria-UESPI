export class AdministrativeUnitDoesNotBelongToCampusError extends Error {
  constructor() {
    super('Administrative unit does not belong to the selected campus')
    this.name = 'AdministrativeUnitDoesNotBelongToCampusError'
  }
}
