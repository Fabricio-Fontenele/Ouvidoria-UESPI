import { randomInt } from 'node:crypto'

import type { VerificationCodeGenerator } from '#src/application/protocol/verification-code-generator.js'

export class RandomVerificationCodeGenerator implements VerificationCodeGenerator {
  async generate(): Promise<string> {
    return randomInt(0, 1_000_000).toString().padStart(6, '0')
  }
}
