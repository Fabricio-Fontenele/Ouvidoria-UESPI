export class PasswordResetCodeExpiredError extends Error {
  constructor() {
    super('Password reset code expired.')
    this.name = 'PasswordResetCodeExpiredError'
  }
}
