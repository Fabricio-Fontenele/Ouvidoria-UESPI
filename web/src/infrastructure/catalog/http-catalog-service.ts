import type { CatalogService } from '../../application/catalog/catalog-service'
import type { Catalog } from '../../application/catalog/catalog-types'
import { apiFetch } from '../http/api-client'

export class HttpCatalogService implements CatalogService {
  async getCatalog(): Promise<Catalog> {
    return apiFetch<Catalog>('/catalog', { auth: 'none' })
  }
}
