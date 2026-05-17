export class CampusNotFoundError extends Error {
  constructor() {
    super('Campus not found')
    this.name = 'CampusNotFoundError'
  }
}
