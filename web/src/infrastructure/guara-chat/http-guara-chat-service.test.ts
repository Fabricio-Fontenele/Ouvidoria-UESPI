import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GuaraChatRequestError, HttpGuaraChatService } from './http-guara-chat-service'

const apiBaseUrl = 'https://api.example.test'

function buildJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status,
  })
}

function getFetchCall() {
  const fetchMock = vi.mocked(fetch)
  const call = fetchMock.mock.calls[0]

  if (call === undefined) {
    throw new Error('fetch was not called')
  }

  return call
}

describe('HttpGuaraChatService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(buildJsonResponse({ answer: 'Olá' })))
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: vi.fn().mockReturnValue(null),
        removeItem: vi.fn(),
        setItem: vi.fn(),
      },
    })
    import.meta.env.VITE_API_BASE_URL = apiBaseUrl
  })

  it('posts history and message to /ai/messages without Authorization', async () => {
    const service = new HttpGuaraChatService()

    await service.sendMessage({
      history: [
        { content: 'oi', role: 'user' },
        { content: 'olá!', role: 'assistant' },
      ],
      message: 'preciso de ajuda',
    })

    const [url, init] = getFetchCall()
    const headers = init?.headers as Headers

    expect(url).toBe(`${apiBaseUrl}/ai/messages`)
    expect(init?.method).toBe('POST')
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(headers.has('Authorization')).toBe(false)

    const parsedBody = JSON.parse(init?.body as string) as { history: unknown[]; message: string }
    expect(parsedBody.message).toBe('preciso de ajuda')
    expect(parsedBody.history).toEqual([
      { content: 'oi', role: 'user' },
      { content: 'olá!', role: 'assistant' },
    ])
  })

  it('trims message + history entries and slices history to last 20 items', async () => {
    const service = new HttpGuaraChatService()
    const history = Array.from({ length: 25 }, (_, index) => ({
      content: ` mensagem ${index} `,
      role: (index % 2 === 0 ? 'user' : 'assistant') as 'assistant' | 'user',
    }))

    await service.sendMessage({ history, message: '  pergunta  ' })

    const [, init] = getFetchCall()
    const parsedBody = JSON.parse(init?.body as string) as {
      history: Array<{ content: string; role: string }>
      message: string
    }

    expect(parsedBody.message).toBe('pergunta')
    expect(parsedBody.history).toHaveLength(20)
    expect(parsedBody.history[0]?.content).toBe('mensagem 5')
    expect(parsedBody.history[19]?.content).toBe('mensagem 24')
  })

  it('rejects empty messages without hitting the network', async () => {
    const service = new HttpGuaraChatService()

    await expect(service.sendMessage({ history: [], message: '   ' })).rejects.toBeInstanceOf(GuaraChatRequestError)
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })

  it('rejects messages longer than 4000 chars without hitting the network', async () => {
    const service = new HttpGuaraChatService()

    await expect(service.sendMessage({ history: [], message: 'a'.repeat(4001) })).rejects.toBeInstanceOf(
      GuaraChatRequestError,
    )
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })

  it('maps HTTP errors to GuaraChatRequestError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(buildJsonResponse({ error: 'ServerError', message: 'boom' }, 500)))
    const service = new HttpGuaraChatService()

    await expect(service.sendMessage({ history: [], message: 'oi' })).rejects.toBeInstanceOf(GuaraChatRequestError)
  })

  it('normalizes the backend response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        buildJsonResponse({
          answer: 'Vamos lá',
          confidence: 5,
          draft: {
            administrativeUnitId: 'unit-1',
            campusId: 'campus-1',
            description: 'detalhes',
            involvedPeople: null,
            type: 'invalid-type',
          },
          intent: 'made_up',
          missingFields: ['type', 'description', 'unknown'],
          shouldOpenManifestationDraft: true,
        }),
      ),
    )
    const service = new HttpGuaraChatService()

    const output = await service.sendMessage({ history: [], message: 'oi' })

    expect(output.intent).toBe('unknown')
    expect(output.confidence).toBeNull()
    expect(output.draft).not.toBeNull()
    expect(output.draft?.type).toBeNull()
    expect(output.missingFields).toEqual(['type', 'description'])
    expect(output.shouldOpenManifestationDraft).toBe(false)
  })

  it('drops history entries with disallowed roles before sending', async () => {
    const service = new HttpGuaraChatService()

    await service.sendMessage({
      history: [
        { content: 'oi', role: 'user' },
        { content: 'fake system', role: 'system' as 'user' },
        { content: 'olá', role: 'assistant' },
      ],
      message: 'pergunta',
    })

    const [, init] = getFetchCall()
    const parsedBody = JSON.parse(init?.body as string) as { history: Array<{ role: string }> }

    expect(parsedBody.history.map((entry) => entry.role)).toEqual(['user', 'assistant'])
  })
})
