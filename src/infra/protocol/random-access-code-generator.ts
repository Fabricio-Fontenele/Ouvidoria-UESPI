import { randomBytes } from 'node:crypto'

import type { AccessCodeGenerator } from '#src/application/protocol/access-code-generator.js'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 10

export class RandomAccessCodeGenerator implements AccessCodeGenerator {
  async generate(): Promise<string> {
    const bytes = randomBytes(CODE_LENGTH)
    let code = ''
    for (let i = 0; i < CODE_LENGTH; i++) {
      const byte = bytes[i] ?? 0
      code += ALPHABET[byte % ALPHABET.length] ?? ''
    }
    return code
  }
}
