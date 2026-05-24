import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HttpManifestationsService } from './http-manifestations-service'

const apiBaseUrl = 'https://api.example.test'

function buildJsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
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

describe('HttpManifestationsService attachments', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(buildJsonResponse({})))
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: vi.fn().mockReturnValue(null),
        removeItem: vi.fn(),
        setItem: vi.fn(),
      },
    })
    import.meta.env.VITE_API_BASE_URL = apiBaseUrl
  })

  it('uploads identified attachments as FormData with the file field and no manual Content-Type', async () => {
    const service = new HttpManifestationsService()
    const file = new File(['pdf'], 'evidence.pdf', { type: 'application/pdf' })

    await service.uploadAttachment({ file, manifestationId: 'manifestation-1' })

    const [url, init] = getFetchCall()
    const body = init?.body

    expect(url).toBe(`${apiBaseUrl}/manifestations/manifestation-1/attachments`)
    expect(body).toBeInstanceOf(FormData)
    expect((body as FormData).get('file')).toBe(file)
    expect(init?.headers).toBeInstanceOf(Headers)
    expect((init?.headers as Headers).has('Content-Type')).toBe(false)
  })

  it('uploads anonymous attachments with protocol, accessCode and file fields', async () => {
    const service = new HttpManifestationsService()
    const file = new File(['png'], 'image.png', { type: 'image/png' })

    await service.uploadTrackedAttachment({
      accessCode: 'secret-code',
      file,
      protocol: '2026-0002',
    })

    const [url, init] = getFetchCall()
    const body = init?.body

    expect(url).toBe(`${apiBaseUrl}/manifestations/track/attachments`)
    expect(body).toBeInstanceOf(FormData)
    expect((body as FormData).get('protocol')).toBe('2026-0002')
    expect((body as FormData).get('accessCode')).toBe('secret-code')
    expect((body as FormData).get('file')).toBe(file)
    expect((init?.headers as Headers).has('Authorization')).toBe(false)
    expect((init?.headers as Headers).has('Content-Type')).toBe(false)
  })

  it('requests anonymous download URLs without bearer auth', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(buildJsonResponse({ downloadUrl: 'https://signed.example/file' })))
    const service = new HttpManifestationsService()

    const downloadUrl = await service.getTrackedAttachmentDownloadUrl({
      accessCode: 'secret-code',
      attachmentId: 'attachment-1',
      protocol: '2026-0002',
    })

    const [url, init] = getFetchCall()

    expect(downloadUrl).toBe('https://signed.example/file')
    expect(url).toBe(`${apiBaseUrl}/manifestations/track/attachments/attachment-1/download-url`)
    expect((init?.headers as Headers).has('Authorization')).toBe(false)
    expect(JSON.parse(init?.body as string)).toStrictEqual({
      accessCode: 'secret-code',
      protocol: '2026-0002',
    })
  })

  it('returns manifestation list pagination metadata from the API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        buildJsonResponse({
          manifestations: [],
          page: 3,
          pageSize: 20,
          totalItems: 91,
          totalPages: 5,
        }),
      ),
    )
    const service = new HttpManifestationsService()

    const result = await service.list(3)
    const [url] = getFetchCall()
    const parsed = new URL(String(url))

    expect(parsed.origin + parsed.pathname).toBe(`${apiBaseUrl}/manifestations`)
    expect(parsed.searchParams.get('page')).toBe('3')
    expect(result).toStrictEqual({
      manifestations: [],
      page: 3,
      pageSize: 20,
      totalItems: 91,
      totalPages: 5,
    })
  })
})
