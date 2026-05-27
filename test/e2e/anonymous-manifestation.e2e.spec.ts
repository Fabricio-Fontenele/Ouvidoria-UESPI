import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import { getApp, resetDatabase } from './utils/app.js'
import { buildMultipartPayload } from './utils/multipart.js'
import { createPdfBuffer, createPngBuffer } from '../utils/attachment-fixtures.js'

describe('Anonymous manifestation (e2e)', () => {
  beforeAll(async () => {
    await getApp()
  })

  afterEach(async () => {
    await resetDatabase()
  })

  it('opens an anonymous manifestation and tracks it by protocol + access code', async () => {
    const app = await getApp()

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/manifestations',
      payload: {
        isAnonymous: true,
        type: 'complaint',
        campusId: 'campus-poeta-torquato-neto',
        administrativeUnitId: 'unit-prad',
        description: 'Há ruído excessivo no setor administrativo.',
      },
    })

    expect(registerResponse.statusCode).toBe(201)
    const body = registerResponse.json<{
      manifestation: { protocol: string; status: string; isAnonymous: boolean }
      accessCode: string
    }>()
    expect(body.manifestation.isAnonymous).toBe(true)
    expect(body.manifestation.status).toBe('in_analysis')
    expect(body.accessCode).toStrictEqual(expect.any(String))

    const trackResponse = await app.inject({
      method: 'POST',
      url: '/manifestations/track',
      payload: { protocol: body.manifestation.protocol, accessCode: body.accessCode },
    })

    expect(trackResponse.statusCode).toBe(200)
    const tracked = trackResponse.json<{ manifestation: { protocol: string; status: string } }>()
    expect(tracked.manifestation.protocol).toBe(body.manifestation.protocol)
    expect(tracked.manifestation.status).toBe('in_analysis')
  })

  it('uploads an anonymous attachment and returns only the public tracking details projection', async () => {
    const app = await getApp()

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/manifestations',
      payload: {
        isAnonymous: true,
        type: 'complaint',
        campusId: 'campus-poeta-torquato-neto',
        administrativeUnitId: 'unit-prad',
        description: 'Há ruído excessivo no setor administrativo.',
      },
    })
    const body = registerResponse.json<{
      manifestation: { protocol: string }
      accessCode: string
    }>()

    const multipart = buildMultipartPayload({
      fields: {
        protocol: body.manifestation.protocol,
        accessCode: body.accessCode,
      },
      fileFirst: true,
      file: {
        filename: 'evidence.png',
        contentType: 'image/png',
        content: createPngBuffer(),
      },
    })

    const uploadResponse = await app.inject({
      method: 'POST',
      url: '/manifestations/track/attachments',
      headers: multipart.headers,
      payload: multipart.body,
    })

    expect(uploadResponse.statusCode).toBe(201)
    const uploaded = uploadResponse.json<{
      attachment: { id: string; uploadedByType: string; originalName: string }
    }>()
    expect(uploaded.attachment.uploadedByType).toBe('anonymous_manifestant')
    expect(uploaded.attachment.originalName).toBe('evidence.png')

    const detailsResponse = await app.inject({
      method: 'POST',
      url: '/manifestations/track/details',
      payload: {
        protocol: body.manifestation.protocol,
        accessCode: body.accessCode,
      },
    })

    expect(detailsResponse.statusCode).toBe(200)
    const details = detailsResponse.json<{
      manifestation: {
        protocol: string
        status: string
        description: string
        messages: Array<{ senderUserId?: string }>
        attachments: Array<{ id: string; originalName: string }>
      }
    }>()

    expect(details.manifestation.attachments).toHaveLength(1)
    expect(details.manifestation.attachments[0]).toMatchObject({
      id: uploaded.attachment.id,
      originalName: 'evidence.png',
    })
    expect(Object.keys(details.manifestation).sort()).toStrictEqual(
      [
        'protocol',
        'type',
        'status',
        'campusId',
        'administrativeUnitId',
        'description',
        'forwardedToUnit',
        'createdAt',
        'messages',
        'attachments',
      ].sort(),
    )
    expect(details.manifestation.description).toBe('Há ruído excessivo no setor administrativo.')
    expect('history' in details.manifestation).toBe(false)
    expect('authorUserId' in details.manifestation).toBe(false)
    expect(details.manifestation.messages.every((message) => !('senderUserId' in message))).toBe(true)

    const downloadUrlResponse = await app.inject({
      method: 'POST',
      url: `/manifestations/track/attachments/${uploaded.attachment.id}/download-url`,
      payload: {
        protocol: body.manifestation.protocol,
        accessCode: body.accessCode,
      },
    })

    expect(downloadUrlResponse.statusCode).toBe(200)
    expect(downloadUrlResponse.json()).toStrictEqual({
      downloadUrl: 'https://storage.test/download/1?expiresIn=300',
    })
  })

  it('returns not found when the access code is wrong', async () => {
    const app = await getApp()

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/manifestations',
      payload: {
        isAnonymous: true,
        type: 'suggestion',
        campusId: 'campus-poeta-torquato-neto',
        administrativeUnitId: 'unit-preg',
        description: 'Sugestão genérica.',
      },
    })
    const body = registerResponse.json<{ manifestation: { protocol: string } }>()

    const trackResponse = await app.inject({
      method: 'POST',
      url: '/manifestations/track',
      payload: { protocol: body.manifestation.protocol, accessCode: 'WRONGCODE9' },
    })

    expect(trackResponse.statusCode).toBe(404)
  })

  it('rejects anonymous attachment upload with invalid credentials', async () => {
    const app = await getApp()

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/manifestations',
      payload: {
        isAnonymous: true,
        type: 'suggestion',
        campusId: 'campus-poeta-torquato-neto',
        administrativeUnitId: 'unit-preg',
        description: 'Sugestão genérica.',
      },
    })
    const body = registerResponse.json<{ manifestation: { protocol: string } }>()

    const multipart = buildMultipartPayload({
      fields: {
        protocol: body.manifestation.protocol,
        accessCode: 'WRONGCODE9',
      },
      file: {
        filename: 'evidence.pdf',
        contentType: 'application/pdf',
        content: createPdfBuffer(),
      },
    })

    const uploadResponse = await app.inject({
      method: 'POST',
      url: '/manifestations/track/attachments',
      headers: multipart.headers,
      payload: multipart.body,
    })

    expect(uploadResponse.statusCode).toBe(404)
  })

  it('does not allow anonymous tracking credentials from another manifestation to download an attachment', async () => {
    const app = await getApp()

    const firstRegisterResponse = await app.inject({
      method: 'POST',
      url: '/manifestations',
      payload: {
        isAnonymous: true,
        type: 'complaint',
        campusId: 'campus-poeta-torquato-neto',
        administrativeUnitId: 'unit-prad',
        description: 'Primeira manifestação.',
      },
    })
    const firstBody = firstRegisterResponse.json<{ manifestation: { protocol: string }; accessCode: string }>()

    const secondRegisterResponse = await app.inject({
      method: 'POST',
      url: '/manifestations',
      payload: {
        isAnonymous: true,
        type: 'suggestion',
        campusId: 'campus-poeta-torquato-neto',
        administrativeUnitId: 'unit-preg',
        description: 'Segunda manifestação.',
      },
    })
    const secondBody = secondRegisterResponse.json<{ manifestation: { protocol: string }; accessCode: string }>()

    const uploadMultipart = buildMultipartPayload({
      fields: {
        protocol: firstBody.manifestation.protocol,
        accessCode: firstBody.accessCode,
      },
      file: {
        filename: 'evidence.pdf',
        contentType: 'application/pdf',
        content: createPdfBuffer(),
      },
    })

    const uploadResponse = await app.inject({
      method: 'POST',
      url: '/manifestations/track/attachments',
      headers: uploadMultipart.headers,
      payload: uploadMultipart.body,
    })

    const attachmentId = uploadResponse.json<{ attachment: { id: string } }>().attachment.id

    const downloadResponse = await app.inject({
      method: 'POST',
      url: `/manifestations/track/attachments/${attachmentId}/download-url`,
      payload: {
        protocol: secondBody.manifestation.protocol,
        accessCode: secondBody.accessCode,
      },
    })

    expect(downloadResponse.statusCode).toBe(404)
  })
})
