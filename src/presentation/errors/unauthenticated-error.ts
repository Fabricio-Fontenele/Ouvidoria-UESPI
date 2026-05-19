export class UnauthenticatedError extends Error {
  constructor() {
    super('Authentication required.')
    this.name = 'UnauthenticatedError'
  }
}
