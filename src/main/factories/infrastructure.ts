import { JwtTokenGenerator } from '#src/infra/auth/jwt-token-generator.js'
import { BcryptjsHasher } from '#src/infra/cryptography/bcryptjs-hasher.js'
import { prisma } from '#src/infra/database/prisma/client.js'
import { PrismaManifestationAdministrationRepository } from '#src/infra/database/prisma/repositories/prisma-manifestation-administration-repository.js'
import { PrismaManifestationEvaluationsRepository } from '#src/infra/database/prisma/repositories/prisma-manifestation-evaluations-repository.js'
import { PrismaManifestationInteractionsRepository } from '#src/infra/database/prisma/repositories/prisma-manifestation-interactions-repository.js'
import { PrismaManifestationsRepository } from '#src/infra/database/prisma/repositories/prisma-manifestations-repository.js'
import { PrismaUsersRepository } from '#src/infra/database/prisma/repositories/prisma-users-repository.js'
import { RandomAccessCodeGenerator } from '#src/infra/protocol/random-access-code-generator.js'
import { UuidProtocolGenerator } from '#src/infra/protocol/uuid-protocol-generator.js'

import { env } from '../config/env.js'

const passwordHasher = new BcryptjsHasher(env.PASSWORD_HASH_ROUNDS)
const tokenGenerator = new JwtTokenGenerator({
  secret: env.JWT_SECRET,
  expiresInSeconds: env.JWT_EXPIRES_IN_SECONDS,
})
const protocolGenerator = new UuidProtocolGenerator()
const accessCodeGenerator = new RandomAccessCodeGenerator()

const usersRepository = new PrismaUsersRepository(prisma)
const manifestationsRepository = new PrismaManifestationsRepository(prisma)
const manifestationAdministrationRepository = new PrismaManifestationAdministrationRepository(prisma)
const manifestationInteractionsRepository = new PrismaManifestationInteractionsRepository(prisma)
const manifestationEvaluationsRepository = new PrismaManifestationEvaluationsRepository(prisma)

export const infrastructure = {
  passwordHasher,
  hashComparer: passwordHasher,
  tokenGenerator,
  protocolGenerator,
  accessCodeGenerator,
  usersRepository,
  manifestationsRepository,
  manifestationAdministrationRepository,
  manifestationInteractionsRepository,
  manifestationEvaluationsRepository,
}
