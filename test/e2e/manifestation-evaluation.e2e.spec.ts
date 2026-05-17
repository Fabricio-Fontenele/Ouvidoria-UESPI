import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import { UserRole } from '#src/domain/entities/user.js'
import { BcryptjsHasher } from '#src/infra/cryptography/bcryptjs-hasher.js'
import { prisma } from '#src/infra/database/prisma/client.js'

import { getApp, resetDatabase } from './utils/app.js'

const hasher = new BcryptjsHasher(4)

async function createUser(role: UserRole, email: string): Promise<{ id: string }> {
  const passwordHash = await hasher.hash('Senha1234')
  const nameByRole: Record<UserRole, string> = {
    [UserRole.MANIFESTANT]: 'Pessoa Manifestante',
    [UserRole.OMBUDSMAN]: 'Ouvidor Oficial',
    [UserRole.ADMIN]: 'Administrador Geral',
  }
  return prisma.user.create({
    data: {
      name: nameByRole[role],
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
  if (response.statusCode !== 200) {
    throw new Error(`signIn failed for ${email}: ${response.statusCode.toString()} ${response.body}`)
  }
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
      campusId: 'campus-teresina',
      administrativeUnitId: 'unit-secretaria',
      description: 'Houve atraso no atendimento.',
    },
  })
  return response.json<{ manifestation: { id: string } }>().manifestation
}

