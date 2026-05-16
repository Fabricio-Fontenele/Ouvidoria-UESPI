import type { AiAdministrativeUnitCatalogItem, AiCatalogItem } from './ai-gateway.js'

export interface CampusCatalogProvider {
  list(): Promise<AiCatalogItem[]>
}

export interface AdministrativeUnitCatalogProvider {
  list(): Promise<AiAdministrativeUnitCatalogItem[]>
}
