import type { AiGateway } from '#src/application/ai/ai-gateway.js'
import type { EmailSender } from '#src/application/email/email-sender.js'
import { AdministrativeUnitForwardingEmailNotifier } from '#src/application/notifications/administrative-unit-forwarding-notifier.js'
import { ManifestationStatusEmailNotifier } from '#src/application/notifications/manifestation-status-notifier.js'
import { FakeAiGateway } from '#src/infra/ai/fake-ai-gateway.js'
import { HttpAiGateway } from '#src/infra/ai/http-ai-gateway.js'
import { JwtTokenGenerator } from '#src/infra/auth/jwt-token-generator.js'
import { BcryptjsHasher } from '#src/infra/cryptography/bcryptjs-hasher.js'
import { CachedCatalogRepository } from '#src/infra/database/cached-catalog-repository.js'
import { prisma } from '#src/infra/database/prisma/client.js'
import { PrismaAdministrativeUnitResponsiblesRepository } from '#src/infra/database/prisma/repositories/prisma-administrative-unit-responsibles-repository.js'
import { PrismaCatalogRepository } from '#src/infra/database/prisma/repositories/prisma-catalog-repository.js'
import { PrismaManifestationAdministrationRepository } from '#src/infra/database/prisma/repositories/prisma-manifestation-administration-repository.js'
import { PrismaManifestationAttachmentsRepository } from '#src/infra/database/prisma/repositories/prisma-manifestation-attachments-repository.js'
import { PrismaManifestationEvaluationsRepository } from '#src/infra/database/prisma/repositories/prisma-manifestation-evaluations-repository.js'
import { PrismaManifestationInteractionsRepository } from '#src/infra/database/prisma/repositories/prisma-manifestation-interactions-repository.js'
import { PrismaManifestationsRepository } from '#src/infra/database/prisma/repositories/prisma-manifestations-repository.js'
import { PrismaUsersRepository } from '#src/infra/database/prisma/repositories/prisma-users-repository.js'
import { BrevoEmailSender } from '#src/infra/email/brevo-email-sender.js'
import { ConsoleEmailSender } from '#src/infra/email/console-email-sender.js'
import { RandomAccessCodeGenerator } from '#src/infra/protocol/random-access-code-generator.js'
import { RandomVerificationCodeGenerator } from '#src/infra/protocol/random-verification-code-generator.js'
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
const verificationCodeGenerator =
  env.NODE_ENV === 'test' ? { generate: async () => '123456' } : new RandomVerificationCodeGenerator()

function makeEmailSender(): EmailSender {
  if (env.EMAIL_PROVIDER !== 'brevo') {
    return new ConsoleEmailSender()
  }

  if (env.BREVO_API_KEY === undefined || env.EMAIL_FROM === undefined) {
    throw new Error('BREVO_API_KEY and EMAIL_FROM are required when EMAIL_PROVIDER=brevo')
  }

  return new BrevoEmailSender({
    apiKey: env.BREVO_API_KEY,
    fromEmail: env.EMAIL_FROM,
    fromName: env.EMAIL_FROM_NAME,
  })
}

const emailSender = makeEmailSender()

const catalogRepository = new CachedCatalogRepository(new PrismaCatalogRepository(prisma), env.CATALOG_CACHE_TTL_MS)
const usersRepository = new PrismaUsersRepository(prisma)
const administrativeUnitResponsiblesRepository = new PrismaAdministrativeUnitResponsiblesRepository(prisma)
const manifestationsRepository = new PrismaManifestationsRepository(prisma)
const manifestationAttachmentsRepository = new PrismaManifestationAttachmentsRepository(prisma)
const manifestationAdministrationRepository = new PrismaManifestationAdministrationRepository(prisma)
const manifestationInteractionsRepository = new PrismaManifestationInteractionsRepository(prisma)
const manifestationEvaluationsRepository = new PrismaManifestationEvaluationsRepository(prisma)
const manifestationStatusNotifier = new ManifestationStatusEmailNotifier(usersRepository, emailSender)
const administrativeUnitForwardingNotifier = new AdministrativeUnitForwardingEmailNotifier(
  administrativeUnitResponsiblesRepository,
  emailSender,
)
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
  verificationCodeGenerator,
  emailSender,
  catalogRepository,
  usersRepository,
  administrativeUnitResponsiblesRepository,
  manifestationsRepository,
  manifestationAttachmentsRepository,
  manifestationAdministrationRepository,
  manifestationInteractionsRepository,
  manifestationEvaluationsRepository,
  manifestationStatusNotifier,
  administrativeUnitForwardingNotifier,
  attachmentStorage,
  aiGateway,
}
