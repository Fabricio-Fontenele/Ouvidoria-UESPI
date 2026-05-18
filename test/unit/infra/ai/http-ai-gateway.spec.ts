import { describe, expect, it, vi } from 'vitest'

import type { AiGatewayChatInput } from '#src/application/ai/ai-gateway.js'
import { AiServiceError } from '#src/infra/ai/ai-service-error.js'
import { HttpAiGateway } from '#src/infra/ai/http-ai-gateway.js'

const baseInput: AiGatewayChatInput = {
  history: [],
  message: 'como abrir uma reclamação?',
  campuses: [{ id: 'campus-1', label: 'Campus 1' }],
  administrativeUnits: [{ id: 'unit-1', label: 'Unidade 1', campusId: 'campus-1' }],
}

const validPayload = {
  answer: 'ok',
  intent: 'institutional_question',
  confidence: 0.9,
  shouldOpenManifestationDraft: false,
  draft: null,
  missingFields: [],
}

function makeJsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('HttpAiGateway', () => {
  it('posts to /ai/messages with x-api-key and parses a valid response', async () => {
    const fetchFn = vi.fn().mockResolvedValue(makeJsonResponse(validPayload))
    const gateway = new HttpAiGateway({
      baseUrl: 'http://ai-api:4000/',
      apiKey: 'secret',
      timeoutMs: 5000,
      fetchFn,
    })

    const result = await gateway.chat(baseInput)

    expect(result).toStrictEqual(validPayload)
    expect(fetchFn).toHaveBeenCalledTimes(1)
    const [calledUrl, calledInit] = fetchFn.mock.calls[0] as [string, RequestInit]
    expect(calledUrl).toBe('http://ai-api:4000/ai/messages')
    expect(calledInit.method).toBe('POST')
    expect((calledInit.headers as Record<string, string>)['x-api-key']).toBe('secret')
    expect((calledInit.headers as Record<string, string>)['content-type']).toBe('application/json')
    expect(JSON.parse(calledInit.body as string)).toStrictEqual(baseInput)
  })

  it('throws AiServiceError(upstream_status) when the response is non-2xx', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('boom', { status: 503 }))
    const gateway = new HttpAiGateway({
      baseUrl: 'http://ai-api:4000',
      apiKey: 'secret',
      timeoutMs: 5000,
      fetchFn,
    })

    await expect(gateway.chat(baseInput)).rejects.toMatchObject({
      name: 'AiServiceError',
      kind: 'upstream_status',
    })
  })

  it('throws AiServiceError(timeout) when fetch throws a TimeoutError', async () => {
    const timeoutError = new Error('aborted')
    timeoutError.name = 'TimeoutError'
    const fetchFn = vi.fn().mockRejectedValue(timeoutError)

    const gateway = new HttpAiGateway({
      baseUrl: 'http://ai-api:4000',
      apiKey: 'secret',
      timeoutMs: 10,
      fetchFn,
    })

    await expect(gateway.chat(baseInput)).rejects.toMatchObject({
      name: 'AiServiceError',
      kind: 'timeout',
    })
  })

  it('throws AiServiceError(network) when fetch rejects with a generic error', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))
    const gateway = new HttpAiGateway({
      baseUrl: 'http://ai-api:4000',
      apiKey: 'secret',
      timeoutMs: 5000,
      fetchFn,
    })

    await expect(gateway.chat(baseInput)).rejects.toMatchObject({
      name: 'AiServiceError',
      kind: 'network',
    })
  })

  it('throws AiServiceError(invalid_response) when the body is not JSON', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(new Response('not json', { status: 200, headers: { 'content-type': 'text/plain' } }))
    const gateway = new HttpAiGateway({
      baseUrl: 'http://ai-api:4000',
      apiKey: 'secret',
      timeoutMs: 5000,
      fetchFn,
    })

    await expect(gateway.chat(baseInput)).rejects.toBeInstanceOf(AiServiceError)
  })

  it('throws AiServiceError(invalid_response) when the JSON breaks the schema', async () => {
    const fetchFn = vi.fn().mockResolvedValue(makeJsonResponse({ answer: 'ok' }))
    const gateway = new HttpAiGateway({
      baseUrl: 'http://ai-api:4000',
      apiKey: 'secret',
      timeoutMs: 5000,
      fetchFn,
    })

    await expect(gateway.chat(baseInput)).rejects.toMatchObject({
      name: 'AiServiceError',
      kind: 'invalid_response',
    })
  })

  it('normalizes trailing slashes in baseUrl', async () => {
    const fetchFn = vi.fn().mockResolvedValue(makeJsonResponse(validPayload))
    const gateway = new HttpAiGateway({
      baseUrl: 'http://ai-api:4000///',
      apiKey: 'secret',
      timeoutMs: 5000,
      fetchFn,
    })

    await gateway.chat(baseInput)

    const [calledUrl] = fetchFn.mock.calls[0] as [string, RequestInit]
    expect(calledUrl).toBe('http://ai-api:4000/ai/messages')
  })
})
