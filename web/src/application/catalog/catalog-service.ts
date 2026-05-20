import type { Catalog } from './catalog-types'

export interface CatalogService {
  getCatalog(): Promise<Catalog>
}
