import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { AiGateway } from '#src/application/ai/ai-gateway.js'
import { SendAiMessageUseCase } from '#src/application/use-cases/send-ai-message/send-ai-message-use-case.js'
import { ManifestationType } from '#src/domain/entities/manifestation.js'

describe('SendAiMessageUseCase', () => {
  let aiGateway: DeepMockProxy<AiGateway>
  let sut: SendAiMessageUseCase

  const input = {
    history: [
      {
        role: 'user' as const,
        content: 'Quero reclamar do atendimento.',
      },
    ],
    message: 'Foi na coordenação de sistemas em Parnaíba.',
    campuses: [
      { id: 'campus-parnaiba', label: 'Campus Parnaíba' },
      { id: 'campus-teresina', label: 'Campus Teresina' },
    ],
    administrativeUnits: [
      { id: 'coord-sistemas', label: 'Coordenação de Sistemas', campusId: 'campus-parnaiba' },
      { id: 'biblioteca-central', label: 'Biblioteca Central', campusId: 'campus-teresina' },
    ],
  }

  beforeEach(() => {
    aiGateway = mockDeep<AiGateway>()
    mockReset(aiGateway)

    sut = new SendAiMessageUseCase(aiGateway)
  })

  it('returns a normalized institutional answer without a draft', async () => {
    aiGateway.chat.mockResolvedValue({
      answer: '  A biblioteca funciona de segunda a sexta, das 8h às 18h.  ',
      intent: 'institutional_question',
      shouldOpenManifestationDraft: false,
      draft: null,
      missingFields: [],
      confidence: 0.92,
    })

    const result = await sut.execute(input)

    expect(aiGateway.chat.mock.calls).toStrictEqual([[input]])
    expect(result).toStrictEqual({
      answer: 'A biblioteca funciona de segunda a sexta, das 8h às 18h.',
      intent: 'institutional_question',
      shouldOpenManifestationDraft: false,
      draft: null,
      missingFields: [],
      confidence: 0.92,
    })
  })

  it('ignores gateway draft payloads outside manifestation intents', async () => {
    aiGateway.chat.mockResolvedValue({
      answer: 'A biblioteca funciona até as 18h.',
      intent: 'institutional_question',
      shouldOpenManifestationDraft: true,
      draft: {
        type: ManifestationType.COMPLAINT,
        campusId: 'campus-parnaiba',
        administrativeUnitId: 'coord-sistemas',
        description: 'Payload indevido para pergunta institucional.',
        involvedPeople: 'Coordenação',
      },
      missingFields: [],
      confidence: 0.8,
    })

    const result = await sut.execute(input)

    expect(result.draft).toBeNull()
    expect(result.shouldOpenManifestationDraft).toBe(false)
    expect(result.missingFields).toStrictEqual([])
  })

  it('does not open a draft for out-of-scope answers', async () => {
    aiGateway.chat.mockResolvedValue({
      answer: 'Esse caso precisa de atendimento humano.',
      intent: 'out_of_scope',
      shouldOpenManifestationDraft: true,
      draft: {
        type: ManifestationType.COMPLAINT,
        campusId: 'campus-parnaiba',
        administrativeUnitId: 'coord-sistemas',
        description: 'Payload indevido para caso fora de escopo.',
        involvedPeople: null,
      },
      missingFields: [],
      confidence: 0.61,
    })

    const result = await sut.execute(input)

    expect(result).toStrictEqual({
      answer: 'Esse caso precisa de atendimento humano.',
      intent: 'out_of_scope',
      shouldOpenManifestationDraft: false,
      draft: null,
      missingFields: [],
      confidence: 0.61,
    })
  })

  it('returns a ready draft only when all required fields are valid', async () => {
    aiGateway.chat.mockResolvedValue({
      answer: 'Entendi. Organizei um rascunho para você revisar.',
      intent: 'manifestation_draft_ready',
      shouldOpenManifestationDraft: true,
      draft: {
        type: ManifestationType.COMPLAINT,
        campusId: ' campus-parnaiba ',
        administrativeUnitId: ' coord-sistemas ',
        description: '  O usuário relata demora no atendimento da coordenação.  ',
        involvedPeople: '  Coordenação de Sistemas  ',
      },
      missingFields: [],
      confidence: 0.86,
    })

    const result = await sut.execute(input)

    expect(result).toStrictEqual({
      answer: 'Entendi. Organizei um rascunho para você revisar.',
      intent: 'manifestation_draft_ready',
      shouldOpenManifestationDraft: true,
      draft: {
        type: ManifestationType.COMPLAINT,
        campusId: 'campus-parnaiba',
        administrativeUnitId: 'coord-sistemas',
        description: 'O usuário relata demora no atendimento da coordenação.',
        involvedPeople: 'Coordenação de Sistemas',
      },
      missingFields: [],
      confidence: 0.86,
    })
  })

  it('keeps partial drafts closed and reports normalized missing fields', async () => {
    aiGateway.chat.mockResolvedValue({
      answer: 'Preciso de mais alguns dados antes de abrir o rascunho.',
      intent: 'manifestation_candidate',
      shouldOpenManifestationDraft: true,
      draft: {
        type: ManifestationType.COMPLAINT,
        campusId: 'campus-inexistente',
        administrativeUnitId: 'coord-sistemas',
        description: '   ',
        involvedPeople: '   ',
      },
      missingFields: [],
      confidence: 0.7,
    })

    const result = await sut.execute(input)

    expect(result).toStrictEqual({
      answer: 'Preciso de mais alguns dados antes de abrir o rascunho.',
      intent: 'manifestation_candidate',
      shouldOpenManifestationDraft: false,
      draft: {
        type: ManifestationType.COMPLAINT,
        campusId: null,
        administrativeUnitId: 'coord-sistemas',
        description: null,
        involvedPeople: null,
      },
      missingFields: ['campusId', 'description'],
      confidence: 0.7,
    })
  })

  it('invalidates administrative units that do not belong to the selected campus', async () => {
    aiGateway.chat.mockResolvedValue({
      answer: 'Preciso ajustar a unidade administrativa antes de abrir o rascunho.',
      intent: 'manifestation_candidate',
      shouldOpenManifestationDraft: true,
      draft: {
        type: ManifestationType.COMPLAINT,
        campusId: 'campus-parnaiba',
        administrativeUnitId: 'biblioteca-central',
        description: 'O usuário relata demora no atendimento da coordenação.',
        involvedPeople: null,
      },
      missingFields: [],
      confidence: 0.78,
    })

    const result = await sut.execute(input)

    expect(result).toStrictEqual({
      answer: 'Preciso ajustar a unidade administrativa antes de abrir o rascunho.',
      intent: 'manifestation_candidate',
      shouldOpenManifestationDraft: false,
      draft: {
        type: ManifestationType.COMPLAINT,
        campusId: 'campus-parnaiba',
        administrativeUnitId: null,
        description: 'O usuário relata demora no atendimento da coordenação.',
        involvedPeople: null,
      },
      missingFields: ['administrativeUnitId'],
      confidence: 0.78,
    })
  })

  it('normalizes unknown intents and invalid confidence safely', async () => {
    aiGateway.chat.mockResolvedValue({
      answer: 'Não consigo responder com segurança.',
      intent: 'something-new',
      shouldOpenManifestationDraft: false,
      draft: {
        type: 'invalid-type',
        campusId: null,
        administrativeUnitId: null,
        description: null,
        involvedPeople: null,
      },
      missingFields: [],
      confidence: 1.5,
    })

    const result = await sut.execute(input)

    expect(result).toStrictEqual({
      answer: 'Não consigo responder com segurança.',
      intent: 'unknown',
      shouldOpenManifestationDraft: false,
      draft: null,
      missingFields: [],
      confidence: null,
    })
  })

  it('propagates gateway failures', async () => {
    const gatewayError = new Error('gateway failed')

    aiGateway.chat.mockRejectedValue(gatewayError)

    await expect(sut.execute(input)).rejects.toThrow(gatewayError)
  })
})
