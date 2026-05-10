export class InvalidPageNumberError extends Error {
  constructor() {
    super('Page number must be greater than or equal to 1.')
    this.name = 'InvalidPageNumberError'
  }
}
