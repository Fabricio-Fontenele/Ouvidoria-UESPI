import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import { UserRole } from '#src/domain/entities/user.js'
import { BcryptjsHasher } from '#src/infra/cryptography/bcryptjs-hasher.js'
import { prisma } from '#src/infra/database/prisma/client.js'

import { getApp, resetDatabase } from './utils/app.js'
import { buildMultipartPayload } from './utils/multipart.js'
import { createPdfBuffer } from '../utils/attachment-fixtures.js'

const hasher = new BcryptjsHasher(4)

async function createUser(role: UserRole, email: string): Promise<{ id: string }> {
  const passwordHash = await hasher.hash('Senha1234')
  return prisma.user.create({
    data: {
      name: role === UserRole.OMBUDSMAN ? 'Ouvidor Oficial' : 'Pessoa Manifestante',
      email,
      passwordHash,
      role,
    },
    select: { id: true },
  })
}

async function signIn(email: string): Promise<string> {
  const app = await getApp()
  const response = await app.inject({
    method: 'POST',
    url: '/sessions',
    payload: { email, password: 'Senha1234' },
  })
  return response.json<{ token: string }>().token
}

async function createIdentifiedManifestation(manifestantToken: string): Promise<{ id: string; protocol: string }> {
  const app = await getApp()
  const response = await app.inject({
    method: 'POST',
    url: '/manifestations',
    headers: { authorization: `Bearer ${manifestantToken}` },
    payload: {
      isAnonymous: false,
      type: 'complaint',
      campusId: 'campus-professor-alexandre-alves-de-oliveira',
      administrativeUnitId: 'unit-direcao-parnaiba',
      description: 'Houve atraso no atendimento.',
    },
  })
  return response.json<{ manifestation: { id: string; protocol: string } }>().manifestation
}

