import jwt from 'jsonwebtoken'

import type { AccessTokenPayload, TokenGenerator } from '#src/application/auth/token-generator.js'

export interface JwtTokenGeneratorOptions {
  secret: string
  expiresInSeconds: number
}

export class JwtTokenGenerator implements TokenGenerator {
  constructor(private readonly options: JwtTokenGeneratorOptions) {}

  async generate(payload: AccessTokenPayload): Promise<string> {
    return jwt.sign(payload, this.options.secret, { expiresIn: this.options.expiresInSeconds })
  }
}
