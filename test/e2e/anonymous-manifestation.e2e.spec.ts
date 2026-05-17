import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import { getApp, resetDatabase } from './utils/app.js'

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
        administrativeUnitId: 'unit-prad-teresina',
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

  it('returns not found when the access code is wrong', async () => {
    const app = await getApp()

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/manifestations',
      payload: {
        isAnonymous: true,
        type: 'suggestion',
        campusId: 'campus-poeta-torquato-neto',
        administrativeUnitId: 'unit-preg-teresina',
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
})
