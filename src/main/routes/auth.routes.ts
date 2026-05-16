import type { FastifyInstance } from 'fastify'

import { adaptRoute } from '#src/infra/http/fastify/fastify-route-adapter.js'

import { makeRegisterUserController, makeSignInController } from '../factories/controllers/auth.js'

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post('/sessions', adaptRoute(makeSignInController()))
  app.post('/users', adaptRoute(makeRegisterUserController()))
}
