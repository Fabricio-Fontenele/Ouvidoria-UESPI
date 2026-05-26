import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HttpOmbudsmanService } from './http-ombudsman-service'

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

const detailFixture = {
  administrativeUnitId: 'unit-1',
  attachments: [
    {
      createdAt: '2026-05-10T15:30:00.000Z',
      id: 'attachment-1',
      mimeType: 'application/pdf',
      originalName: 'evidence.pdf',
      sizeInBytes: 1024,
      uploadedByType: 'manifestant',
    },
  ],
  attendantUserId: 'ombudsman-1',
  author: {
    email: 'diana@example.com',
    id: 'user-1',
    name: 'Diana Reis',
  },
  authorUserId: 'user-1',
  campusId: 'campus-1',
  createdAt: '2026-05-10T12:00:00.000Z',
  description: 'desc',
  forwardedToUnit: null,
  history: [
    {
      actorType: 'ombudsman',
      actorUserId: 'ombudsman-1',
      attendantUserId: 'ombudsman-1',
      createdAt: '2026-05-10T15:00:00.000Z',
      description: 'Resposta administrativa enviada.',
      fromStatus: null,
      rating: null,
      toStatus: null,
      type: 'administrative_answered',
    },
  ],
  id: 'manifestation-1',
  involvedPeople: null,
  isAnonymous: false,
  messages: [
    {
      content: 'Estamos analisando o seu relato.',
      createdAt: '2026-05-10T15:00:00.000Z',
      id: 'message-1',
      senderType: 'ombudsman',
      senderUserId: 'ombudsman-1',
    },
  ],
  protocol: '2026-0001',
  status: 'answered',
  type: 'complaint',
}

