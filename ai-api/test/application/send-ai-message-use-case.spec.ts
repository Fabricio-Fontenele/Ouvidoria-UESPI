import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AiChatResponse } from '../../src/application/dtos/ai-chat-response.js'
import { NEUTRAL_FALLBACK_RESPONSE } from '../../src/application/dtos/ai-chat-response.js'
import type { CatalogContext } from '../../src/application/ports/catalog-context.js'
import type { RetrievedChunk } from '../../src/application/ports/knowledge-retriever.js'
import type { StructuredCompletionInput } from '../../src/application/ports/llm-provider.js'
import { SendAiMessageUseCase } from '../../src/application/use-cases/send-ai-message-use-case.js'

describe('SendAiMessageUseCase', () => {
  const catalog: CatalogContext = {
    campuses: [
      { id: 'campus-parnaiba', label: 'Campus Parnaiba' },
      { id: 'campus-teresina', label: 'Campus Teresina' },
    ],
    administrativeUnits: [
      { id: 'unit-direcao-parnaiba', label: 'Direcao Parnaiba', campusId: 'campus-parnaiba' },
      { id: 'unit-prad-teresina', label: 'PRAD Teresina', campusId: 'campus-teresina' },
    ],
  }

  const request = {
    history: [{ role: 'user' as const, content: 'Como acompanho meu protocolo?' }],
    message: 'Quero saber o prazo de resposta da ouvidoria.',
    userRole: null,
    campuses: catalog.campuses,
    administrativeUnits: catalog.administrativeUnits,
  }

  const contextChunks: RetrievedChunk[] = [
    { content: 'Prazo de resposta: 20 dias.', score: 0.01, source: 'regimento.md' },
  ]

  type RetrieverMock = ReturnType<typeof vi.fn<(query: string, k: number) => Promise<RetrievedChunk[]>>>
  type LlmMock = ReturnType<typeof vi.fn<(input: StructuredCompletionInput) => Promise<AiChatResponse>>>
  type PromptBuilderMock = ReturnType<
    typeof vi.fn<
      (input: {
        history: typeof request.history
        message: string
        userRole: typeof request.userRole
        contextChunks: RetrievedChunk[]
        catalog: CatalogContext
      }) => { systemPrompt: string; userPrompt: string }
    >
  >

  let retrieverRetrieve: RetrieverMock
  let llmCompleteStructured: LlmMock
  let promptBuild: PromptBuilderMock
  let sut: SendAiMessageUseCase

  beforeEach(() => {
    retrieverRetrieve = vi
      .fn<(query: string, k: number) => Promise<RetrievedChunk[]>>()
      .mockResolvedValue(contextChunks)
    llmCompleteStructured = vi.fn<(input: StructuredCompletionInput) => Promise<AiChatResponse>>()
    promptBuild = vi
      .fn<
        (input: {
          history: typeof request.history
          message: string
          userRole: typeof request.userRole
          contextChunks: RetrievedChunk[]
          catalog: CatalogContext
        }) => { systemPrompt: string; userPrompt: string }
      >()
      .mockReturnValue({
        systemPrompt: 'system prompt',
        userPrompt: 'user prompt',
      })

    sut = new SendAiMessageUseCase({
      retriever: {
        retrieve: retrieverRetrieve,
      },
      llm: {
        completeStructured: llmCompleteStructured,
      },
      promptBuilder: {
        build: promptBuild,
      },
      retrievalTopK: 4,
    })
  })

  it('returns an institutional response and wires retriever, prompt builder, and llm correctly', async () => {
    llmCompleteStructured.mockResolvedValue({
      answer: '  O prazo e de 20 dias.  ',
      intent: 'institutional_question',
      confidence: 0.7,
      shouldOpenManifestationDraft: false,
      draft: null,
      missingFields: [],
    })

    const result = await sut.execute(request)

    expect(retrieverRetrieve).toHaveBeenCalledWith(request.message, 4)
    expect(promptBuild).toHaveBeenCalledWith({
      history: request.history,
      message: request.message,
      userRole: null,
      contextChunks,
      catalog,
    })
    expect(llmCompleteStructured).toHaveBeenCalledWith({
      systemPrompt: 'system prompt',
      userPrompt: 'user prompt',
    })
    expect(result).toStrictEqual({
      answer: 'O prazo e de 20 dias.',
      intent: 'institutional_question',
      confidence: 0.7,
      shouldOpenManifestationDraft: false,
      draft: null,
      missingFields: [],
    })
  })

  it('returns a draft ready response when all required fields are valid', async () => {
    llmCompleteStructured.mockResolvedValue({
      answer: 'Rascunho pronto.',
      intent: 'manifestation_draft_ready',
      confidence: 0.91,
      shouldOpenManifestationDraft: true,
      draft: {
        type: 'complaint',
        campusId: 'campus-parnaiba',
        administrativeUnitId: 'unit-direcao-parnaiba',
        description: ' Demora no atendimento. ',
        involvedPeople: ' Servidor do protocolo ',
      },
      missingFields: [],
    })

    const result = await sut.execute(request)

    expect(result).toStrictEqual({
      answer: 'Rascunho pronto.',
      intent: 'manifestation_draft_ready',
      confidence: 0.91,
      shouldOpenManifestationDraft: true,
      draft: {
        type: 'complaint',
        campusId: 'campus-parnaiba',
        administrativeUnitId: 'unit-direcao-parnaiba',
        description: 'Demora no atendimento.',
        involvedPeople: 'Servidor do protocolo',
      },
      missingFields: [],
    })
  })

  it('keeps a manifestation candidate closed when a required field is missing', async () => {
    llmCompleteStructured.mockResolvedValue({
      answer: 'Preciso de mais detalhes.',
      intent: 'manifestation_candidate',
      confidence: 0.62,
      shouldOpenManifestationDraft: true,
      draft: {
        type: 'complaint',
        campusId: 'campus-parnaiba',
        administrativeUnitId: 'unit-direcao-parnaiba',
        description: '   ',
        involvedPeople: null,
      },
      missingFields: [],
    })

    const result = await sut.execute(request)

    expect(result).toStrictEqual({
      answer: 'Preciso de mais detalhes.',
      intent: 'manifestation_candidate',
      confidence: 0.62,
      shouldOpenManifestationDraft: false,
      draft: {
        type: 'complaint',
        campusId: 'campus-parnaiba',
        administrativeUnitId: 'unit-direcao-parnaiba',
        description: null,
        involvedPeople: null,
      },
      missingFields: ['description'],
    })
  })

  it('sanitizes an invented campus id and recalculates missing fields', async () => {
    llmCompleteStructured.mockResolvedValue({
      answer: 'Ainda faltam dados.',
      intent: 'manifestation_candidate',
      confidence: 0.5,
      shouldOpenManifestationDraft: true,
      draft: {
        type: 'complaint',
        campusId: 'campus-inventado',
        administrativeUnitId: 'unit-direcao-parnaiba',
        description: 'Problema no atendimento.',
        involvedPeople: null,
      },
      missingFields: [],
    })

    const result = await sut.execute(request)

    expect(result).toStrictEqual({
      answer: 'Ainda faltam dados.',
      intent: 'manifestation_candidate',
      confidence: 0.5,
      shouldOpenManifestationDraft: false,
      draft: {
        type: 'complaint',
        campusId: null,
        administrativeUnitId: null,
        description: 'Problema no atendimento.',
        involvedPeople: null,
      },
      missingFields: ['campusId', 'administrativeUnitId'],
    })
  })

  it('sanitizes an invented administrative unit id', async () => {
    llmCompleteStructured.mockResolvedValue({
      answer: 'Ainda falta a unidade.',
      intent: 'manifestation_candidate',
      confidence: 0.58,
      shouldOpenManifestationDraft: true,
      draft: {
        type: 'complaint',
        campusId: 'campus-parnaiba',
        administrativeUnitId: 'unit-inventada',
        description: 'Problema no atendimento.',
        involvedPeople: null,
      },
      missingFields: [],
    })

    const result = await sut.execute(request)

    expect(result).toStrictEqual({
      answer: 'Ainda falta a unidade.',
      intent: 'manifestation_candidate',
      confidence: 0.58,
      shouldOpenManifestationDraft: false,
      draft: {
        type: 'complaint',
        campusId: 'campus-parnaiba',
        administrativeUnitId: null,
        description: 'Problema no atendimento.',
        involvedPeople: null,
      },
      missingFields: ['administrativeUnitId'],
    })
  })

  it('sanitizes an administrative unit that does not belong to the selected campus', async () => {
    llmCompleteStructured.mockResolvedValue({
      answer: 'A unidade nao pertence ao campus.',
      intent: 'manifestation_candidate',
      confidence: 0.64,
      shouldOpenManifestationDraft: true,
      draft: {
        type: 'complaint',
        campusId: 'campus-parnaiba',
        administrativeUnitId: 'unit-prad-teresina',
        description: 'Problema no atendimento.',
        involvedPeople: null,
      },
      missingFields: [],
    })

    const result = await sut.execute(request)

    expect(result).toStrictEqual({
      answer: 'A unidade nao pertence ao campus.',
      intent: 'manifestation_candidate',
      confidence: 0.64,
      shouldOpenManifestationDraft: false,
      draft: {
        type: 'complaint',
        campusId: 'campus-parnaiba',
        administrativeUnitId: null,
        description: 'Problema no atendimento.',
        involvedPeople: null,
      },
      missingFields: ['administrativeUnitId'],
    })
  })

  it('falls back to the neutral unknown payload when the llm payload does not match the schema', async () => {
    llmCompleteStructured.mockResolvedValue({
      answer: 'payload invalido',
      intent: 'invalid-intent',
      confidence: 0.4,
      shouldOpenManifestationDraft: false,
      draft: null,
      missingFields: [],
    } as never)

    const result = await sut.execute(request)

    expect(result).toStrictEqual(NEUTRAL_FALLBACK_RESPONSE)
  })

  it('only keeps shouldOpenManifestationDraft true when the draft is complete and valid', async () => {
    llmCompleteStructured.mockResolvedValue({
      answer: 'Rascunho inconsistente.',
      intent: 'manifestation_draft_ready',
      confidence: 0.77,
      shouldOpenManifestationDraft: true,
      draft: {
        type: 'complaint',
        campusId: 'campus-parnaiba',
        administrativeUnitId: 'unit-prad-teresina',
        description: 'Problema no atendimento.',
        involvedPeople: null,
      },
      missingFields: [],
    })

    const result = await sut.execute(request)

    expect(result.intent).toBe('manifestation_draft_ready')
    expect(result.shouldOpenManifestationDraft).toBe(false)
    expect(result.missingFields).toStrictEqual(['administrativeUnitId'])
  })
})
