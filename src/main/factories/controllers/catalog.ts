import { ListCatalogUseCase } from '#src/application/use-cases/list-catalog/list-catalog-use-case.js'
import { ListCatalogController } from '#src/presentation/controllers/catalog/list-catalog.controller.js'

import { infrastructure } from '../infrastructure.js'

export function makeListCatalogController(): ListCatalogController {
  const useCase = new ListCatalogUseCase(infrastructure.catalogRepository)
  return new ListCatalogController(useCase)
}
