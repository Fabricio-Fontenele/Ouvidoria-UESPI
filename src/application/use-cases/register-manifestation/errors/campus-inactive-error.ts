export class CampusInactiveError extends Error {
  constructor() {
    super('Campus is inactive')
    this.name = 'CampusInactiveError'
  }
}
