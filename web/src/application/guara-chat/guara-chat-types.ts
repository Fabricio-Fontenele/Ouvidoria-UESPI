import type { ManifestationType } from '../manifestations/manifestation-type-contract'

export type GuaraChatMode = 'general' | 'new-manifestation' | 'manifestation-detail'

export type GuaraMessageAuthor = 'guara' | 'user'

export interface GuaraMessage {
  author: GuaraMessageAuthor
  id: string
  text: string
}

export interface GuaraChatContext {
  mode: GuaraChatMode
  protocol: string | null
}

export type GuaraChatTurnRole = 'user' | 'assistant'

export interface GuaraChatHistoryItem {
  role: GuaraChatTurnRole
  content: string
}

export type GuaraChatIntent =
  | 'institutional_question'
  | 'manifestation_candidate'
  | 'manifestation_draft_ready'
  | 'out_of_scope'
  | 'unknown'

export type GuaraChatMissingField = 'type' | 'campusId' | 'administrativeUnitId' | 'description'

export interface GuaraChatDraft {
  type: ManifestationType | null
  campusId: string | null
  administrativeUnitId: string | null
  description: string | null
  involvedPeople: string | null
}

export interface SendGuaraMessageInput {
  history: GuaraChatHistoryItem[]
  message: string
}

export interface SendGuaraMessageOutput {
  answer: string
  intent: GuaraChatIntent
  shouldOpenManifestationDraft: boolean
  draft: GuaraChatDraft | null
  missingFields: GuaraChatMissingField[]
  confidence: number | null
}
