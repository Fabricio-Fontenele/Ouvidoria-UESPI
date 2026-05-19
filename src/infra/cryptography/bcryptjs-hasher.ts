import bcrypt from 'bcryptjs'

import type { HashComparer } from '#src/application/cryptography/hash-comparer.js'
import type { PasswordHasher } from '#src/application/cryptography/password-hasher.js'

export class BcryptjsHasher implements PasswordHasher, HashComparer {
  constructor(private readonly saltRounds = 10) {}

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds)
  }

  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }
}
