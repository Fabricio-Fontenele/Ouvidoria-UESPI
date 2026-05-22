import type { AiChatMessage } from '#src/application/ai/ai-gateway.js'
import type { SendAiMessageUseCase } from '#src/application/use-cases/send-ai-message/send-ai-message-use-case.js'

import { badRequest, ok } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import type { Validator } from '../../protocols/validator.js'
import { BaseController } from '../base-controller.js'

export interface SendAiMessageBody {
  history: AiChatMessage[]
  message: string
}

export class SendAiMessageController extends BaseController {
  constructor(
    private readonly useCase: SendAiMessageUseCase,
    private readonly validator: Validator<SendAiMessageBody>,
  ) {
    super()
  }

  protected async perform(request: HttpRequest): Promise<HttpResponse> {
    const validation = this.validator.validate(request.body)

    if (!validation.success) {
      return badRequest(validation.error)
    }

    const result = await this.useCase.execute({
      ...validation.data,
      userRole: request.user?.role ?? null,
    })

    return ok(result)
  }
}
