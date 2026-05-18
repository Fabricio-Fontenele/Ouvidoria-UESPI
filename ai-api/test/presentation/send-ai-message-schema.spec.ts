import { describe, expect, it } from 'vitest'

import { sendAiMessageBodySchema } from '../../src/presentation/validators/send-ai-message-schema.js'

describe('sendAiMessageBodySchema', () => {
  const validBody = {
    history: [{ role: 'user' as const, content: 'Mensagem anterior' }],
    message: 'Quero abrir uma manifestacao.',
    campuses: [{ id: 'campus-parnaiba', label: 'Campus Parnaiba' }],
    administrativeUnits: [{ id: 'unit-1', label: 'Unidade 1', campusId: 'campus-parnaiba' }],
  }

  it('accepts a valid body', () => {
    expect(sendAiMessageBodySchema.safeParse(validBody).success).toBe(true)
  })

  it('rejects an empty or whitespace-only message', () => {
    expect(
      sendAiMessageBodySchema.safeParse({
        ...validBody,
        message: '   ',
      }).success,
    ).toBe(false)
  })

  it('rejects an empty or whitespace-only history content', () => {
    expect(
      sendAiMessageBodySchema.safeParse({
        ...validBody,
        history: [{ role: 'assistant' as const, content: '   ' }],
      }).success,
    ).toBe(false)
  })

  it('rejects history longer than 20 messages', () => {
    expect(
      sendAiMessageBodySchema.safeParse({
        ...validBody,
        history: Array.from({ length: 21 }, (_, index) => ({
          role: 'user' as const,
          content: `Mensagem ${String(index)}`,
        })),
      }).success,
    ).toBe(false)
  })

  it('rejects client role system', () => {
    expect(
      sendAiMessageBodySchema.safeParse({
        ...validBody,
        history: [{ role: 'system', content: 'nao permitido' }],
      }).success,
    ).toBe(false)
  })
})
