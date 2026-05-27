export class EmailVerificationCodeExpiredError extends Error {
  constructor() {
    super('Email verification code expired.')
    this.name = 'EmailVerificationCodeExpiredError'
  }
}
