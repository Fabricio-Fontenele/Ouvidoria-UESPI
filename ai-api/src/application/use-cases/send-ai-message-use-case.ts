import type { AiChatRequest } from '../dtos/ai-chat-request.js'
import {
  aiChatResponseSchema,
  NEUTRAL_FALLBACK_RESPONSE,
  REQUIRED_DRAFT_FIELDS,
  type AiChatDraft,
  type AiChatIntent,
  type AiChatResponse,
  type RequiredDraftField,
} from '../dtos/ai-chat-response.js'
import type { CatalogContext } from '../ports/catalog-context.js'
import type { KnowledgeRetriever } from '../ports/knowledge-retriever.js'
import type { LlmProvider } from '../ports/llm-provider.js'

interface RagPromptBuilderPort {
  build(input: {
    history: AiChatRequest['history']
    message: AiChatRequest['message']
    userRole: AiChatRequest['userRole']
    contextChunks: Awaited<ReturnType<KnowledgeRetriever['retrieve']>>
    catalog: CatalogContext
  }): { systemPrompt: string; userPrompt: string }
}

export interface SendAiMessageUseCaseDeps {
  retriever: KnowledgeRetriever
  llm: LlmProvider
  promptBuilder: RagPromptBuilderPort
  retrievalTopK: number
}

export class SendAiMessageUseCase {
  constructor(private readonly deps: SendAiMessageUseCaseDeps) {}

  async execute(request: AiChatRequest): Promise<AiChatResponse> {
    const { retriever, llm, promptBuilder, retrievalTopK } = this.deps

    const catalog: CatalogContext = {
      campuses: request.campuses,
      administrativeUnits: request.administrativeUnits,
    }

    const contextChunks = await retriever.retrieve(request.message, retrievalTopK)

    const { systemPrompt, userPrompt } = promptBuilder.build({
      history: request.history,
      message: request.message,
      userRole: request.userRole,
      contextChunks,
      catalog,
    })

    const raw = await llm.completeStructured({ systemPrompt, userPrompt })

    const parsed = aiChatResponseSchema.safeParse(raw)
    if (!parsed.success) {
      return NEUTRAL_FALLBACK_RESPONSE
    }

    return this.sanitize(parsed.data, catalog)
  }

  private sanitize(response: AiChatResponse, catalog: CatalogContext): AiChatResponse {
    const isDraftIntent =
      response.intent === 'manifestation_candidate' || response.intent === 'manifestation_draft_ready'

    const draft = isDraftIntent ? this.sanitizeDraft(response.draft, catalog) : null
    const missingFields = this.computeMissingFields(response.intent, draft)
    const shouldOpenManifestationDraft =
      response.intent === 'manifestation_draft_ready' &&
      response.shouldOpenManifestationDraft &&
      draft !== null &&
      missingFields.length === 0

    return {
      answer: response.answer.trim(),
      intent: response.intent,
      confidence: response.confidence,
      shouldOpenManifestationDraft,
      draft,
      missingFields,
    }
  }

  private sanitizeDraft(draft: AiChatDraft | null, catalog: CatalogContext): AiChatDraft | null {
    if (draft === null) {
      return null
    }

    const validCampusIds = new Set(catalog.campuses.map((campus) => campus.id))
    const validUnitsByCampus = new Map<string, Set<string>>()
    for (const unit of catalog.administrativeUnits) {
      const set = validUnitsByCampus.get(unit.campusId) ?? new Set<string>()
      set.add(unit.id)
      validUnitsByCampus.set(unit.campusId, set)
    }

    const campusId = draft.campusId !== null && validCampusIds.has(draft.campusId) ? draft.campusId : null
    const allowedUnits = campusId === null ? null : (validUnitsByCampus.get(campusId) ?? new Set<string>())
    const administrativeUnitId =
      draft.administrativeUnitId !== null && allowedUnits !== null && allowedUnits.has(draft.administrativeUnitId)
        ? draft.administrativeUnitId
        : null

    const sanitized: AiChatDraft = {
      type: draft.type,
      campusId,
      administrativeUnitId,
      description: draft.description !== null ? draft.description.trim() || null : null,
      involvedPeople: draft.involvedPeople !== null ? draft.involvedPeople.trim() || null : null,
    }

    const hasAnyFilledField = Object.values(sanitized).some((value) => value !== null)
    return hasAnyFilledField ? sanitized : null
  }

  private computeMissingFields(intent: AiChatIntent, draft: AiChatDraft | null): RequiredDraftField[] {
    if (intent !== 'manifestation_candidate' && intent !== 'manifestation_draft_ready') {
      return []
    }
    if (draft === null) {
      return [...REQUIRED_DRAFT_FIELDS]
    }
    return REQUIRED_DRAFT_FIELDS.filter((field) => draft[field] === null)
  }
}
