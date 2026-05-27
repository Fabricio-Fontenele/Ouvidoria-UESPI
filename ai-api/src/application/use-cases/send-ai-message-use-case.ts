import type { AiChatRequest, AiChatUserRole } from '../dtos/ai-chat-request.js'
import {
  aiChatResponseSchema,
  NEUTRAL_FALLBACK_RESPONSE,
  REQUIRED_DRAFT_FIELDS,
  type AiChatDraft,
  type AiChatIntent,
  type AiChatResponse,
  type AiChatSuggestion,
  type ManifestationType,
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

    return this.sanitize(parsed.data, catalog, request.userRole)
  }

  private sanitize(response: AiChatResponse, catalog: CatalogContext, userRole: AiChatUserRole): AiChatResponse {
    const isDraftIntent =
      response.intent === 'manifestation_candidate' || response.intent === 'manifestation_draft_ready'

    let draft = isDraftIntent ? this.sanitizeDraft(response.draft, catalog) : null
    if (draft !== null && !this.isDraftAllowedForRole(userRole, draft.type)) {
      draft = null
    }
    const missingFields = this.computeMissingFields(response.intent, draft)
    const shouldOpenManifestationDraft =
      response.intent === 'manifestation_draft_ready' &&
      response.shouldOpenManifestationDraft &&
      draft !== null &&
      missingFields.length === 0

    const suggestions = this.sanitizeSuggestions(response.suggestions, response.intent, draft, missingFields, userRole)

    return {
      answer: response.answer.trim(),
      intent: response.intent,
      confidence: response.confidence,
      shouldOpenManifestationDraft,
      draft,
      missingFields,
      suggestions,
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

  /**
   * Role→type policy, enforced deterministically. The prompt (PERFIL DO USUÁRIO in
   * rag-prompt-builder) asks the model to honor this, but the LLM is not reliable —
   * anonymous callers occasionally produced a `complaint` draft. Mirrors those rules:
   * - ombudsman/admin: informative only, never a draft;
   * - anonymous (null): only `report` (denúncia). A still-undetermined (`null`) type
   *   stays allowed while the draft is assembled, so the legit anonymous denúncia flow
   *   is not broken;
   * - manifestant: any type.
   */
  private isDraftAllowedForRole(userRole: AiChatUserRole, type: ManifestationType | null): boolean {
    if (userRole === 'ombudsman' || userRole === 'admin') {
      return false
    }
    if (userRole === null) {
      return type === null || type === 'report'
    }
    return true
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

  private sanitizeSuggestions(
    suggestions: AiChatSuggestion[],
    intent: AiChatIntent,
    draft: AiChatDraft | null,
    missingFields: RequiredDraftField[],
    userRole: AiChatUserRole,
  ): AiChatSuggestion[] {
    if (suggestions.length > 0) {
      const seenLabels = new Set<string>()
      const seenIds = new Set<string>()
      const sanitized: AiChatSuggestion[] = []
      for (const s of suggestions) {
        const id = s.id.trim()
        const label = s.label.trim()
        const message = s.message.trim()
        if (id.length === 0 || label.length === 0 || message.length === 0) {
          continue
        }
        const normalizedLabel = label.toLowerCase()
        if (seenLabels.has(normalizedLabel) || seenIds.has(id)) {
          continue
        }
        seenLabels.add(normalizedLabel)
        seenIds.add(id)
        sanitized.push({ id, label, message })
      }
      if (sanitized.length > 0) {
        return sanitized.slice(0, 4)
      }
    }

    return this.fallbackSuggestions(intent, draft, missingFields, userRole)
  }

  private fallbackSuggestions(
    intent: AiChatIntent,
    draft: AiChatDraft | null,
    missingFields: RequiredDraftField[],
    userRole: AiChatUserRole,
  ): AiChatSuggestion[] {
    const isAdminProfile = userRole === 'ombudsman' || userRole === 'admin'

    if (intent === 'manifestation_draft_ready' && !isAdminProfile && draft !== null && missingFields.length === 0) {
      return [
        { id: 'confirm-open', label: 'Sim, quero abrir', message: 'Sim, pode abrir a manifestação.' },
        {
          id: 'refine-draft',
          label: 'Ajustar informações',
          message: 'Gostaria de ajustar algumas informações antes de abrir.',
        },
      ]
    }

    if (intent === 'manifestation_candidate' && !isAdminProfile && missingFields.length > 0) {
      if (missingFields.includes('description')) {
        return [
          {
            id: 'provide-description',
            label: 'Contar mais detalhes',
            message: 'Vou contar mais detalhes sobre o que aconteceu.',
          },
          { id: 'doubt-process', label: 'Dúvida sobre o processo', message: 'Quais informações preciso fornecer?' },
        ]
      }
      return [
        { id: 'fill-missing', label: 'Preencher informações', message: 'Quais informações ainda estão faltando?' },
        { id: 'doubt-process', label: 'Dúvida sobre o processo', message: 'Me explique melhor como funciona.' },
      ]
    }

    return [
      {
        id: 'register-help',
        label: 'Quero registrar algo',
        message: 'Preciso de ajuda para registrar uma manifestação.',
      },
      { id: 'institutional-info', label: 'Dúvida institucional', message: 'Tenho uma dúvida sobre a Ouvidoria.' },
    ]
  }
}
