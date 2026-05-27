import type { CatalogAdministrativeUnitItemDTO, CatalogCampusItemDTO } from '#src/application/dto/catalog-dtos.js'
import type { ManifestationType } from '#src/domain/entities/manifestation.js'
import type { UserRole } from '#src/domain/entities/user.js'

export type AiChatRole = 'assistant' | 'system' | 'user'

export type AiChatUserRole = UserRole | null

export type AiChatIntent =
  | 'institutional_question'
  | 'manifestation_candidate'
  | 'manifestation_draft_ready'
  | 'out_of_scope'
  | 'unknown'

export interface AiChatMessage {
  role: AiChatRole
  content: string
}

export interface AiDraftPayload {
  type: ManifestationType | null
  campusId: string | null
  administrativeUnitId: string | null
  description: string | null
  involvedPeople: string | null
}

export interface AiGatewayChatInput {
  history: AiChatMessage[]
  message: string
  userRole: AiChatUserRole
  campuses: CatalogCampusItemDTO[]
  administrativeUnits: CatalogAdministrativeUnitItemDTO[]
}

export interface AiGatewaySuggestion {
  id: string
  label: string
  message: string
}

export interface AiGatewayChatResponse {
  answer: string
  intent: string
  shouldOpenManifestationDraft: boolean
  draft: {
    type: string | null
    campusId: string | null
    administrativeUnitId: string | null
    description: string | null
    involvedPeople: string | null
  } | null
  missingFields: string[]
  confidence: number | null
  suggestions: AiGatewaySuggestion[]
}

export interface AiGateway {
  chat(input: AiGatewayChatInput): Promise<AiGatewayChatResponse>
}
