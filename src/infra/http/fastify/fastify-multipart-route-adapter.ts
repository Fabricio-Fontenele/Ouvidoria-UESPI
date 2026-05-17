import type { FastifyMultipartBaseOptions, MultipartValue } from '@fastify/multipart'
import type { FastifyReply, FastifyRequest, RouteHandlerMethod } from 'fastify'

import type { AttachmentUploadFile } from '#src/application/attachments/attachment-policy.js'
import { InvalidParamError } from '#src/presentation/errors/invalid-param-error.js'
import { MissingParamError } from '#src/presentation/errors/missing-param-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'

import { buildHttpRequest, sendHttpResponse } from './fastify-route-adapter.js'

interface MultipartBodyBuilderInput {
  file: AttachmentUploadFile
  fields: Record<string, string | undefined>
}

interface AdaptMultipartRouteOptions<TBody> {
  expectedFieldNames: readonly string[]
  multipartOptions: FastifyMultipartBaseOptions
  buildBody(input: MultipartBodyBuilderInput): TBody
}

type MultipartController<TBody> = {
  handle(request: HttpRequest<TBody, never, never>): Promise<{
    statusCode: number
    body: unknown
  }>
}

export function adaptMultipartRoute<TBody>(
  controller: MultipartController<TBody>,
  options: AdaptMultipartRouteOptions<TBody>,
): RouteHandlerMethod {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    if (!request.isMultipart()) {
      return sendError(reply, 400, new InvalidParamError('multipart'))
    }

    try {
      const fields: Record<string, string | undefined> = {}
      let file: AttachmentUploadFile | null = null

      for await (const part of request.parts({
        ...options.multipartOptions,
      })) {
        if (part.type === 'file') {
          if (part.fieldname !== 'file' || file !== null) {
            await part.toBuffer()
            return await sendError(reply, 400, new InvalidParamError('file'))
          }

          const content = await part.toBuffer()
          file = {
            originalName: part.filename,
            mimeType: part.mimetype,
            sizeInBytes: content.byteLength,
            content,
          }

          continue
        }

        if (!options.expectedFieldNames.includes(part.fieldname)) {
          return await sendError(reply, 400, new InvalidParamError(part.fieldname))
        }

        if (fields[part.fieldname] !== undefined) {
          return await sendError(reply, 400, new InvalidParamError(part.fieldname))
        }

        const fieldValue = part as MultipartValue

        if (fieldValue.valueTruncated || fieldValue.fieldnameTruncated || typeof fieldValue.value !== 'string') {
          return await sendError(reply, 400, new InvalidParamError(part.fieldname))
        }

        fields[part.fieldname] = fieldValue.value
      }

      if (file === null) {
        return await sendError(reply, 400, new MissingParamError('file'))
      }

      const httpRequest = buildHttpRequest(request) as HttpRequest<TBody>
      httpRequest.body = options.buildBody({
        file,
        fields,
      })

      const httpResponse = await controller.handle(httpRequest as HttpRequest<TBody, never, never>)
      return await sendHttpResponse(reply, httpResponse)
    } catch (error) {
      if (isMultipartRequestError(request, error)) {
        return sendError(reply, 400, new InvalidParamError('file'))
      }

      throw error
    }
  }
}

function isMultipartRequestError(request: FastifyRequest, error: unknown): boolean {
  const multipartErrors = request.server.multipartErrors

  return (
    error instanceof multipartErrors.InvalidMultipartContentTypeError ||
    error instanceof multipartErrors.FilesLimitError ||
    error instanceof multipartErrors.FieldsLimitError ||
    error instanceof multipartErrors.PartsLimitError ||
    error instanceof multipartErrors.RequestFileTooLargeError
  )
}

async function sendError(reply: FastifyReply, statusCode: number, error: Error): Promise<FastifyReply> {
  return reply.status(statusCode).send({ error: error.name, message: error.message })
}
