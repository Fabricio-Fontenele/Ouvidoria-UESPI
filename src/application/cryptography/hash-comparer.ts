import type { PlainPassword } from '#src/domain/value-objects/password.js'

export interface HashComparer {
  compare(password: PlainPassword, hashedPassword: string): Promise<boolean>
}