describe('Manifestation administration with traceability (e2e)', () => {
  beforeAll(async () => {
    await getApp()
  })

  afterEach(async () => {
    await resetDatabase()
  })

  it('answers a manifestation and records the status transition atomically', async () => {
    const app = await getApp()
    await createUser(UserRole.MANIFESTANT, 'manifestant@example.com')
    await createUser(UserRole.OMBUDSMAN, 'ombudsman@example.com')

    const manifestantToken = await signIn('manifestant@example.com')
    const ombudsmanToken = await signIn('ombudsman@example.com')
    const manifestation = await createIdentifiedManifestation(manifestantToken)

    const answerResponse = await app.inject({
      method: 'POST',
      url: `/admin/manifestations/${manifestation.id}/answer`,
      headers: { authorization: `Bearer ${ombudsmanToken}` },
      payload: { content: 'Obrigado pelo registro. Vamos apurar o caso.' },
    })

    expect(answerResponse.statusCode).toBe(201)

    const detailsResponse = await app.inject({
      method: 'GET',
      url: `/admin/manifestations/${manifestation.id}`,
      headers: { authorization: `Bearer ${ombudsmanToken}` },
    })
    expect(detailsResponse.statusCode).toBe(200)

    const details = detailsResponse.json<{
      manifestation: {
        status: string
        history: { type: string; fromStatus: string | null; toStatus: string | null }[]
        messages: { senderType: string; content: string }[]
      }
    }>()

    expect(details.manifestation.status).toBe('answered')
    expect(details.manifestation.messages).toHaveLength(1)
    expect(details.manifestation.messages[0]?.senderType).toBe('ombudsman')

    const historyTypes = details.manifestation.history.map((h) => h.type)
    expect(historyTypes).toStrictEqual(['registered', 'administrative_answered', 'status_changed'])

    const transition = details.manifestation.history.find((h) => h.type === 'status_changed')
    expect(transition?.fromStatus).toBe('in_analysis')
    expect(transition?.toStatus).toBe('answered')

    const systemMessages = await prisma.manifestationMessage.count({
      where: { manifestationId: manifestation.id, senderType: 'system' },
    })
    expect(systemMessages).toBe(1)
  })

  it('shows attachments in admin details and emits signed download URLs for ombudsman/admin', async () => {
    const app = await getApp()
    await createUser(UserRole.MANIFESTANT, 'manifestant@example.com')
    await createUser(UserRole.OMBUDSMAN, 'ombudsman@example.com')

    const manifestantToken = await signIn('manifestant@example.com')
    const ombudsmanToken = await signIn('ombudsman@example.com')
    const manifestation = await createIdentifiedManifestation(manifestantToken)

    const multipart = buildMultipartPayload({
      file: {
        filename: 'report.pdf',
        contentType: 'application/pdf',
        content: createPdfBuffer(),
      },
    })

    const uploadResponse = await app.inject({
      method: 'POST',
      url: `/manifestations/${manifestation.id}/attachments`,
      headers: {
        authorization: `Bearer ${manifestantToken}`,
        ...multipart.headers,
      },
      payload: multipart.body,
    })

    expect(uploadResponse.statusCode).toBe(201)
    const uploaded = uploadResponse.json<{ attachment: { id: string; originalName: string } }>()

    const detailsResponse = await app.inject({
      method: 'GET',
      url: `/admin/manifestations/${manifestation.id}`,
      headers: { authorization: `Bearer ${ombudsmanToken}` },
    })

    expect(detailsResponse.statusCode).toBe(200)
    const details = detailsResponse.json<{
      manifestation: { attachments: Array<{ id: string; originalName: string }> }
    }>()
    expect(details.manifestation.attachments).toHaveLength(1)
    expect(details.manifestation.attachments[0]).toMatchObject({
      id: uploaded.attachment.id,
      originalName: 'report.pdf',
    })

    const downloadUrlResponse = await app.inject({
      method: 'POST',
      url: `/admin/manifestations/${manifestation.id}/attachments/${uploaded.attachment.id}/download-url`,
      headers: { authorization: `Bearer ${ombudsmanToken}` },
    })

    expect(downloadUrlResponse.statusCode).toBe(200)
    expect(downloadUrlResponse.json()).toStrictEqual({
      downloadUrl: 'https://storage.test/download/1?expiresIn=300',
    })
  })

  it('updates manifestation status and writes a system audit row', async () => {
    const app = await getApp()
    await createUser(UserRole.MANIFESTANT, 'manifestant@example.com')
    await createUser(UserRole.OMBUDSMAN, 'ombudsman@example.com')

    const manifestantToken = await signIn('manifestant@example.com')
    const ombudsmanToken = await signIn('ombudsman@example.com')
    const manifestation = await createIdentifiedManifestation(manifestantToken)

    const patchResponse = await app.inject({
      method: 'PATCH',
      url: `/admin/manifestations/${manifestation.id}/status`,
      headers: { authorization: `Bearer ${ombudsmanToken}` },
      payload: { status: 'canceled' },
    })
    expect(patchResponse.statusCode).toBe(200)

    const detailsResponse = await app.inject({
      method: 'GET',
      url: `/admin/manifestations/${manifestation.id}`,
      headers: { authorization: `Bearer ${ombudsmanToken}` },
    })
    const details = detailsResponse.json<{
      manifestation: {
        status: string
        history: { type: string; fromStatus: string | null; toStatus: string | null }[]
      }
    }>()

    expect(details.manifestation.status).toBe('canceled')
    const lastEntry = details.manifestation.history.at(-1)
    expect(lastEntry?.type).toBe('status_changed')
    expect(lastEntry?.fromStatus).toBe('in_analysis')
    expect(lastEntry?.toStatus).toBe('canceled')
  })

  it('rejects PATCH /status with status=answered (only POST /answer can reach answered)', async () => {
    const app = await getApp()
    await createUser(UserRole.MANIFESTANT, 'manifestant@example.com')
    await createUser(UserRole.OMBUDSMAN, 'ombudsman@example.com')

    const manifestantToken = await signIn('manifestant@example.com')
    const ombudsmanToken = await signIn('ombudsman@example.com')
    const manifestation = await createIdentifiedManifestation(manifestantToken)

    const response = await app.inject({
      method: 'PATCH',
      url: `/admin/manifestations/${manifestation.id}/status`,
      headers: { authorization: `Bearer ${ombudsmanToken}` },
      payload: { status: 'answered' },
    })

    expect(response.statusCode).toBe(409)
  })

  it('rejects an ombudsman trying to open an identified manifestation (403)', async () => {
    const app = await getApp()
    await createUser(UserRole.OMBUDSMAN, 'ombudsman@example.com')
    const ombudsmanToken = await signIn('ombudsman@example.com')

    const response = await app.inject({
      method: 'POST',
      url: '/manifestations',
      headers: { authorization: `Bearer ${ombudsmanToken}` },
      payload: {
        isAnonymous: false,
        type: 'complaint',
        campusId: 'campus-professor-alexandre-alves-de-oliveira',
        administrativeUnitId: 'unit-direcao-parnaiba',
        description: 'Ouvidor abrindo em nome próprio.',
      },
    })

    expect(response.statusCode).toBe(403)
  })

  it('forbids a manifestant from calling admin routes', async () => {
    const app = await getApp()
    await createUser(UserRole.MANIFESTANT, 'manifestant@example.com')
    const token = await signIn('manifestant@example.com')

    const response = await app.inject({
      method: 'GET',
      url: '/admin/manifestations',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(response.statusCode).toBe(403)
  })

  it('rejects unauthenticated requests to admin routes', async () => {
    const app = await getApp()
    const response = await app.inject({ method: 'GET', url: '/admin/manifestations' })
    expect(response.statusCode).toBe(401)
  })
})
