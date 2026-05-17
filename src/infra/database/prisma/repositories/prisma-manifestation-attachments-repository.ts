import type { PrismaClient } from '@prisma/client'

import type { ManifestationAttachmentsRepository } from '#src/application/repositories/manifestation-attachments-repository.js'
import { ManifestationAttachmentsLimitExceededError } from '#src/application/use-cases/manifestation-attachments/errors/manifestation-attachments-limit-exceeded-error.js'
import type { ManifestationAttachment } from '#src/domain/entities/manifestation-attachment.js'

import { manifestationAttachmentMapper } from '../mappers/manifestation-attachment.mapper.js'

export class PrismaManifestationAttachmentsRepository implements ManifestationAttachmentsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async countByManifestationId(manifestationId: string): Promise<number> {
    return this.prisma.manifestationAttachment.count({
      where: { manifestationId },
    })
  }

  async findById(attachmentId: string): Promise<ManifestationAttachment | null> {
    const record = await this.prisma.manifestationAttachment.findUnique({
      where: { id: attachmentId },
    })

    return record === null ? null : manifestationAttachmentMapper.toDomain(record)
  }

  async save(attachment: ManifestationAttachment, maxAttachmentsPerManifestation: number): Promise<void> {
    const data = manifestationAttachmentMapper.toPersistence(attachment)

    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT "id"
        FROM "manifestations"
        WHERE "id" = CAST(${data.manifestationId} AS UUID)
        FOR UPDATE
      `

      const currentCount = await tx.manifestationAttachment.count({
        where: { manifestationId: data.manifestationId },
      })

      if (currentCount >= maxAttachmentsPerManifestation) {
        throw new ManifestationAttachmentsLimitExceededError()
      }

      await tx.manifestationAttachment.create({ data })
    })
  }
}
