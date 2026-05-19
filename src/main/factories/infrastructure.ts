import type { AiGateway } from '#src/application/ai/ai-gateway.js'
import { FakeAiGateway } from '#src/infra/ai/fake-ai-gateway.js'
import { HttpAiGateway } from '#src/infra/ai/http-ai-gateway.js'
import { JwtTokenGenerator } from '#src/infra/auth/jwt-token-generator.js'
import { BcryptjsHasher } from '#src/infra/cryptography/bcryptjs-hasher.js'
import { prisma } from '#src/infra/database/prisma/client.js'
import { PrismaCatalogRepository } from '#src/infra/database/prisma/repositories/prisma-catalog-repository.js'
import { PrismaManifestationAdministrationRepository } from '#src/infra/database/prisma/repositories/prisma-manifestation-administration-repository.js'
import { PrismaManifestationAttachmentsRepository } from '#src/infra/database/prisma/repositories/prisma-manifestation-attachments-repository.js'
import { PrismaManifestationEvaluationsRepository } from '#src/infra/database/prisma/repositories/prisma-manifestation-evaluations-repository.js'
import { PrismaManifestationInteractionsRepository } from '#src/infra/database/prisma/repositories/prisma-manifestation-interactions-repository.js'
import { PrismaManifestationsRepository } from '#src/infra/database/prisma/repositories/prisma-manifestations-repository.js'
import { PrismaUsersRepository } from '#src/infra/database/prisma/repositories/prisma-users-repository.js'
import { RandomAccessCodeGenerator } from '#src/infra/protocol/random-access-code-generator.js'
import { UuidProtocolGenerator } from '#src/infra/protocol/uuid-protocol-generator.js'
import { InMemoryAttachmentStorage } from '#src/infra/storage/in-memory/in-memory-attachment-storage.js'
import { SupabaseAttachmentStorage } from '#src/infra/storage/supabase/supabase-attachment-storage.js'

import { env } from '../config/env.js'

const passwordHasher = new BcryptjsHasher(env.PASSWORD_HASH_ROUNDS)
const tokenGenerator = new JwtTokenGenerator({
  secret: env.JWT_SECRET,
  expiresInSeconds: env.JWT_EXPIRES_IN_SECONDS,
})
const protocolGenerator = new UuidProtocolGenerator()
const accessCodeGenerator = new RandomAccessCodeGenerator()

const catalogRepository = new PrismaCatalogRepository(prisma)
const usersRepository = new PrismaUsersRepository(prisma)
const manifestationsRepository = new PrismaManifestationsRepository(prisma)
const manifestationAttachmentsRepository = new PrismaManifestationAttachmentsRepository(prisma)
const manifestationAdministrationRepository = new PrismaManifestationAdministrationRepository(prisma)
const manifestationInteractionsRepository = new PrismaManifestationInteractionsRepository(prisma)
const manifestationEvaluationsRepository = new PrismaManifestationEvaluationsRepository(prisma)
const attachmentStorage =
  env.NODE_ENV === 'test'
    ? new InMemoryAttachmentStorage()
    : new SupabaseAttachmentStorage({
        url: env.SUPABASE_URL,
        serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
        bucket: env.SUPABASE_STORAGE_BUCKET,
      })
const aiGateway: AiGateway =
  env.AI_GATEWAY_PROVIDER === 'http' && env.AI_SERVICE_BASE_URL !== undefined && env.AI_SERVICE_API_KEY !== undefined
    ? new HttpAiGateway({
        baseUrl: env.AI_SERVICE_BASE_URL,
        apiKey: env.AI_SERVICE_API_KEY,
        timeoutMs: env.AI_SERVICE_TIMEOUT_MS,
      })
    : new FakeAiGateway()

export const infrastructure = {
  passwordHasher,
  hashComparer: passwordHasher,
  tokenGenerator,
  protocolGenerator,
  accessCodeGenerator,
  catalogRepository,
  usersRepository,
  manifestationsRepository,
  manifestationAttachmentsRepository,
  manifestationAdministrationRepository,
  manifestationInteractionsRepository,
  manifestationEvaluationsRepository,
  attachmentStorage,
  aiGateway,
}
