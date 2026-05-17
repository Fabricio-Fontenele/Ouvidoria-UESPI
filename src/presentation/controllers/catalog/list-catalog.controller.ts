import type { ListCatalogUseCase } from '#src/application/use-cases/list-catalog/list-catalog-use-case.js'

import { ok } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import { BaseController } from '../base-controller.js'

export class ListCatalogController extends BaseController {
  constructor(private readonly useCase: ListCatalogUseCase) {
    super()
  }

  protected async perform(_request: HttpRequest): Promise<HttpResponse> {
    const result = await this.useCase.execute(undefined)
    return ok(result)
  }
}
