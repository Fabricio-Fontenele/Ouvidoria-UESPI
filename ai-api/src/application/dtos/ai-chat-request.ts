import type { CatalogAdministrativeUnit, CatalogCampus } from '../ports/catalog-context.js'

export type AiChatRole = 'assistant' | 'user'

export type AiChatUserRole = 'admin' | 'manifestant' | 'ombudsman' | null

export interface AiChatHistoryMessage {
  role: AiChatRole
  content: string
}

export interface AiChatRequest {
  history: AiChatHistoryMessage[]
  message: string
  userRole: AiChatUserRole
  campuses: CatalogCampus[]
  administrativeUnits: CatalogAdministrativeUnit[]
}
