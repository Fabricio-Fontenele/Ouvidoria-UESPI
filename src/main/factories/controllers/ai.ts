import { z } from 'zod'

import { SendAiMessageUseCase } from '#src/application/use-cases/send-ai-message/send-ai-message-use-case.js'
import { ZodValidator } from '#src/infra/http/fastify/validators/zod-validator.js'
import {
  SendAiMessageController,
  type SendAiMessageBody,
} from '#src/presentation/controllers/ai/send-ai-message.controller.js'

import { infrastructure } from '../infrastructure.js'

const aiChatMessageSchema = z.object({
  role: z.enum(['assistant', 'user']),
  content: z.string().trim().min(1).max(4000),
})

const sendAiMessageSchema = z.object({
  history: z.array(aiChatMessageSchema).max(20),
  message: z.string().trim().min(1).max(4000),
}) satisfies z.ZodType<SendAiMessageBody>

export function makeSendAiMessageController(): SendAiMessageController {
  const useCase = new SendAiMessageUseCase(infrastructure.aiGateway, infrastructure.catalogRepository)
  return new SendAiMessageController(useCase, new ZodValidator(sendAiMessageSchema))
}
