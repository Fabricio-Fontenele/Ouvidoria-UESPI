import type { HttpRequest, HttpResponse } from './http.js'

export interface Controller<TRequest extends HttpRequest<unknown, object, object> = HttpRequest> {
  handle(request: TRequest): Promise<HttpResponse>
}
