export class InvalidPasswordResetCodeError extends Error {
  constructor() {
    super('Invalid password reset code.')
    this.name = 'InvalidPasswordResetCodeError'
  }
}
