import type { CatalogService } from '../../application/catalog/catalog-service'
import { HttpCatalogService } from './http-catalog-service'

export function makeCatalogService(): CatalogService {
  return new HttpCatalogService()
}
