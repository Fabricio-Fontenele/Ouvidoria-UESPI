import { z } from 'zod'

import { ConfirmEmailVerificationUseCase } from '#src/application/use-cases/confirm-email-verification/confirm-email-verification-use-case.js'
import { GetMeUseCase } from '#src/application/use-cases/get-me/get-me-use-case.js'
import { ConfirmPasswordResetCodeUseCase } from '#src/application/use-cases/password-reset/confirm-password-reset-code-use-case.js'
import { RequestPasswordResetUseCase } from '#src/application/use-cases/password-reset/request-password-reset-use-case.js'
import { ResetPasswordUseCase } from '#src/application/use-cases/password-reset/reset-password-use-case.js'
import { RegisterUserUseCase } from '#src/application/use-cases/register-user/register-user.use-case.js'
import { ResendEmailVerificationCodeUseCase } from '#src/application/use-cases/resend-email-verification-code/resend-email-verification-code-use-case.js'
import { SignInUseCase } from '#src/application/use-cases/signin/sign-in-use-case.js'
import { ZodValidator } from '#src/infra/http/fastify/validators/zod-validator.js'
import { ConfirmEmailVerificationController } from '#src/presentation/controllers/auth/confirm-email-verification.controller.js'
import { ConfirmPasswordResetCodeController } from '#src/presentation/controllers/auth/confirm-password-reset-code.controller.js'
import { GetMeController } from '#src/presentation/controllers/auth/get-me.controller.js'
import { RegisterUserController } from '#src/presentation/controllers/auth/register-user.controller.js'
import { RequestPasswordResetController } from '#src/presentation/controllers/auth/request-password-reset.controller.js'
import { ResendEmailVerificationCodeController } from '#src/presentation/controllers/auth/resend-email-verification-code.controller.js'
import { ResetPasswordController } from '#src/presentation/controllers/auth/reset-password.controller.js'
import { SignInController } from '#src/presentation/controllers/auth/sign-in.controller.js'

import { infrastructure } from '../infrastructure.js'

const signInSchema = z.object({
  email: z.string(),
  password: z.string(),
})

const registerUserSchema = z.object({
  name: z.string(),
  email: z.string(),
  password: z.string(),
})

const confirmEmailVerificationSchema = z.object({
  email: z.string(),
  code: z.string().regex(/^\d{6}$/, 'code must contain 6 digits'),
})

const resendEmailVerificationCodeSchema = z.object({
  email: z.string(),
})

const requestPasswordResetSchema = z.object({
  email: z.string(),
})

const confirmPasswordResetCodeSchema = z.object({
  email: z.string(),
  code: z.string().regex(/^\d{6}$/, 'code must contain 6 digits'),
})

const resetPasswordSchema = z.object({
  email: z.string(),
  code: z.string().regex(/^\d{6}$/, 'code must contain 6 digits'),
  password: z.string(),
})

export function makeSignInController(): SignInController {
  const useCase = new SignInUseCase(
    infrastructure.usersRepository,
    infrastructure.hashComparer,
    infrastructure.tokenGenerator,
  )
  return new SignInController(useCase, new ZodValidator(signInSchema))
}

export function makeGetMeController(): GetMeController {
  const useCase = new GetMeUseCase(infrastructure.usersRepository, infrastructure.manifestationEvaluationsRepository)
  return new GetMeController(useCase)
}

export function makeRegisterUserController(): RegisterUserController {
  const useCase = new RegisterUserUseCase(
    infrastructure.usersRepository,
    infrastructure.passwordHasher,
    infrastructure.verificationCodeGenerator,
    infrastructure.emailSender,
  )
  return new RegisterUserController(useCase, new ZodValidator(registerUserSchema))
}

export function makeConfirmEmailVerificationController(): ConfirmEmailVerificationController {
  const useCase = new ConfirmEmailVerificationUseCase(
    infrastructure.usersRepository,
    infrastructure.hashComparer,
    infrastructure.tokenGenerator,
  )
  return new ConfirmEmailVerificationController(useCase, new ZodValidator(confirmEmailVerificationSchema))
}

export function makeResendEmailVerificationCodeController(): ResendEmailVerificationCodeController {
  const useCase = new ResendEmailVerificationCodeUseCase(
    infrastructure.usersRepository,
    infrastructure.passwordHasher,
    infrastructure.verificationCodeGenerator,
    infrastructure.emailSender,
  )
  return new ResendEmailVerificationCodeController(useCase, new ZodValidator(resendEmailVerificationCodeSchema))
}

export function makeRequestPasswordResetController(): RequestPasswordResetController {
  const useCase = new RequestPasswordResetUseCase(
    infrastructure.usersRepository,
    infrastructure.passwordHasher,
    infrastructure.verificationCodeGenerator,
    infrastructure.emailSender,
  )
  return new RequestPasswordResetController(useCase, new ZodValidator(requestPasswordResetSchema))
}

export function makeConfirmPasswordResetCodeController(): ConfirmPasswordResetCodeController {
  const useCase = new ConfirmPasswordResetCodeUseCase(infrastructure.usersRepository, infrastructure.hashComparer)
  return new ConfirmPasswordResetCodeController(useCase, new ZodValidator(confirmPasswordResetCodeSchema))
}

export function makeResetPasswordController(): ResetPasswordController {
  const useCase = new ResetPasswordUseCase(
    infrastructure.usersRepository,
    infrastructure.hashComparer,
    infrastructure.passwordHasher,
    infrastructure.tokenGenerator,
  )
  return new ResetPasswordController(useCase, new ZodValidator(resetPasswordSchema))
}
