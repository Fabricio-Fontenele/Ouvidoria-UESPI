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

const signInRateLimit = {
  config: {
    rateLimit: { max: 5, timeWindow: '1 minute' },
  },
} as const

const accountCreationRateLimit = {
  config: {
    rateLimit: { max: 5, timeWindow: '10 minutes' },
  },
} as const

const codeChallengeRateLimit = {
  config: {
    rateLimit: { max: 10, timeWindow: '10 minutes' },
  },
} as const

const codeRequestRateLimit = {
  config: {
    rateLimit: { max: 3, timeWindow: '10 minutes' },
  },
} as const

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/me', { preHandler: ensureAuthenticated }, adaptRoute(makeGetMeController()))
  app.post('/sessions', signInRateLimit, adaptRoute(makeSignInController()))
  app.post('/users', accountCreationRateLimit, adaptRoute(makeRegisterUserController()))
  app.post('/email-verification/confirm', codeChallengeRateLimit, adaptRoute(makeConfirmEmailVerificationController()))
  app.post('/email-verification/codes', codeRequestRateLimit, adaptRoute(makeResendEmailVerificationCodeController()))
  app.post('/password-reset/codes', codeRequestRateLimit, adaptRoute(makeRequestPasswordResetController()))
  app.post('/password-reset/confirm', codeChallengeRateLimit, adaptRoute(makeConfirmPasswordResetCodeController()))
  app.post('/password-reset', codeChallengeRateLimit, adaptRoute(makeResetPasswordController()))
}
