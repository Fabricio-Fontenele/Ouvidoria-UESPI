import { randomUUID } from 'node:crypto'

import type { ProtocolGenerator } from '#src/application/protocol/protocol-generator.js'

export class UuidProtocolGenerator implements ProtocolGenerator {
  async generate(): Promise<string> {
    const year = new Date().getUTCFullYear().toString()
    const random = randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()
    return `OUV-${year}-${random}`
  }
}
