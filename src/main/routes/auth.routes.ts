import type { FastifyInstance } from 'fastify'

import { adaptRoute } from '#src/infra/http/fastify/fastify-route-adapter.js'
import { ensureAuthenticated } from '#src/infra/http/fastify/middlewares/auth-middleware.js'

import { makeGetMeController, makeRegisterUserController, makeSignInController } from '../factories/controllers/auth.js'

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/me', { preHandler: ensureAuthenticated }, adaptRoute(makeGetMeController()))
  app.post('/sessions', adaptRoute(makeSignInController()))
  app.post('/users', adaptRoute(makeRegisterUserController()))
}
