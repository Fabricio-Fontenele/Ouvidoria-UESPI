import type { FastifyReply, FastifyRequest } from 'fastify'

import { NEUTRAL_FALLBACK_RESPONSE } from '../../application/dtos/ai-chat-response.js'
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

    const messagePreview = parsed.data.message.slice(0, 80)

    let result
    try {
      result = await useCase.execute(parsed.data)
    } catch (error) {
      request.log.error({ err: error, messagePreview }, 'ai-message: use case threw, returning neutral fallback')
      await reply.code(200).send(NEUTRAL_FALLBACK_RESPONSE)
      return
    }

    if (result === NEUTRAL_FALLBACK_RESPONSE) {
      request.log.warn(
        { messagePreview },
        'ai-message: llm payload failed schema validation, returning neutral fallback',
      )
    }

    await reply.code(200).send(result)
  }
}
