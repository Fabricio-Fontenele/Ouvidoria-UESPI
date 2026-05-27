import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import { UserRole } from '#src/domain/entities/user.js'
import { BcryptjsHasher } from '#src/infra/cryptography/bcryptjs-hasher.js'
import { prisma } from '#src/infra/database/prisma/client.js'

import { getApp, resetDatabase } from './utils/app.js'

const hasher = new BcryptjsHasher(4)

async function createUser(role: UserRole, email: string): Promise<{ id: string }> {
  const passwordHash = await hasher.hash('Senha1234')
  return prisma.user.create({
    data: {
      name: role === UserRole.OMBUDSMAN ? 'Ouvidor Oficial' : 'Pessoa Manifestante',
      email,
      passwordHash,
      role,
      emailVerifiedAt: new Date(),
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
  expect(response.statusCode).toBe(200)
  return response.json<{ token: string }>().token
}

async function openManifestation(token: string): Promise<{ id: string }> {
  const app = await getApp()
  const response = await app.inject({
    method: 'POST',
    url: '/manifestations',
    headers: { authorization: `Bearer ${token}` },
    payload: {
      isAnonymous: false,
      type: 'complaint',
      campusId: 'campus-professor-antonio-giovanni-alves-de-sousa',
      administrativeUnitId: 'unit-direcao-professor-antonio-giovani-alves-de-sousa',
      description: 'Houve atraso no atendimento.',
    },
  })
  expect(response.statusCode).toBe(201)
  return response.json<{ manifestation: { id: string } }>().manifestation
}

async function answerManifestation(token: string, manifestationId: string): Promise<void> {
  const app = await getApp()
  const response = await app.inject({
    method: 'POST',
    url: `/admin/manifestations/${manifestationId}/answer`,
    headers: { authorization: `Bearer ${token}` },
    payload: { content: 'Vamos apurar.' },
  })
  expect(response.statusCode).toBe(201)
}

async function finalizeManifestation(token: string, manifestationId: string): Promise<void> {
  const app = await getApp()
  const response = await app.inject({
    method: 'POST',
    url: `/manifestations/${manifestationId}/finalize`,
    headers: { authorization: `Bearer ${token}` },
  })
  expect(response.statusCode).toBe(200)
}

async function evaluateManifestation(token: string, manifestationId: string, rating: number): Promise<void> {
  const app = await getApp()
  const response = await app.inject({
    method: 'POST',
    url: `/manifestations/${manifestationId}/evaluation`,
    headers: { authorization: `Bearer ${token}` },
    payload: { rating },
  })
  expect(response.statusCode).toBe(201)
}

describe('Auth (e2e)', () => {
  beforeAll(async () => {
    await getApp()
  })

  afterEach(async () => {
    await resetDatabase()
  })

  it('registers a user, verifies email and signs in', async () => {
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

    const confirmationResponse = await app.inject({
      method: 'POST',
      url: '/email-verification/confirm',
      payload: { email: 'ana@example.com', code: '123456' },
    })

    expect(confirmationResponse.statusCode).toBe(200)
    expect(confirmationResponse.json<{ token: string }>().token).toStrictEqual(expect.any(String))

    const signInResponse = await app.inject({
      method: 'POST',
      url: '/sessions',
      payload: { email: 'ana@example.com', password: 'Senha1234' },
    })

    expect(signInResponse.statusCode).toBe(200)
    expect(signInResponse.json<{ token: string }>().token).toStrictEqual(expect.any(String))
  })

  it('rejects sign-in before email verification', async () => {
    const app = await getApp()

    await app.inject({
      method: 'POST',
      url: '/users',
      payload: { name: 'Bianca Rocha', email: 'bianca@example.com', password: 'Senha1234' },
    })

    const response = await app.inject({
      method: 'POST',
      url: '/sessions',
      payload: { email: 'bianca@example.com', password: 'Senha1234' },
    })

    expect(response.statusCode).toBe(403)
  })

  it('returns the current authenticated user profile', async () => {
    const app = await getApp()

    await app.inject({
      method: 'POST',
      url: '/users',
      payload: { name: 'Ana Souza', email: 'ana@example.com', password: 'Senha1234' },
    })
    await app.inject({
      method: 'POST',
      url: '/email-verification/confirm',
      payload: { email: 'ana@example.com', code: '123456' },
    })
    const token = await signIn('ana@example.com')

    const response = await app.inject({
      method: 'GET',
      url: '/me',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(response.statusCode).toBe(200)
    const body = response.json<{
      user: {
        attendanceRating: null
        createdAt: string
        email: string
        id: string
        name: string
        role: string
      }
    }>()

    expect(body.user).toMatchObject({
      email: 'ana@example.com',
      name: 'Ana Souza',
      role: 'manifestant',
      attendanceRating: null,
    })
    expect(body.user.id).toStrictEqual(expect.any(String))
    expect(new Date(body.user.createdAt).toISOString()).toBe(body.user.createdAt)
  })

  it('returns attendance rating summary for administrative users', async () => {
    const app = await getApp()

    await createUser(UserRole.MANIFESTANT, 'author@example.com')
    await createUser(UserRole.OMBUDSMAN, 'ombudsman@example.com')
    const authorToken = await signIn('author@example.com')
    const ombudsmanToken = await signIn('ombudsman@example.com')

    const firstManifestation = await openManifestation(authorToken)
    await answerManifestation(ombudsmanToken, firstManifestation.id)
    await finalizeManifestation(authorToken, firstManifestation.id)
    await evaluateManifestation(authorToken, firstManifestation.id, 5)

    const secondManifestation = await openManifestation(authorToken)
    await answerManifestation(ombudsmanToken, secondManifestation.id)
    await finalizeManifestation(authorToken, secondManifestation.id)
    await evaluateManifestation(authorToken, secondManifestation.id, 3)

    const response = await app.inject({
      method: 'GET',
      url: '/me',
      headers: { authorization: `Bearer ${ombudsmanToken}` },
    })

    expect(response.statusCode).toBe(200)
    expect(
      response.json<{
        user: { attendanceRating: { average: number | null; count: number } | null }
      }>().user.attendanceRating,
    ).toStrictEqual({ average: 4, count: 2 })
  })

  it('rejects current user requests without authentication', async () => {
    const app = await getApp()

    const response = await app.inject({
      method: 'GET',
      url: '/me',
    })

    expect(response.statusCode).toBe(401)
  })

  it('rejects current user requests with an invalid token', async () => {
    const app = await getApp()

    const response = await app.inject({
      method: 'GET',
      url: '/me',
      headers: { authorization: 'Bearer invalid-token' },
    })

    expect(response.statusCode).toBe(401)
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
