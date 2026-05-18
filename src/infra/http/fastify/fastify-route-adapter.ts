import type { FastifyReply, FastifyRequest, RouteHandlerMethod } from 'fastify'

import type { UserRole } from '#src/domain/entities/user.js'
import type { Controller } from '#src/presentation/protocols/controller.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'

function isAuthenticatedUser(value: unknown): value is { id: string; role: UserRole } {
  if (value === null || typeof value !== 'object') {
    return false
  }
  const candidate = value as Record<string, unknown>
  return typeof candidate['id'] === 'string' && typeof candidate['role'] === 'string'
}

export function buildHttpRequest(request: FastifyRequest): HttpRequest {
  const httpRequest: HttpRequest = {
    body: request.body,
    params: (request.params ?? {}) as Record<string, string>,
    query: (request.query ?? {}) as Record<string, string | undefined>,
    headers: request.headers as Record<string, string | string[] | undefined>,
  }

  if (isAuthenticatedUser(request.user)) {
    httpRequest.user = request.user
  }

  return httpRequest
}

type AnyController = Controller<HttpRequest<never, never, never>>

export async function sendHttpResponse(
  reply: FastifyReply,
  httpResponse: Awaited<ReturnType<AnyController['handle']>>,
) {
  const body = httpResponse.body

  if (body instanceof Error) {
    return reply.status(httpResponse.statusCode).send({ error: body.name, message: body.message })
  }

  if (body === null) {
    return reply.status(httpResponse.statusCode).send()
  }

  return reply.status(httpResponse.statusCode).send(body)
}

export function adaptRoute(controller: Pick<AnyController, 'handle'>): RouteHandlerMethod {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    const httpRequest = buildHttpRequest(request) as HttpRequest<never, never, never>
    const httpResponse = await controller.handle(httpRequest)
    return sendHttpResponse(reply, httpResponse)
  }
}