async function answerManifestation(token: string, manifestationId: string, content = 'Vamos apurar.'): Promise<void> {
  const app = await getApp()
  const response = await app.inject({
    method: 'POST',
    url: `/admin/manifestations/${manifestationId}/answer`,
    headers: { authorization: `Bearer ${token}` },
    payload: { content },
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

async function getAttendantUserId(manifestationId: string): Promise<string | null> {
  const record = await prisma.manifestation.findUnique({
    where: { id: manifestationId },
    select: { attendantUserId: true },
  })
  return record?.attendantUserId ?? null
}

describe('Manifestation evaluation (e2e)', () => {
  beforeAll(async () => {
    await getApp()
  })

  afterEach(async () => {
    await resetDatabase()
  })

  describe('Attendant assignment regression', () => {
    it('records the first ombudsman responder as the attendant', async () => {
      await createUser(UserRole.MANIFESTANT, 'author@example.com')
      const ombudsman = await createUser(UserRole.OMBUDSMAN, 'ombudsman@example.com')
      const authorToken = await signIn('author@example.com')
      const ombudsmanToken = await signIn('ombudsman@example.com')
      const manifestation = await openManifestation(authorToken)

      await answerManifestation(ombudsmanToken, manifestation.id)

      expect(await getAttendantUserId(manifestation.id)).toBe(ombudsman.id)
    })

    it('keeps the original attendant when another administrative responder replies', async () => {
      await createUser(UserRole.MANIFESTANT, 'author@example.com')
      const ombudsmanA = await createUser(UserRole.OMBUDSMAN, 'ombudsman-a@example.com')
      await createUser(UserRole.OMBUDSMAN, 'ombudsman-b@example.com')
      const authorToken = await signIn('author@example.com')
      const tokenA = await signIn('ombudsman-a@example.com')
      const tokenB = await signIn('ombudsman-b@example.com')

      const manifestation = await openManifestation(authorToken)
      await answerManifestation(tokenA, manifestation.id, 'Primeira resposta.')
      await answerManifestation(tokenB, manifestation.id, 'Complementando.')

      expect(await getAttendantUserId(manifestation.id)).toBe(ombudsmanA.id)
    })

    it('records the admin as attendant when admin is the first administrative responder', async () => {
      await createUser(UserRole.MANIFESTANT, 'author@example.com')
      const admin = await createUser(UserRole.ADMIN, 'admin@example.com')
      const authorToken = await signIn('author@example.com')
      const adminToken = await signIn('admin@example.com')
      const manifestation = await openManifestation(authorToken)

      await answerManifestation(adminToken, manifestation.id, 'Resposta administrativa.')

      expect(await getAttendantUserId(manifestation.id)).toBe(admin.id)
    })
  })

  describe('POST /manifestations/:id/evaluation', () => {
    it('records an evaluation after the manifestation is finalized', async () => {
      const app = await getApp()
      await createUser(UserRole.MANIFESTANT, 'author@example.com')
      const ombudsman = await createUser(UserRole.OMBUDSMAN, 'ombudsman@example.com')
      const authorToken = await signIn('author@example.com')
      const ombudsmanToken = await signIn('ombudsman@example.com')
      const manifestation = await openManifestation(authorToken)

      await answerManifestation(ombudsmanToken, manifestation.id)
      await finalizeManifestation(authorToken, manifestation.id)

      const response = await app.inject({
        method: 'POST',
        url: `/manifestations/${manifestation.id}/evaluation`,
        headers: { authorization: `Bearer ${authorToken}` },
        payload: { rating: 5, comment: 'Atendimento excelente.' },
      })

      expect(response.statusCode).toBe(201)
      const body = response.json<{
        evaluation: {
          rating: number
          comment: string | null
          attendantUserId: string
          attendantRoleSnapshot: string
        }
      }>()
      expect(body.evaluation.rating).toBe(5)
      expect(body.evaluation.comment).toBe('Atendimento excelente.')
      expect(body.evaluation.attendantUserId).toBe(ombudsman.id)
      expect(body.evaluation.attendantRoleSnapshot).toBe('ombudsman')

      const stored = await prisma.manifestationEvaluation.findUnique({
        where: { manifestationId: manifestation.id },
      })
      expect(stored?.rating).toBe(5)
      expect(stored?.comment).toBe('Atendimento excelente.')
      expect(stored?.attendantUserId).toBe(ombudsman.id)

      const systemMessages = await prisma.manifestationMessage.findMany({
        where: { manifestationId: manifestation.id, senderType: 'system' },
        orderBy: { createdAt: 'asc' },
      })
      const decoded = systemMessages.map((message) => JSON.parse(message.content) as { type: string })
      expect(decoded.at(-1)?.type).toBe('evaluation_recorded')
    })

    it('returns 409 when the manifestation is already evaluated', async () => {
      const app = await getApp()
      await createUser(UserRole.MANIFESTANT, 'author@example.com')
      await createUser(UserRole.OMBUDSMAN, 'ombudsman@example.com')
      const authorToken = await signIn('author@example.com')
      const ombudsmanToken = await signIn('ombudsman@example.com')
      const manifestation = await openManifestation(authorToken)

      await answerManifestation(ombudsmanToken, manifestation.id)
      await finalizeManifestation(authorToken, manifestation.id)

      await app.inject({
        method: 'POST',
        url: `/manifestations/${manifestation.id}/evaluation`,
        headers: { authorization: `Bearer ${authorToken}` },
        payload: { rating: 5 },
      })

      const response = await app.inject({
        method: 'POST',
        url: `/manifestations/${manifestation.id}/evaluation`,
        headers: { authorization: `Bearer ${authorToken}` },
        payload: { rating: 4, comment: 'Segunda tentativa.' },
      })

      expect(response.statusCode).toBe(409)
    })

    it('returns 409 when the manifestation is not finalized', async () => {
      const app = await getApp()
      await createUser(UserRole.MANIFESTANT, 'author@example.com')
      await createUser(UserRole.OMBUDSMAN, 'ombudsman@example.com')
      const authorToken = await signIn('author@example.com')
      const ombudsmanToken = await signIn('ombudsman@example.com')
      const manifestation = await openManifestation(authorToken)

      await answerManifestation(ombudsmanToken, manifestation.id)

      const response = await app.inject({
        method: 'POST',
        url: `/manifestations/${manifestation.id}/evaluation`,
        headers: { authorization: `Bearer ${authorToken}` },
        payload: { rating: 5 },
      })

      expect(response.statusCode).toBe(409)
    })

    it('returns 403 when another manifestant tries to evaluate', async () => {
      const app = await getApp()
      await createUser(UserRole.MANIFESTANT, 'author@example.com')
      await createUser(UserRole.MANIFESTANT, 'intruder@example.com')
      await createUser(UserRole.OMBUDSMAN, 'ombudsman@example.com')
      const authorToken = await signIn('author@example.com')
      const intruderToken = await signIn('intruder@example.com')
      const ombudsmanToken = await signIn('ombudsman@example.com')
      const manifestation = await openManifestation(authorToken)

      await answerManifestation(ombudsmanToken, manifestation.id)
      await finalizeManifestation(authorToken, manifestation.id)

      const response = await app.inject({
        method: 'POST',
        url: `/manifestations/${manifestation.id}/evaluation`,
        headers: { authorization: `Bearer ${intruderToken}` },
        payload: { rating: 5 },
      })

      expect(response.statusCode).toBe(403)
    })

    it('returns 400 when rating is out of bounds', async () => {
      const app = await getApp()
      await createUser(UserRole.MANIFESTANT, 'author@example.com')
      await createUser(UserRole.OMBUDSMAN, 'ombudsman@example.com')
      const authorToken = await signIn('author@example.com')
      const ombudsmanToken = await signIn('ombudsman@example.com')
      const manifestation = await openManifestation(authorToken)

      await answerManifestation(ombudsmanToken, manifestation.id)
      await finalizeManifestation(authorToken, manifestation.id)

      const response = await app.inject({
        method: 'POST',
        url: `/manifestations/${manifestation.id}/evaluation`,
        headers: { authorization: `Bearer ${authorToken}` },
        payload: { rating: 6 },
      })

      expect(response.statusCode).toBe(400)
    })

    it('returns 400 when comment exceeds the length limit', async () => {
      const app = await getApp()
      await createUser(UserRole.MANIFESTANT, 'author@example.com')
      await createUser(UserRole.OMBUDSMAN, 'ombudsman@example.com')
      const authorToken = await signIn('author@example.com')
      const ombudsmanToken = await signIn('ombudsman@example.com')
      const manifestation = await openManifestation(authorToken)

      await answerManifestation(ombudsmanToken, manifestation.id)
      await finalizeManifestation(authorToken, manifestation.id)

      const response = await app.inject({
        method: 'POST',
        url: `/manifestations/${manifestation.id}/evaluation`,
        headers: { authorization: `Bearer ${authorToken}` },
        payload: { rating: 5, comment: 'x'.repeat(1001) },
      })

      expect(response.statusCode).toBe(400)
    })

    it('returns 401 without authentication', async () => {
      const app = await getApp()
      await createUser(UserRole.MANIFESTANT, 'author@example.com')
      await createUser(UserRole.OMBUDSMAN, 'ombudsman@example.com')
      const authorToken = await signIn('author@example.com')
      const ombudsmanToken = await signIn('ombudsman@example.com')
      const manifestation = await openManifestation(authorToken)

      await answerManifestation(ombudsmanToken, manifestation.id)
      await finalizeManifestation(authorToken, manifestation.id)

      const response = await app.inject({
        method: 'POST',
        url: `/manifestations/${manifestation.id}/evaluation`,
        payload: { rating: 5 },
      })

      expect(response.statusCode).toBe(401)
    })

    it('accepts null comment explicitly', async () => {
      const app = await getApp()
      await createUser(UserRole.MANIFESTANT, 'author@example.com')
      await createUser(UserRole.OMBUDSMAN, 'ombudsman@example.com')
      const authorToken = await signIn('author@example.com')
      const ombudsmanToken = await signIn('ombudsman@example.com')
      const manifestation = await openManifestation(authorToken)

      await answerManifestation(ombudsmanToken, manifestation.id)
      await finalizeManifestation(authorToken, manifestation.id)

      const response = await app.inject({
        method: 'POST',
        url: `/manifestations/${manifestation.id}/evaluation`,
        headers: { authorization: `Bearer ${authorToken}` },
        payload: { rating: 4, comment: null },
      })

      expect(response.statusCode).toBe(201)
      const stored = await prisma.manifestationEvaluation.findUnique({
        where: { manifestationId: manifestation.id },
      })
      expect(stored?.comment).toBeNull()
    })
  })
})
