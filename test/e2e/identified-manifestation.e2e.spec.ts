import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import { MAX_ATTACHMENTS_PER_MANIFESTATION } from '#src/application/attachments/attachment-policy.js'
import { prisma } from '#src/infra/database/prisma/client.js'

import { getApp, resetDatabase } from './utils/app.js'
import { buildMultipartPayload } from './utils/multipart.js'
import { createOversizedPdfBuffer, createPdfBuffer, createPngBuffer } from '../utils/attachment-fixtures.js'

async function registerAndSignIn(): Promise<{ token: string }> {
  const app = await getApp()
  const credentials = { email: 'identified@example.com', password: 'Senha1234' }

  await app.inject({
    method: 'POST',
    url: '/users',
    payload: { name: 'Diana Reis', ...credentials },
  })

  const signIn = await app.inject({
    method: 'POST',
    url: '/sessions',
    payload: credentials,
  })

  return { token: signIn.json<{ token: string }>().token }
}

describe('Identified manifestation (e2e)', () => {
  beforeAll(async () => {
    await getApp()
  })

  afterEach(async () => {
    await resetDatabase()
  })

  it('lets an authenticated manifestant register and list own manifestations', async () => {
    const app = await getApp()
    const { token } = await registerAndSignIn()
    const authHeader = { authorization: `Bearer ${token}` }

    const createResponse = await app.inject({
      method: 'POST',
      url: '/manifestations',
      headers: authHeader,
      payload: {
        isAnonymous: false,
        type: 'report',
        campusId: 'campus-professor-alexandre-alves-de-oliveira',
        administrativeUnitId: 'unit-direcao-professor-alexandre-alves-de-oliveira',
        description: 'Documento extraviado.',
      },
    })
    expect(createResponse.statusCode).toBe(201)
    const created = createResponse.json<{ manifestation: { id: string; protocol: string } }>()

    const listResponse = await app.inject({
      method: 'GET',
      url: '/manifestations?page=1',
      headers: authHeader,
    })
    expect(listResponse.statusCode).toBe(200)
    const list = listResponse.json<{ manifestations: { id: string; protocol: string }[] }>()
    expect(list.manifestations).toHaveLength(1)
    expect(list.manifestations[0]?.id).toBe(created.manifestation.id)

    const detailsResponse = await app.inject({
      method: 'GET',
      url: `/manifestations/${created.manifestation.id}`,
      headers: authHeader,
    })
    expect(detailsResponse.statusCode).toBe(200)
    const details = detailsResponse.json<{
      manifestation: { history: { type: string }[]; messages: unknown[]; attachments: unknown[] }
    }>()
    expect(details.manifestation.history.map((h) => h.type)).toStrictEqual(['registered'])
    expect(details.manifestation.messages).toStrictEqual([])
    expect(details.manifestation.attachments).toStrictEqual([])
  })

  it('uploads an attachment, exposes it in details and keeps POST /manifestations as JSON-only', async () => {
    const app = await getApp()
    const { token } = await registerAndSignIn()
    const authHeader = { authorization: `Bearer ${token}` }

    const createResponse = await app.inject({
      method: 'POST',
      url: '/manifestations',
      headers: authHeader,
      payload: {
        isAnonymous: false,
        type: 'report',
        campusId: 'campus-professor-alexandre-alves-de-oliveira',
        administrativeUnitId: 'unit-direcao-professor-alexandre-alves-de-oliveira',
        description: 'Documento extraviado.',
      },
    })
    const created = createResponse.json<{ manifestation: { id: string } }>().manifestation

    const multipart = buildMultipartPayload({
      file: {
        filename: 'evidence.pdf',
        contentType: 'application/pdf',
        content: createPdfBuffer(),
      },
    })

    const uploadResponse = await app.inject({
      method: 'POST',
      url: `/manifestations/${created.id}/attachments`,
      headers: {
        ...authHeader,
        ...multipart.headers,
      },
      payload: multipart.body,
    })

    expect(uploadResponse.statusCode).toBe(201)
    const uploaded = uploadResponse.json<{
      attachment: { id: string; originalName: string; mimeType: string; uploadedByType: string }
    }>()
    expect(uploaded.attachment.originalName).toBe('evidence.pdf')
    expect(uploaded.attachment.mimeType).toBe('application/pdf')
    expect(uploaded.attachment.uploadedByType).toBe('manifestant')

    const detailsResponse = await app.inject({
      method: 'GET',
      url: `/manifestations/${created.id}`,
      headers: authHeader,
    })

    expect(detailsResponse.statusCode).toBe(200)
    const details = detailsResponse.json<{
      manifestation: { attachments: Array<{ id: string; originalName: string; mimeType: string }> }
    }>()
    expect(details.manifestation.attachments).toHaveLength(1)
    expect(details.manifestation.attachments[0]).toMatchObject({
      id: uploaded.attachment.id,
      originalName: 'evidence.pdf',
      mimeType: 'application/pdf',
    })

    const downloadUrlResponse = await app.inject({
      method: 'POST',
      url: `/manifestations/${created.id}/attachments/${uploaded.attachment.id}/download-url`,
      headers: authHeader,
    })

    expect(downloadUrlResponse.statusCode).toBe(200)
    expect(downloadUrlResponse.json()).toStrictEqual({
      downloadUrl: 'https://storage.test/download/1?expiresIn=300',
    })

    const wrongContractResponse = await app.inject({
      method: 'POST',
      url: '/manifestations',
      headers: multipart.headers,
      payload: multipart.body,
    })

    expect(wrongContractResponse.statusCode).toBe(400)
  })

  it('rejects identified register without auth', async () => {
    const app = await getApp()

    const response = await app.inject({
      method: 'POST',
      url: '/manifestations',
      payload: {
        isAnonymous: false,
        type: 'complaint',
        campusId: 'campus-poeta-torquato-neto',
        administrativeUnitId: 'unit-prad',
        description: 'Sem auth.',
      },
    })
    expect(response.statusCode).toBe(401)
  })

  it('forbids accessing another manifestant manifestation', async () => {
    const app = await getApp()
    const { token: tokenA } = await registerAndSignIn()

    const created = await app.inject({
      method: 'POST',
      url: '/manifestations',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        isAnonymous: false,
        type: 'compliment',
        campusId: 'campus-poeta-torquato-neto',
        administrativeUnitId: 'unit-preg',
        description: 'Elogio.',
      },
    })
    const { manifestation } = created.json<{ manifestation: { id: string } }>()

    await app.inject({
      method: 'POST',
      url: '/users',
      payload: { name: 'Eva Brito', email: 'eva@example.com', password: 'Senha1234' },
    })
    const signInB = await app.inject({
      method: 'POST',
      url: '/sessions',
      payload: { email: 'eva@example.com', password: 'Senha1234' },
    })
    const tokenB = signInB.json<{ token: string }>().token

    const response = await app.inject({
      method: 'GET',
      url: `/manifestations/${manifestation.id}`,
      headers: { authorization: `Bearer ${tokenB}` },
    })
    expect(response.statusCode).toBe(403)
  })

  it('prevents another manifestant from uploading or downloading attachments', async () => {
    const app = await getApp()
    const { token: tokenA } = await registerAndSignIn()

    const created = await app.inject({
      method: 'POST',
      url: '/manifestations',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        isAnonymous: false,
        type: 'compliment',
        campusId: 'campus-poeta-torquato-neto',
        administrativeUnitId: 'unit-preg',
        description: 'Elogio.',
      },
    })
    const { manifestation } = created.json<{ manifestation: { id: string } }>()

    const multipart = buildMultipartPayload({
      file: {
        filename: 'proof.png',
        contentType: 'image/png',
        content: createPngBuffer(),
      },
    })

    const uploadResponse = await app.inject({
      method: 'POST',
      url: `/manifestations/${manifestation.id}/attachments`,
      headers: {
        authorization: `Bearer ${tokenA}`,
        ...multipart.headers,
      },
      payload: multipart.body,
    })
    const uploaded = uploadResponse.json<{ attachment: { id: string } }>()

    await app.inject({
      method: 'POST',
      url: '/users',
      payload: { name: 'Eva Brito', email: 'eva@example.com', password: 'Senha1234' },
    })
    const signInB = await app.inject({
      method: 'POST',
      url: '/sessions',
      payload: { email: 'eva@example.com', password: 'Senha1234' },
    })
    const tokenB = signInB.json<{ token: string }>().token

    const forbiddenUpload = await app.inject({
      method: 'POST',
      url: `/manifestations/${manifestation.id}/attachments`,
      headers: {
        authorization: `Bearer ${tokenB}`,
        ...multipart.headers,
      },
      payload: multipart.body,
    })
    expect(forbiddenUpload.statusCode).toBe(403)

    const forbiddenDownload = await app.inject({
      method: 'POST',
      url: `/manifestations/${manifestation.id}/attachments/${uploaded.attachment.id}/download-url`,
      headers: { authorization: `Bearer ${tokenB}` },
    })
    expect(forbiddenDownload.statusCode).toBe(403)
  })

  it('rejects invalid attachment content, empty files, oversized files, limit overflow and terminal states', async () => {
    const app = await getApp()
    const { token } = await registerAndSignIn()
    const authHeader = { authorization: `Bearer ${token}` }

    const createResponse = await app.inject({
      method: 'POST',
      url: '/manifestations',
      headers: authHeader,
      payload: {
        isAnonymous: false,
        type: 'report',
        campusId: 'campus-professor-alexandre-alves-de-oliveira',
        administrativeUnitId: 'unit-direcao-professor-alexandre-alves-de-oliveira',
        description: 'Documento extraviado.',
      },
    })
    const manifestationId = createResponse.json<{ manifestation: { id: string } }>().manifestation.id

    const spoofedMultipart = buildMultipartPayload({
      file: {
        filename: 'spoofed.png',
        contentType: 'image/png',
        content: createPdfBuffer(),
      },
    })

    const spoofedResponse = await app.inject({
      method: 'POST',
      url: `/manifestations/${manifestationId}/attachments`,
      headers: { ...authHeader, ...spoofedMultipart.headers },
      payload: spoofedMultipart.body,
    })
    expect(spoofedResponse.statusCode).toBe(400)

    const emptyMultipart = buildMultipartPayload({
      file: {
        filename: 'empty.pdf',
        contentType: 'application/pdf',
        content: Buffer.alloc(0),
      },
    })

    const emptyResponse = await app.inject({
      method: 'POST',
      url: `/manifestations/${manifestationId}/attachments`,
      headers: { ...authHeader, ...emptyMultipart.headers },
      payload: emptyMultipart.body,
    })
    expect(emptyResponse.statusCode).toBe(400)

    const oversizedMultipart = buildMultipartPayload({
      file: {
        filename: 'large.pdf',
        contentType: 'application/pdf',
        content: createOversizedPdfBuffer(),
      },
    })

    const oversizedResponse = await app.inject({
      method: 'POST',
      url: `/manifestations/${manifestationId}/attachments`,
      headers: { ...authHeader, ...oversizedMultipart.headers },
      payload: oversizedMultipart.body,
    })
    expect(oversizedResponse.statusCode).toBe(400)

    for (let index = 0; index < MAX_ATTACHMENTS_PER_MANIFESTATION; index += 1) {
      const uploadMultipart = buildMultipartPayload({
        file: {
          filename: `evidence-${String(index)}.pdf`,
          contentType: 'application/pdf',
          content: createPdfBuffer(),
        },
      })

      const uploadResponse = await app.inject({
        method: 'POST',
        url: `/manifestations/${manifestationId}/attachments`,
        headers: { ...authHeader, ...uploadMultipart.headers },
        payload: uploadMultipart.body,
      })

      expect(uploadResponse.statusCode).toBe(201)
    }

    const limitMultipart = buildMultipartPayload({
      file: {
        filename: 'overflow.pdf',
        contentType: 'application/pdf',
        content: createPdfBuffer(),
      },
    })

    const limitResponse = await app.inject({
      method: 'POST',
      url: `/manifestations/${manifestationId}/attachments`,
      headers: { ...authHeader, ...limitMultipart.headers },
      payload: limitMultipart.body,
    })
    expect(limitResponse.statusCode).toBe(409)

    const otherManifestationResponse = await app.inject({
      method: 'POST',
      url: '/manifestations',
      headers: authHeader,
      payload: {
        isAnonymous: false,
        type: 'complaint',
        campusId: 'campus-poeta-torquato-neto',
        administrativeUnitId: 'unit-preg',
        description: 'Outra manifestação.',
      },
    })
    const otherManifestationId = otherManifestationResponse.json<{ manifestation: { id: string } }>().manifestation.id

    await prisma.manifestation.update({
      where: { id: otherManifestationId },
      data: { status: 'canceled' },
    })

    const terminalMultipart = buildMultipartPayload({
      file: {
        filename: 'terminal.pdf',
        contentType: 'application/pdf',
        content: createPdfBuffer(),
      },
    })

    const terminalResponse = await app.inject({
      method: 'POST',
      url: `/manifestations/${otherManifestationId}/attachments`,
      headers: { ...authHeader, ...terminalMultipart.headers },
      payload: terminalMultipart.body,
    })

    expect(terminalResponse.statusCode).toBe(409)
  })
})