describe('HttpOmbudsmanService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(buildJsonResponse({})))
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: vi.fn().mockReturnValue('token-abc'),
        removeItem: vi.fn(),
        setItem: vi.fn(),
      },
    })
    import.meta.env.VITE_API_BASE_URL = apiBaseUrl
  })

  it('builds the list URL with all filters and Bearer auth', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        buildJsonResponse({
          manifestations: [],
          page: 2,
          pageSize: 20,
          statusTotals: {
            answered: 12,
            awaiting_unit: 9,
            canceled: 4,
            finalized: 16,
            in_analysis: 20,
          },
          totalItems: 61,
          totalPages: 4,
        }),
      ),
    )
    const service = new HttpOmbudsmanService()

    const result = await service.list({
      administrativeUnitId: 'unit-1',
      campusId: 'campus-1',
      from: '2026-05-01T00:00:00.000Z',
      onlyMine: true,
      page: 2,
      status: 'in_analysis',
      to: '2026-05-31T23:59:59.999Z',
      type: 'complaint',
    })

    const [url, init] = getFetchCall()
    const parsed = new URL(String(url))

    expect(parsed.origin + parsed.pathname).toBe(`${apiBaseUrl}/admin/manifestations`)
    expect(parsed.searchParams.get('page')).toBe('2')
    expect(parsed.searchParams.get('status')).toBe('in_analysis')
    expect(parsed.searchParams.get('type')).toBe('complaint')
    expect(parsed.searchParams.get('campusId')).toBe('campus-1')
    expect(parsed.searchParams.get('administrativeUnitId')).toBe('unit-1')
    expect(parsed.searchParams.get('from')).toBe('2026-05-01T00:00:00.000Z')
    expect(parsed.searchParams.get('onlyMine')).toBe('true')
    expect(parsed.searchParams.get('to')).toBe('2026-05-31T23:59:59.999Z')
    expect((init?.headers as Headers).get('Authorization')).toBe('Bearer token-abc')
    expect(result).toStrictEqual({
      manifestations: [],
      page: 2,
      pageSize: 20,
      statusTotals: {
        answered: 12,
        awaiting_unit: 9,
        canceled: 4,
        finalized: 16,
        in_analysis: 20,
      },
      totalItems: 61,
      totalPages: 4,
    })
  })

  it('omits undefined filters from the query string', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(buildJsonResponse({ manifestations: [] })))
    const service = new HttpOmbudsmanService()

    await service.list({})

    const [url] = getFetchCall()
    const parsed = new URL(String(url))

    expect(parsed.searchParams.get('page')).toBe('1')
    expect(parsed.searchParams.get('status')).toBeNull()
    expect(parsed.searchParams.get('type')).toBeNull()
    expect(parsed.searchParams.get('campusId')).toBeNull()
    expect(parsed.searchParams.get('administrativeUnitId')).toBeNull()
    expect(parsed.searchParams.get('from')).toBeNull()
    expect(parsed.searchParams.get('onlyMine')).toBeNull()
    expect(parsed.searchParams.get('to')).toBeNull()
  })

  it('builds the metrics URL without status or page filters', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        buildJsonResponse({
          statusTotals: {
            answered: 12,
            awaiting_unit: 9,
            canceled: 4,
            finalized: 16,
            in_analysis: 20,
          },
          totalItems: 61,
        }),
      ),
    )
    const service = new HttpOmbudsmanService()

    const result = await service.getMetrics({
      administrativeUnitId: 'unit-1',
      campusId: 'campus-1',
      from: '2026-05-01T00:00:00.000Z',
      to: '2026-05-31T23:59:59.999Z',
      type: 'complaint',
    })

    const [url, init] = getFetchCall()
    const parsed = new URL(String(url))

    expect(parsed.origin + parsed.pathname).toBe(`${apiBaseUrl}/admin/manifestations/metrics`)
    expect(parsed.searchParams.get('page')).toBeNull()
    expect(parsed.searchParams.get('status')).toBeNull()
    expect(parsed.searchParams.get('type')).toBe('complaint')
    expect(parsed.searchParams.get('campusId')).toBe('campus-1')
    expect(parsed.searchParams.get('administrativeUnitId')).toBe('unit-1')
    expect(parsed.searchParams.get('from')).toBe('2026-05-01T00:00:00.000Z')
    expect(parsed.searchParams.get('to')).toBe('2026-05-31T23:59:59.999Z')
    expect((init?.headers as Headers).get('Authorization')).toBe('Bearer token-abc')
    expect(result).toStrictEqual({
      statusTotals: {
        answered: 12,
        awaiting_unit: 9,
        canceled: 4,
        finalized: 16,
        in_analysis: 20,
      },
      totalItems: 61,
    })
  })

  it('narrows enums in getById through the shared mapper', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(buildJsonResponse({ manifestation: detailFixture })))
    const service = new HttpOmbudsmanService()

    const detail = await service.getById('manifestation-1')

    const [url] = getFetchCall()
    expect(url).toBe(`${apiBaseUrl}/admin/manifestations/manifestation-1`)
    expect(detail.history[0]?.type).toBe('administrative_answered')
    expect(detail.messages[0]?.senderType).toBe('ombudsman')
    expect(detail.attachments[0]?.uploadedByType).toBe('manifestant')
  })

  it('posts the answer payload and resolves void', async () => {
    const service = new HttpOmbudsmanService()

    const result = await service.answer({ content: 'Concluímos a análise.', manifestationId: 'manifestation-1' })

    const [url, init] = getFetchCall()
    expect(url).toBe(`${apiBaseUrl}/admin/manifestations/manifestation-1/answer`)
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body as string)).toStrictEqual({ content: 'Concluímos a análise.' })
    expect(result).toBeUndefined()
  })

  it('patches the status and resolves void', async () => {
    const service = new HttpOmbudsmanService()

    await service.updateStatus({ manifestationId: 'manifestation-1', status: 'finalized' })

    const [url, init] = getFetchCall()
    expect(url).toBe(`${apiBaseUrl}/admin/manifestations/manifestation-1/status`)
    expect(init?.method).toBe('PATCH')
    expect(JSON.parse(init?.body as string)).toStrictEqual({ status: 'finalized' })
  })

  it('returns the signed download URL for an admin attachment', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(buildJsonResponse({ downloadUrl: 'https://signed.example/file' })))
    const service = new HttpOmbudsmanService()

    const downloadUrl = await service.getAttachmentDownloadUrl({
      attachmentId: 'attachment-1',
      manifestationId: 'manifestation-1',
    })

    const [url, init] = getFetchCall()
    expect(url).toBe(`${apiBaseUrl}/admin/manifestations/manifestation-1/attachments/attachment-1/download-url`)
    expect(init?.method).toBe('POST')
    expect((init?.headers as Headers).get('Authorization')).toBe('Bearer token-abc')
    expect(downloadUrl).toBe('https://signed.example/file')
  })
})
