import { z } from 'zod'

import { GetMeUseCase } from '#src/application/use-cases/get-me/get-me-use-case.js'
import { RegisterUserUseCase } from '#src/application/use-cases/register-user/register-user.use-case.js'
import { SignInUseCase } from '#src/application/use-cases/signin/sign-in-use-case.js'
import { ZodValidator } from '#src/infra/http/fastify/validators/zod-validator.js'
import { GetMeController } from '#src/presentation/controllers/auth/get-me.controller.js'
import { RegisterUserController } from '#src/presentation/controllers/auth/register-user.controller.js'
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
  const useCase = new RegisterUserUseCase(infrastructure.usersRepository, infrastructure.passwordHasher)
  return new RegisterUserController(useCase, new ZodValidator(registerUserSchema))
}
