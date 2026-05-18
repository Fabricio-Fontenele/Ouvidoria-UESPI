import type { CatalogAdministrativeUnit, CatalogCampus } from '../ports/catalog-context.js'

export type AiChatRole = 'assistant' | 'user'

export interface AiChatHistoryMessage {
  role: AiChatRole
  content: string
}

export interface AiChatRequest {
  history: AiChatHistoryMessage[]
  message: string
  campuses: CatalogCampus[]
  administrativeUnits: CatalogAdministrativeUnit[]
}
