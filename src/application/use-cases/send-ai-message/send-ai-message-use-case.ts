import type {
  AiChatIntent,
  AiChatMessage,
  AiChatUserRole,
  AiDraftPayload,
  AiGateway,
} from '#src/application/ai/ai-gateway.js'
import type {
  CatalogAdministrativeUnitItemDTO,
  CatalogCampusItemDTO,
  PublicCatalogDTO,
} from '#src/application/dto/catalog-dtos.js'
import type { CatalogRepository } from '#src/application/repositories/catalog-repository.js'
import { ManifestationType } from '#src/domain/entities/manifestation.js'
import { AdministrativeUnitId } from '#src/domain/value-objects/administrative-unit-id.js'
import { CampusId } from '#src/domain/value-objects/campus-id.js'
import { ManifestationDescription } from '#src/domain/value-objects/manifestation-description.js'
import { ManifestationInvolvedPeople } from '#src/domain/value-objects/manifestation-involved-people.js'

import type { UseCase } from '../use-case.js'

const REQUIRED_DRAFT_FIELDS = ['type', 'campusId', 'administrativeUnitId', 'description'] as const

type RequiredDraftField = (typeof REQUIRED_DRAFT_FIELDS)[number]

export interface SendAiMessageInput {
  history: AiChatMessage[]
  message: string
  userRole: AiChatUserRole
}

export interface SendAiMessageOutput {
  answer: string
  intent: AiChatIntent
  shouldOpenManifestationDraft: boolean
  draft: AiDraftPayload | null
  missingFields: RequiredDraftField[]
  confidence: number | null
}

export class SendAiMessageUseCase implements UseCase<SendAiMessageInput, SendAiMessageOutput> {
  constructor(
    private readonly aiGateway: AiGateway,
    private readonly catalogRepository: CatalogRepository,
    private readonly historyMaxChars: number = 12_000,
  ) {}

  async execute({ history, message, userRole }: SendAiMessageInput): Promise<SendAiMessageOutput> {
    const { campuses, administrativeUnits } = this.flattenCatalog(await this.catalogRepository.listPublic())

    const truncatedHistory = this.truncateHistory(history, this.historyMaxChars)

    const response = await this.aiGateway.chat({
      history: truncatedHistory,
      message,
      userRole,
      campuses,
      administrativeUnits,
    })

    const intent = this.normalizeIntent(response.intent)
    const isDraftIntent = intent === 'manifestation_candidate' || intent === 'manifestation_draft_ready'
    const draft = isDraftIntent ? this.normalizeDraft(response.draft, campuses, administrativeUnits) : null
    const missingFields = this.getMissingFields(intent, draft)
    const shouldOpenManifestationDraft =
      intent === 'manifestation_draft_ready' &&
      response.shouldOpenManifestationDraft &&
      draft !== null &&
      missingFields.length === 0

    return {
      answer: response.answer.trim(),
      intent,
      shouldOpenManifestationDraft,
      draft,
      missingFields,
      confidence: this.normalizeConfidence(response.confidence),
    }
  }

  private flattenCatalog(publicCatalog: PublicCatalogDTO): {
    campuses: CatalogCampusItemDTO[]
    administrativeUnits: CatalogAdministrativeUnitItemDTO[]
  } {
    const campuses = publicCatalog.campuses.map(({ id, label }) => ({ id, label }))
    const administrativeUnits = publicCatalog.campuses.flatMap((campus) => {
      return campus.administrativeUnits.map((administrativeUnit) => ({
        ...administrativeUnit,
        campusId: campus.id,
      }))
    })

    return { campuses, administrativeUnits }
  }

  private normalizeIntent(intent: string): AiChatIntent {
    switch (intent) {
      case 'institutional_question':
      case 'manifestation_candidate':
      case 'manifestation_draft_ready':
      case 'out_of_scope':
      case 'unknown':
        return intent
      default:
        return 'unknown'
    }
  }

