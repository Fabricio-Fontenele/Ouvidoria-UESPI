import { z } from 'zod'

import type { AiGateway, AiGatewayChatInput, AiGatewayChatResponse } from '#src/application/ai/ai-gateway.js'

import { AiServiceError } from './ai-service-error.js'

const responseSchema = z.object({
  answer: z.string(),
  intent: z.string(),
  confidence: z.number().nullable(),
  shouldOpenManifestationDraft: z.boolean(),
  draft: z
    .object({
      type: z.string().nullable(),
      campusId: z.string().nullable(),
      administrativeUnitId: z.string().nullable(),
      description: z.string().nullable(),
      involvedPeople: z.string().nullable(),
    })
    .nullable(),
  missingFields: z.array(z.string()),
})

export interface HttpAiGatewayConfig {
  baseUrl: string
  apiKey: string
  timeoutMs: number
  fetchFn?: typeof fetch
}

export class HttpAiGateway implements AiGateway {
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly timeoutMs: number
  private readonly fetchFn: typeof fetch

  constructor(config: HttpAiGatewayConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '')
    this.apiKey = config.apiKey
    this.timeoutMs = config.timeoutMs
    this.fetchFn = config.fetchFn ?? fetch
  }

  async chat(input: AiGatewayChatInput): Promise<AiGatewayChatResponse> {
    const url = `${this.baseUrl}/ai/messages`

    let response: Response
    try {
      response = await this.fetchFn(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(this.timeoutMs),
      })
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new AiServiceError('timeout', `ai-api timed out after ${String(this.timeoutMs)}ms`, error)
      }
      throw new AiServiceError('network', 'failed to reach ai-api', error)
    }

    if (!response.ok) {
      throw new AiServiceError('upstream_status', `ai-api responded with status ${String(response.status)}`)
    }

    let payload: unknown
    try {
      payload = await response.json()
    } catch (error) {
      throw new AiServiceError('invalid_response', 'ai-api returned non-JSON body', error)
    }

    const parsed = responseSchema.safeParse(payload)
    if (!parsed.success) {
      throw new AiServiceError('invalid_response', 'ai-api response failed schema validation', parsed.error)
    }

    return parsed.data as AiGatewayChatResponse
  }
}
