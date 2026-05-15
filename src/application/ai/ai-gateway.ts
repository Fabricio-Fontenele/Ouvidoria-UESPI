import type { ManifestationType } from '#src/domain/entities/manifestation.js'

export type AiChatRole = 'assistant' | 'system' | 'user'

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

export interface AiCatalogItem {
  id: string
  label: string
}

export interface AiAdministrativeUnitCatalogItem extends AiCatalogItem {
  campusId: string
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
  campuses: AiCatalogItem[]
  administrativeUnits: AiAdministrativeUnitCatalogItem[]
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
}

export interface AiGateway {
  chat(input: AiGatewayChatInput): Promise<AiGatewayChatResponse>
}
