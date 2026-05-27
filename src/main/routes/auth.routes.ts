import type { FastifyInstance } from 'fastify'

import { adaptRoute } from '#src/infra/http/fastify/fastify-route-adapter.js'
import { ensureAuthenticated } from '#src/infra/http/fastify/middlewares/auth-middleware.js'

import {
  makeConfirmEmailVerificationController,
  makeConfirmPasswordResetCodeController,
  makeGetMeController,
  makeRegisterUserController,
  makeRequestPasswordResetController,
  makeResendEmailVerificationCodeController,
  makeResetPasswordController,
  makeSignInController,
} from '../factories/controllers/auth.js'

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/me', { preHandler: ensureAuthenticated }, adaptRoute(makeGetMeController()))
  app.post('/sessions', adaptRoute(makeSignInController()))
  app.post('/users', adaptRoute(makeRegisterUserController()))
  app.post('/email-verification/confirm', adaptRoute(makeConfirmEmailVerificationController()))
  app.post('/email-verification/codes', adaptRoute(makeResendEmailVerificationCodeController()))
  app.post('/password-reset/codes', adaptRoute(makeRequestPasswordResetController()))
  app.post('/password-reset/confirm', adaptRoute(makeConfirmPasswordResetCodeController()))
  app.post('/password-reset', adaptRoute(makeResetPasswordController()))
}
