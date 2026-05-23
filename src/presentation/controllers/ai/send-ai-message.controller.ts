import type { AiChatMessage } from '#src/application/ai/ai-gateway.js'
import type {
  SendAiMessageOutput,
  SendAiMessageUseCase,
} from '#src/application/use-cases/send-ai-message/send-ai-message-use-case.js'
import { AiServiceError } from '#src/infra/ai/ai-service-error.js'

import { badRequest, ok } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import type { Validator } from '../../protocols/validator.js'
import { BaseController } from '../base-controller.js'

export interface SendAiMessageBody {
  history: AiChatMessage[]
  message: string
}

const AI_SERVICE_FALLBACK_RESPONSE: SendAiMessageOutput = {
  answer:
    'Estou com dificuldade para responder agora. Aguarde alguns segundos e tente enviar a mensagem novamente, por favor.',
  intent: 'unknown',
  shouldOpenManifestationDraft: false,
  draft: null,
  missingFields: [],
  confidence: null,
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

  protected override mapError(error: unknown): HttpResponse | null {
    if (error instanceof AiServiceError) {
      return ok(AI_SERVICE_FALLBACK_RESPONSE)
    }
    return null
  }
}
