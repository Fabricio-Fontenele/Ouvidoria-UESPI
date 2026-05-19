import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import { getApp, resetDatabase } from './utils/app.js'

describe('Auth (e2e)', () => {
  beforeAll(async () => {
    await getApp()
  })

  afterEach(async () => {
    await resetDatabase()
  })

  it('registers a user and signs in', async () => {
    const app = await getApp()

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { name: 'Ana Souza', email: 'ana@example.com', password: 'Senha1234' },
    })

    expect(registerResponse.statusCode).toBe(201)
    const registered = registerResponse.json<{ user: { id: string; email: string; role: string } }>()
    expect(registered.user.email).toBe('ana@example.com')
    expect(registered.user.role).toBe('manifestant')

    const signInResponse = await app.inject({
      method: 'POST',
      url: '/sessions',
      payload: { email: 'ana@example.com', password: 'Senha1234' },
    })

    expect(signInResponse.statusCode).toBe(200)
    expect(signInResponse.json<{ token: string }>().token).toStrictEqual(expect.any(String))
  })

  it('rejects sign-in with invalid credentials', async () => {
    const app = await getApp()

    await app.inject({
      method: 'POST',
      url: '/users',
      payload: { name: 'Bruno Lima', email: 'bruno@example.com', password: 'Senha1234' },
    })

    const response = await app.inject({
      method: 'POST',
      url: '/sessions',
      payload: { email: 'bruno@example.com', password: 'WrongPass1' },
    })

    expect(response.statusCode).toBe(401)
  })

  it('rejects duplicate email on register', async () => {
    const app = await getApp()
    const payload = { name: 'Carla Dias', email: 'carla@example.com', password: 'Senha1234' }

    const first = await app.inject({ method: 'POST', url: '/users', payload })
    expect(first.statusCode).toBe(201)

    const second = await app.inject({ method: 'POST', url: '/users', payload })
    expect(second.statusCode).toBe(409)
  })
})
