import type { HttpRequest, HttpResponse } from './http.js'

export interface Controller<TRequest extends HttpRequest = HttpRequest> {
  handle(request: TRequest): Promise<HttpResponse>
}
