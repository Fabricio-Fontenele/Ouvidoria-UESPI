export class InvalidEmailVerificationCodeError extends Error {
  constructor() {
    super('Invalid email verification code.')
    this.name = 'InvalidEmailVerificationCodeError'
  }
}
