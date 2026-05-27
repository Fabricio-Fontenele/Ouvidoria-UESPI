import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { AiGateway } from '#src/application/ai/ai-gateway.js'
import type { PublicCatalogDTO } from '#src/application/dto/catalog-dtos.js'
import type { CatalogRepository } from '#src/application/repositories/catalog-repository.js'
import { SendAiMessageUseCase } from '#src/application/use-cases/send-ai-message/send-ai-message-use-case.js'
import { ManifestationType } from '#src/domain/entities/manifestation.js'
import { UserRole } from '#src/domain/entities/user.js'

describe('SendAiMessageUseCase', () => {
  let aiGateway: DeepMockProxy<AiGateway>
  let catalogRepository: DeepMockProxy<CatalogRepository>
  let sut: SendAiMessageUseCase

  const input = {
    history: [
      {
        role: 'user' as const,
        content: 'Quero reclamar do atendimento.',
      },
    ],
    message: 'Foi na coordenação de sistemas em Parnaíba.',
    userRole: null,
  }

  const publicCatalog: PublicCatalogDTO = {
    campuses: [
      {
        id: 'campus-professor-alexandre-alves-de-oliveira',
        label: 'Campus Professor Alexandre Alves de Oliveira',
        city: 'Parnaíba',
        administrativeUnits: [
          {
            id: 'unit-coordenacao-computacao-parnaiba',
            label: 'Coordenação do Curso de Ciência da Computação',
            description: null,
          },
        ],
      },
      {
        id: 'campus-poeta-torquato-neto',
        label: 'Campus Poeta Torquato Neto',
        city: 'Teresina',
        administrativeUnits: [{ id: 'unit-prad-teresina', label: 'Pró-Reitoria de Administração', description: null }],
      },
    ],
  }

  const campuses = [
    { id: 'campus-professor-alexandre-alves-de-oliveira', label: 'Campus Professor Alexandre Alves de Oliveira' },
    { id: 'campus-poeta-torquato-neto', label: 'Campus Poeta Torquato Neto' },
  ]

  const administrativeUnits = [
    {
      id: 'unit-coordenacao-computacao-parnaiba',
      label: 'Coordenação do Curso de Ciência da Computação',
      campusId: 'campus-professor-alexandre-alves-de-oliveira',
      description: null,
    },
    {
      id: 'unit-prad-teresina',
      label: 'Pró-Reitoria de Administração',
      campusId: 'campus-poeta-torquato-neto',
      description: null,
    },
  ]

  beforeEach(() => {
    aiGateway = mockDeep<AiGateway>()
    catalogRepository = mockDeep<CatalogRepository>()

    mockReset(aiGateway)
    mockReset(catalogRepository)

    catalogRepository.listPublic.mockResolvedValue(publicCatalog)

    sut = new SendAiMessageUseCase(aiGateway, catalogRepository)
  })

  it('returns a normalized institutional answer without a draft', async () => {
    aiGateway.chat.mockResolvedValue({
      answer: '  A biblioteca funciona de segunda a sexta, das 8h às 18h.  ',
      intent: 'institutional_question',
      shouldOpenManifestationDraft: false,
      draft: null,
      missingFields: [],
      confidence: 0.92,
      suggestions: [],
    })

    const result = await sut.execute(input)

    expect(catalogRepository.listPublic.mock.calls).toStrictEqual([[]])
    expect(aiGateway.chat.mock.calls).toStrictEqual([
      [
        {
          ...input,
          campuses,
          administrativeUnits,
        },
      ],
    ])
    expect(result).toStrictEqual({
      answer: 'A biblioteca funciona de segunda a sexta, das 8h às 18h.',
      intent: 'institutional_question',
      shouldOpenManifestationDraft: false,
      draft: null,
      missingFields: [],
      confidence: 0.92,
      suggestions: [
        {
          id: 'register-help',
          label: 'Quero registrar algo',
          message: 'Preciso de ajuda para registrar uma manifestação.',
        },
        { id: 'institutional-info', label: 'Dúvida institucional', message: 'Tenho uma dúvida sobre a Ouvidoria.' },
      ],
    })
  })

  it('forwards the userRole to the gateway for authenticated callers', async () => {
    aiGateway.chat.mockResolvedValue({
      answer: 'Resposta padrão.',
      intent: 'institutional_question',
      shouldOpenManifestationDraft: false,
      draft: null,
      missingFields: [],
      confidence: 0.5,
      suggestions: [],
    })

    await sut.execute({ ...input, userRole: UserRole.MANIFESTANT })

    expect(aiGateway.chat.mock.calls[0]?.[0].userRole).toBe(UserRole.MANIFESTANT)
  })

  it('ignores gateway draft payloads outside manifestation intents', async () => {
    aiGateway.chat.mockResolvedValue({
      answer: 'A biblioteca funciona até as 18h.',
      intent: 'institutional_question',
      shouldOpenManifestationDraft: true,
      draft: {
        type: ManifestationType.COMPLAINT,
        campusId: 'campus-professor-alexandre-alves-de-oliveira',
        administrativeUnitId: 'unit-coordenacao-computacao-parnaiba',
        description: 'Payload indevido para pergunta institucional.',
        involvedPeople: 'Coordenação',
      },
      missingFields: [],
      confidence: 0.8,
      suggestions: [],
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
        campusId: 'campus-professor-alexandre-alves-de-oliveira',
        administrativeUnitId: 'unit-coordenacao-computacao-parnaiba',
        description: 'Payload indevido para caso fora de escopo.',
        involvedPeople: null,
      },
      missingFields: [],
      confidence: 0.61,
      suggestions: [],
    })

    const result = await sut.execute(input)

    expect(result).toStrictEqual({
      answer: 'Esse caso precisa de atendimento humano.',
      intent: 'out_of_scope',
      shouldOpenManifestationDraft: false,
      draft: null,
      missingFields: [],
      confidence: 0.61,
      suggestions: [
        {
          id: 'register-help',
          label: 'Quero registrar algo',
          message: 'Preciso de ajuda para registrar uma manifestação.',
        },
        { id: 'institutional-info', label: 'Dúvida institucional', message: 'Tenho uma dúvida sobre a Ouvidoria.' },
      ],
    })
  })

  it('returns a ready draft only when all required fields are valid', async () => {
    aiGateway.chat.mockResolvedValue({
      answer: 'Entendi. Organizei um rascunho para você revisar.',
      intent: 'manifestation_draft_ready',
      shouldOpenManifestationDraft: true,
      draft: {
        type: ManifestationType.COMPLAINT,
        campusId: ' campus-professor-alexandre-alves-de-oliveira ',
        administrativeUnitId: ' unit-coordenacao-computacao-parnaiba ',
        description: '  O usuário relata demora no atendimento da coordenação.  ',
        involvedPeople: '  Coordenação de Sistemas  ',
      },
      missingFields: [],
      confidence: 0.86,
      suggestions: [],
    })

    const result = await sut.execute(input)

    expect(result).toStrictEqual({
      answer: 'Entendi. Organizei um rascunho para você revisar.',
      intent: 'manifestation_draft_ready',
      shouldOpenManifestationDraft: true,
      draft: {
        type: ManifestationType.COMPLAINT,
        campusId: 'campus-professor-alexandre-alves-de-oliveira',
        administrativeUnitId: 'unit-coordenacao-computacao-parnaiba',
        description: 'O usuário relata demora no atendimento da coordenação.',
        involvedPeople: 'Coordenação de Sistemas',
      },
      missingFields: [],
      confidence: 0.86,
      suggestions: [
        { id: 'confirm-open', label: 'Sim, quero abrir', message: 'Sim, pode abrir a manifestação.' },
        {
          id: 'refine-draft',
          label: 'Ajustar informações',
          message: 'Gostaria de ajustar algumas informações antes de abrir.',
        },
      ],
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
        administrativeUnitId: 'unit-coordenacao-computacao-parnaiba',
        description: '   ',
        involvedPeople: '   ',
      },
      missingFields: [],
      confidence: 0.7,
      suggestions: [],
    })

    const result = await sut.execute(input)

    expect(result).toStrictEqual({
      answer: 'Preciso de mais alguns dados antes de abrir o rascunho.',
      intent: 'manifestation_candidate',
      shouldOpenManifestationDraft: false,
      draft: {
        type: ManifestationType.COMPLAINT,
        campusId: null,
        administrativeUnitId: 'unit-coordenacao-computacao-parnaiba',
        description: null,
        involvedPeople: null,
      },
      missingFields: ['campusId', 'description'],
      confidence: 0.7,
      suggestions: [
        {
          id: 'provide-description',
          label: 'Contar mais detalhes',
          message: 'Vou contar mais detalhes sobre o que aconteceu.',
        },
        { id: 'doubt-process', label: 'Dúvida sobre o processo', message: 'Quais informações preciso fornecer?' },
      ],
    })
  })

  it('invalidates administrative units that do not belong to the selected campus', async () => {
    aiGateway.chat.mockResolvedValue({
      answer: 'Preciso ajustar a unidade administrativa antes de abrir o rascunho.',
      intent: 'manifestation_candidate',
      shouldOpenManifestationDraft: true,
      draft: {
        type: ManifestationType.COMPLAINT,
        campusId: 'campus-professor-alexandre-alves-de-oliveira',
        administrativeUnitId: 'unit-prad-teresina',
        description: 'O usuário relata demora no atendimento da coordenação.',
        involvedPeople: null,
      },
      missingFields: [],
      confidence: 0.78,
      suggestions: [],
    })

    const result = await sut.execute(input)

    expect(result).toStrictEqual({
      answer: 'Preciso ajustar a unidade administrativa antes de abrir o rascunho.',
      intent: 'manifestation_candidate',
      shouldOpenManifestationDraft: false,
      draft: {
        type: ManifestationType.COMPLAINT,
        campusId: 'campus-professor-alexandre-alves-de-oliveira',
        administrativeUnitId: null,
        description: 'O usuário relata demora no atendimento da coordenação.',
        involvedPeople: null,
      },
      missingFields: ['administrativeUnitId'],
      confidence: 0.78,
      suggestions: [
        { id: 'fill-missing', label: 'Preencher informações', message: 'Quais informações ainda estão faltando?' },
        { id: 'doubt-process', label: 'Dúvida sobre o processo', message: 'Me explique melhor como funciona.' },
      ],
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
      suggestions: [],
    })

    const result = await sut.execute(input)

    expect(result).toStrictEqual({
      answer: 'Não consigo responder com segurança.',
      intent: 'unknown',
      shouldOpenManifestationDraft: false,
      draft: null,
      missingFields: [],
      confidence: null,
      suggestions: [
        {
          id: 'register-help',
          label: 'Quero registrar algo',
          message: 'Preciso de ajuda para registrar uma manifestação.',
        },
        { id: 'institutional-info', label: 'Dúvida institucional', message: 'Tenho uma dúvida sobre a Ouvidoria.' },
      ],
    })
  })

  it('propagates gateway failures', async () => {
    const gatewayError = new Error('gateway failed')

    aiGateway.chat.mockRejectedValue(gatewayError)

    await expect(sut.execute(input)).rejects.toThrow(gatewayError)
  })

  it('propagates catalog repository failures before calling the gateway', async () => {
    const catalogError = new Error('catalog unavailable')

    catalogRepository.listPublic.mockRejectedValue(catalogError)

    await expect(sut.execute(input)).rejects.toThrow(catalogError)

    expect(aiGateway.chat.mock.calls).toHaveLength(0)
  })

  describe('history truncation', () => {
    const baseGatewayResponse = {
      answer: 'ok',
      intent: 'institutional_question' as const,
      shouldOpenManifestationDraft: false,
      draft: null,
      missingFields: [],
      confidence: 0.5,
      suggestions: [],
    }

    it('forwards the full history when it fits within historyMaxChars', async () => {
      const useCaseWithBudget = new SendAiMessageUseCase(aiGateway, catalogRepository, 10_000)
      aiGateway.chat.mockResolvedValue(baseGatewayResponse)

      const history = [
        { role: 'user' as const, content: 'a'.repeat(50) },
        { role: 'assistant' as const, content: 'b'.repeat(50) },
        { role: 'user' as const, content: 'c'.repeat(50) },
      ]

      await useCaseWithBudget.execute({ history, message: 'next', userRole: null })

      expect(aiGateway.chat.mock.calls[0]?.[0].history).toStrictEqual(history)
    })

    it('keeps only the most recent messages when historyMaxChars is exceeded', async () => {
      const useCaseWithBudget = new SendAiMessageUseCase(aiGateway, catalogRepository, 120)
      aiGateway.chat.mockResolvedValue(baseGatewayResponse)

      const history = [
        { role: 'user' as const, content: 'A'.repeat(80) },
        { role: 'assistant' as const, content: 'B'.repeat(80) },
        { role: 'user' as const, content: 'C'.repeat(80) },
      ]

      await useCaseWithBudget.execute({ history, message: 'next', userRole: null })

      const forwarded = aiGateway.chat.mock.calls[0]?.[0].history ?? []
      expect(forwarded.length).toBeLessThan(history.length)
      expect(forwarded.at(-1)?.content.startsWith('C')).toBe(true)
    })
  })
})
