import type { FastifyReply, FastifyRequest } from 'fastify'

import type { SendAiMessageUseCase } from '../../application/use-cases/send-ai-message-use-case.js'
import { sendAiMessageBodySchema } from '../validators/send-ai-message-schema.js'

export function makeSendAiMessageHandler(useCase: SendAiMessageUseCase) {
  return async function handler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const parsed = sendAiMessageBodySchema.safeParse(request.body)
    if (!parsed.success) {
      await reply.code(400).send({
        error: 'invalid_request_body',
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      })
      return
    }

    const result = await useCase.execute(parsed.data)
    await reply.code(200).send(result)
  }
}
