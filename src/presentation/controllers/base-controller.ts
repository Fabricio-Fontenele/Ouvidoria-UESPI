import { serverError } from '../helpers/http-helpers.js'
import type { Controller } from '../protocols/controller.js'
import type { HttpRequest, HttpResponse } from '../protocols/http.js'

export abstract class BaseController<
  TRequest extends HttpRequest<unknown, object, object> = HttpRequest,
> implements Controller<TRequest> {
  async handle(request: TRequest): Promise<HttpResponse> {
    try {
      return await this.perform(request)
    } catch (error: unknown) {
      const mapped = this.mapError(error)
      if (mapped !== null) {
        return mapped
      }
      return serverError(error)
    }
  }

  protected abstract perform(request: TRequest): Promise<HttpResponse>

  protected mapError(_error: unknown): HttpResponse | null {
    return null
  }
}
