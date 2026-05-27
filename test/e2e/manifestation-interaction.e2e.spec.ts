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
  return response.json<{ manifestation: { id: string } }>().manifestation
}

async function answerManifestation(ombudsmanToken: string, manifestationId: string): Promise<void> {
  const app = await getApp()
  const response = await app.inject({
    method: 'POST',
    url: `/admin/manifestations/${manifestationId}/answer`,
    headers: { authorization: `Bearer ${ombudsmanToken}` },
    payload: { content: 'Vamos apurar.' },
  })
  expect(response.statusCode).toBe(201)
}

describe('Manifestation interaction (e2e)', () => {
  beforeAll(async () => {
    await getApp()
  })

  afterEach(async () => {
    await resetDatabase()
  })

  describe('Add message', () => {
    it('lets the author append a message and lists it on the details', async () => {
      const app = await getApp()
      await createUser(UserRole.MANIFESTANT, 'author@example.com')
      const token = await signIn('author@example.com')
      const manifestation = await openManifestation(token)

      const response = await app.inject({
        method: 'POST',
        url: `/manifestations/${manifestation.id}/messages`,
        headers: { authorization: `Bearer ${token}` },
        payload: { content: 'Segue um detalhe adicional.' },
      })

      expect(response.statusCode).toBe(201)

      const details = await app.inject({
        method: 'GET',
        url: `/manifestations/${manifestation.id}`,
        headers: { authorization: `Bearer ${token}` },
      })
      const body = details.json<{
        manifestation: { messages: { senderType: string; content: string }[] }
      }>()
      expect(body.manifestation.messages).toHaveLength(1)
      expect(body.manifestation.messages[0]?.senderType).toBe('manifestant')
      expect(body.manifestation.messages[0]?.content).toBe('Segue um detalhe adicional.')
    })

    it('rejects an empty message with 400', async () => {
      const app = await getApp()
      await createUser(UserRole.MANIFESTANT, 'author@example.com')
      const token = await signIn('author@example.com')
      const manifestation = await openManifestation(token)

      const response = await app.inject({
        method: 'POST',
        url: `/manifestations/${manifestation.id}/messages`,
        headers: { authorization: `Bearer ${token}` },
        payload: { content: '   ' },
      })

      expect(response.statusCode).toBe(400)
    })

    it('rejects message from another manifestant with 403', async () => {
      const app = await getApp()
      await createUser(UserRole.MANIFESTANT, 'author@example.com')
      await createUser(UserRole.MANIFESTANT, 'intruder@example.com')
      const authorToken = await signIn('author@example.com')
      const intruderToken = await signIn('intruder@example.com')
      const manifestation = await openManifestation(authorToken)

      const response = await app.inject({
        method: 'POST',
        url: `/manifestations/${manifestation.id}/messages`,
        headers: { authorization: `Bearer ${intruderToken}` },
        payload: { content: 'Conteúdo malicioso.' },
      })

      expect(response.statusCode).toBe(403)
    })

    it('blocks new messages after finalization with 409', async () => {
      const app = await getApp()
      await createUser(UserRole.MANIFESTANT, 'author@example.com')
      await createUser(UserRole.OMBUDSMAN, 'ombudsman@example.com')
      const authorToken = await signIn('author@example.com')
      const ombudsmanToken = await signIn('ombudsman@example.com')
      const manifestation = await openManifestation(authorToken)

      await answerManifestation(ombudsmanToken, manifestation.id)

      const finalizeResponse = await app.inject({
        method: 'POST',
        url: `/manifestations/${manifestation.id}/finalize`,
        headers: { authorization: `Bearer ${authorToken}` },
      })
      expect(finalizeResponse.statusCode).toBe(200)

      const response = await app.inject({
        method: 'POST',
        url: `/manifestations/${manifestation.id}/messages`,
        headers: { authorization: `Bearer ${authorToken}` },
        payload: { content: 'Tentando mandar depois de finalizada.' },
      })

      expect(response.statusCode).toBe(409)
    })

    it('rejects unauthenticated requests with 401', async () => {
      const app = await getApp()
      await createUser(UserRole.MANIFESTANT, 'author@example.com')
      const token = await signIn('author@example.com')
      const manifestation = await openManifestation(token)

      const response = await app.inject({
        method: 'POST',
        url: `/manifestations/${manifestation.id}/messages`,
        payload: { content: 'Sem token.' },
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('Finalize manifestation', () => {
    it('finalizes after the ombudsman answer and records the audit row', async () => {
      const app = await getApp()
      await createUser(UserRole.MANIFESTANT, 'author@example.com')
      await createUser(UserRole.OMBUDSMAN, 'ombudsman@example.com')
      const authorToken = await signIn('author@example.com')
      const ombudsmanToken = await signIn('ombudsman@example.com')
      const manifestation = await openManifestation(authorToken)

      await answerManifestation(ombudsmanToken, manifestation.id)

      const response = await app.inject({
        method: 'POST',
        url: `/manifestations/${manifestation.id}/finalize`,
        headers: { authorization: `Bearer ${authorToken}` },
      })

      expect(response.statusCode).toBe(200)

      const details = await app.inject({
        method: 'GET',
        url: `/manifestations/${manifestation.id}`,
        headers: { authorization: `Bearer ${authorToken}` },
      })
      const body = details.json<{
        manifestation: {
          status: string
          history: { type: string; fromStatus: string | null; toStatus: string | null }[]
        }
      }>()

      expect(body.manifestation.status).toBe('finalized')
      const lastEntry = body.manifestation.history.at(-1)
      expect(lastEntry?.type).toBe('finalized_by_author')
      expect(lastEntry?.fromStatus).toBe('answered')
      expect(lastEntry?.toStatus).toBe('finalized')

      const systemMessages = await prisma.manifestationMessage.count({
        where: {
          manifestationId: manifestation.id,
          senderType: 'system',
          senderUserId: null,
        },
      })
      // 1 for the answer status transition + 1 for the finalize
      expect(systemMessages).toBe(2)
    })

    it('returns 409 when trying to finalize before the answer (status still in_analysis)', async () => {
      const app = await getApp()
      await createUser(UserRole.MANIFESTANT, 'author@example.com')
      const token = await signIn('author@example.com')
      const manifestation = await openManifestation(token)

      const response = await app.inject({
        method: 'POST',
        url: `/manifestations/${manifestation.id}/finalize`,
        headers: { authorization: `Bearer ${token}` },
      })

      expect(response.statusCode).toBe(409)
    })

    it('returns 403 when another manifestant tries to finalize', async () => {
      const app = await getApp()
      await createUser(UserRole.MANIFESTANT, 'author@example.com')
      await createUser(UserRole.MANIFESTANT, 'intruder@example.com')
      await createUser(UserRole.OMBUDSMAN, 'ombudsman@example.com')
      const authorToken = await signIn('author@example.com')
      const intruderToken = await signIn('intruder@example.com')
      const ombudsmanToken = await signIn('ombudsman@example.com')
      const manifestation = await openManifestation(authorToken)

      await answerManifestation(ombudsmanToken, manifestation.id)

      const response = await app.inject({
        method: 'POST',
        url: `/manifestations/${manifestation.id}/finalize`,
        headers: { authorization: `Bearer ${intruderToken}` },
      })

      expect(response.statusCode).toBe(403)
    })

    it('returns 401 when called without auth', async () => {
      const app = await getApp()
      await createUser(UserRole.MANIFESTANT, 'author@example.com')
      const token = await signIn('author@example.com')
      const manifestation = await openManifestation(token)

      const response = await app.inject({
        method: 'POST',
        url: `/manifestations/${manifestation.id}/finalize`,
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
