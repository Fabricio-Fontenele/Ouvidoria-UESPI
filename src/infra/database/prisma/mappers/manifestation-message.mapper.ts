import type {
  ManifestationMessage as PrismaManifestationMessage,
  ManifestationMessageSenderType as PrismaSenderType,
} from '@prisma/client'

import type { ManifestationMessageDTO } from '#src/application/dto/manifestation-query-dtos.js'
import {
  ManifestationMessage,
  type ManifestationMessageSenderType,
} from '#src/domain/entities/manifestation-message.js'
import { ManifestationMessageContent } from '#src/domain/value-objects/manifestation-message-content.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

export const manifestationMessageMapper = {
  toDomain(raw: PrismaManifestationMessage): ManifestationMessage {
    return ManifestationMessage.create(
      {
        manifestationId: new UniqueEntityId(raw.manifestationId),
        senderUserId: raw.senderUserId === null ? null : new UniqueEntityId(raw.senderUserId),
        senderType: raw.senderType as ManifestationMessageSenderType,
        content: ManifestationMessageContent.create(raw.content),
        createdAt: raw.createdAt,
      },
      new UniqueEntityId(raw.id),
    )
  },

  toPersistence(message: ManifestationMessage): {
    id: string
    manifestationId: string
    senderUserId: string | null
    senderType: PrismaSenderType
    content: string
    createdAt: Date
  } {
    return {
      id: message.id.toString(),
      manifestationId: message.manifestationId.toString(),
      senderUserId: message.senderUserId?.toString() ?? null,
      senderType: message.senderType,
      content: message.content.getValue(),
      createdAt: message.createdAt,
    }
  },

  toDTO(raw: PrismaManifestationMessage): ManifestationMessageDTO {
    return {
      id: raw.id,
      senderUserId: raw.senderUserId,
      senderType: raw.senderType as ManifestationMessageSenderType,
      content: raw.content,
      createdAt: raw.createdAt,
    }
  },
}
