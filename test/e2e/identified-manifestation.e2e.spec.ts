import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import { getApp, resetDatabase } from './utils/app.js'

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
        campusId: 'campus-teresina',
        administrativeUnitId: 'unit-secretaria',
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
      manifestation: { history: { type: string }[]; messages: unknown[] }
    }>()
    expect(details.manifestation.history.map((h) => h.type)).toStrictEqual(['registered'])
    expect(details.manifestation.messages).toStrictEqual([])
  })

  it('rejects identified register without auth', async () => {
    const app = await getApp()

    const response = await app.inject({
      method: 'POST',
      url: '/manifestations',
      payload: {
        isAnonymous: false,
        type: 'complaint',
        campusId: 'campus-teresina',
        administrativeUnitId: 'unit-rh',
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
        campusId: 'campus-teresina',
        administrativeUnitId: 'unit-rh',
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
})
