import { ServerError } from '../errors/server-error.js'
import type { HttpResponse } from '../protocols/http.js'

export function ok<T>(body: T): HttpResponse<T> {
  return { statusCode: 200, body }
}

export function created<T>(body: T): HttpResponse<T> {
  return { statusCode: 201, body }
}

export function noContent(): HttpResponse<null> {
  return { statusCode: 204, body: null }
}

export function badRequest(error: Error): HttpResponse<Error> {
  return { statusCode: 400, body: error }
}

export function unauthorized(error: Error): HttpResponse<Error> {
  return { statusCode: 401, body: error }
}

export function forbidden(error: Error): HttpResponse<Error> {
  return { statusCode: 403, body: error }
}

export function notFound(error: Error): HttpResponse<Error> {
  return { statusCode: 404, body: error }
}

export function conflict(error: Error): HttpResponse<Error> {
  return { statusCode: 409, body: error }
}

export function unprocessableEntity(error: Error): HttpResponse<Error> {
  return { statusCode: 422, body: error }
}

export function serverError(cause: unknown): HttpResponse<ServerError> {
  return { statusCode: 500, body: new ServerError(cause) }
}