  private normalizeDraft(
    draft: {
      type: string | null
      campusId: string | null
      administrativeUnitId: string | null
      description: string | null
      involvedPeople: string | null
    } | null,
    campuses: CatalogCampusItemDTO[],
    administrativeUnits: CatalogAdministrativeUnitItemDTO[],
  ): AiDraftPayload | null {
    if (draft === null) {
      return null
    }

    const campusId = this.normalizeCatalogId(draft.campusId, campuses, (value) => {
      CampusId.create(value)
    })
    const administrativeUnitId = this.normalizeAdministrativeUnitId(
      draft.administrativeUnitId,
      campusId,
      administrativeUnits,
    )

    const normalizedDraft: AiDraftPayload = {
      type: this.normalizeManifestationType(draft.type),
      campusId,
      administrativeUnitId,
      description: this.normalizeOptionalText(draft.description, (value) => {
        ManifestationDescription.create(value)
      }),
      involvedPeople: this.normalizeOptionalText(draft.involvedPeople, (value) => {
        ManifestationInvolvedPeople.create(value)
      }),
    }

    const hasAnyFilledField = Object.values(normalizedDraft).some((value) => value !== null)

    return hasAnyFilledField ? normalizedDraft : null
  }

  private normalizeManifestationType(type: string | null): ManifestationType | null {
    switch (type) {
      case ManifestationType.REPORT:
      case ManifestationType.COMPLAINT:
      case ManifestationType.SUGGESTION:
      case ManifestationType.COMPLIMENT:
        return type
      default:
        return null
    }
  }

  private normalizeCatalogId(
    value: string | null,
    catalog: CatalogCampusItemDTO[] | CatalogAdministrativeUnitItemDTO[],
    validate: (value: string) => void,
  ): string | null {
    const normalizedValue = this.normalizeOptionalText(value, validate)

    if (normalizedValue === null) {
      return null
    }

    const allowedIds = new Set(catalog.map((item) => item.id))

    return allowedIds.has(normalizedValue) ? normalizedValue : null
  }

  private normalizeAdministrativeUnitId(
    value: string | null,
    campusId: string | null,
    administrativeUnits: CatalogAdministrativeUnitItemDTO[],
  ): string | null {
    const normalizedAdministrativeUnitId = this.normalizeCatalogId(value, administrativeUnits, (normalizedValue) => {
      AdministrativeUnitId.create(normalizedValue)
    })

    if (normalizedAdministrativeUnitId === null || campusId === null) {
      return normalizedAdministrativeUnitId
    }

    const belongsToCampus = administrativeUnits.some((unit) => {
      return unit.id === normalizedAdministrativeUnitId && unit.campusId === campusId
    })

    return belongsToCampus ? normalizedAdministrativeUnitId : null
  }

  private normalizeOptionalText(value: string | null, validate: (value: string) => void): string | null {
    if (value === null) {
      return null
    }

    const normalizedValue = value.trim()

    if (!normalizedValue) {
      return null
    }

    try {
      validate(normalizedValue)
      return normalizedValue
    } catch {
      return null
    }
  }

  private getMissingFields(intent: AiChatIntent, draft: AiDraftPayload | null): RequiredDraftField[] {
    if (intent !== 'manifestation_candidate' && intent !== 'manifestation_draft_ready') {
      return []
    }

    if (draft === null) {
      return [...REQUIRED_DRAFT_FIELDS]
    }

    return REQUIRED_DRAFT_FIELDS.filter((field) => draft[field] === null)
  }

  private truncateHistory(history: AiChatMessage[], maxChars: number): AiChatMessage[] {
    if (history.length === 0) {
      return history
    }
    const kept: AiChatMessage[] = []
    let used = 0
    for (let i = history.length - 1; i >= 0; i -= 1) {
      const entry = history[i]
      if (entry === undefined) {
        continue
      }
      const entryCost = entry.content.length + entry.role.length + 4
      if (used + entryCost > maxChars && kept.length > 0) {
        break
      }
      kept.unshift(entry)
      used += entryCost
    }
    return kept
  }

  private normalizeConfidence(confidence: number | null): number | null {
    if (confidence === null) {
      return null
    }

    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      return null
    }

    return confidence
  }
}
