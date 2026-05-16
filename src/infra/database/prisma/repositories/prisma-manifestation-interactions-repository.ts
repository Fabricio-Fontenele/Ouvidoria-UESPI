import type { PrismaClient } from '@prisma/client'

import type { ManifestationMessageDTO } from '#src/application/dto/manifestation-query-dtos.js'
import type { ManifestationInteractionsRepository } from '#src/application/repositories/manifestation-interactions-repository.js'
import type { ManifestationMessage } from '#src/domain/entities/manifestation-message.js'

import { manifestationMessageMapper } from '../mappers/manifestation-message.mapper.js'

export class PrismaManifestationInteractionsRepository implements ManifestationInteractionsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async addMessage(message: ManifestationMessage): Promise<ManifestationMessageDTO> {
    const persisted = await this.prisma.manifestationMessage.create({
      data: manifestationMessageMapper.toPersistence(message),
    })

    return manifestationMessageMapper.toDTO(persisted)
  }
}
