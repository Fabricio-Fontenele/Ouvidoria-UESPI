import type { PrismaClient } from '@prisma/client'

import type { ManifestationMessageDTO } from '#src/application/dto/manifestation-query-dtos.js'
import type { ManifestationAdministrationRepository } from '#src/application/repositories/manifestation-administration-repository.js'
import {
  ManifestationMessageSenderType,
  type ManifestationMessage,
} from '#src/domain/entities/manifestation-message.js'
import {
  ManifestationCancellationReason,
  type Manifestation,
  type ManifestationStatus,
} from '#src/domain/entities/manifestation.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

import { manifestationMessageMapper } from '../mappers/manifestation-message.mapper.js'
import { manifestationMapper } from '../mappers/manifestation.mapper.js'
import { encodeSystemMessagePayload } from '../system-message-payload.js'

interface RecordAnswerParams {
  manifestation: Manifestation
  message: ManifestationMessage
  fromStatus: ManifestationStatus
  toStatus: ManifestationStatus
}

interface UpdateStatusParams {
  manifestation: Manifestation
  actorUserId: string
  actorType: ManifestationMessageSenderType
  fromStatus: ManifestationStatus
  toStatus: ManifestationStatus
}

interface FinalizeByAuthorParams {
  manifestation: Manifestation
  actorUserId: string
  actorType: ManifestationMessageSenderType
  fromStatus: ManifestationStatus
  toStatus: ManifestationStatus
}

interface ForwardToUnitParams {
  manifestation: Manifestation
  actorUserId: string
  actorType: ManifestationMessageSenderType
  forwardedToUnitName: string
  fromStatus: ManifestationStatus
  toStatus: ManifestationStatus
}

interface CancelParams {
  manifestation: Manifestation
  actorUserId: string
  actorType: ManifestationMessageSenderType
  fromStatus: ManifestationStatus
  toStatus: ManifestationStatus
  reason: ManifestationCancellationReason
  note: string | null
}

const CANCELLATION_REASON_LABELS: Record<ManifestationCancellationReason, string> = {
  [ManifestationCancellationReason.DUPLICATE]: 'Manifestação duplicada',
  [ManifestationCancellationReason.OUT_OF_SCOPE]: 'Fora da competência da ouvidoria',
  [ManifestationCancellationReason.INSUFFICIENT_INFORMATION]: 'Informações insuficientes para análise',
  [ManifestationCancellationReason.OFFENSIVE_CONTENT]: 'Conteúdo ofensivo ou impróprio',
  [ManifestationCancellationReason.SPAM_OR_TEST]: 'Registro de teste ou spam',
  [ManifestationCancellationReason.REQUESTED_BY_AUTHOR]: 'Cancelamento solicitado pelo autor',
  [ManifestationCancellationReason.OTHER]: 'Outro',
}

export class PrismaManifestationAdministrationRepository implements ManifestationAdministrationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async recordAnswer({
    manifestation,
    message,
    fromStatus,
    toStatus,
  }: RecordAnswerParams): Promise<ManifestationMessageDTO> {
    const manifestationData = manifestationMapper.toPersistence(manifestation)
    const messageData = manifestationMessageMapper.toPersistence(message)

    const persistedMessage = await this.prisma.$transaction(async (tx) => {
      await tx.manifestation.update({
        where: { id: manifestationData.id },
        data: { status: manifestationData.status, attendantUserId: manifestationData.attendantUserId },
      })

      const created = await tx.manifestationMessage.create({ data: messageData })

      if (fromStatus !== toStatus) {
        await tx.manifestationMessage.create({
          data: {
            id: new UniqueEntityId().toString(),
            manifestationId: manifestationData.id,
            senderUserId: null,
            senderType: ManifestationMessageSenderType.SYSTEM,
            content: encodeSystemMessagePayload({
              type: 'status_changed',
              description: `Status alterado de ${fromStatus} para ${toStatus} via resposta administrativa.`,
              actorUserId: messageData.senderUserId,
              actorType: messageData.senderType as ManifestationMessageSenderType,
              fromStatus,
              toStatus,
            }),
          },
        })
      }

      return created
    })

    return manifestationMessageMapper.toDTO(persistedMessage)
  }

  async updateStatus({
    manifestation,
    actorUserId,
    actorType,
    fromStatus,
    toStatus,
  }: UpdateStatusParams): Promise<void> {
    const manifestationData = manifestationMapper.toPersistence(manifestation)

    await this.prisma.$transaction(async (tx) => {
      await tx.manifestation.update({
        where: { id: manifestationData.id },
        data: { status: manifestationData.status, attendantUserId: manifestationData.attendantUserId },
      })

      await tx.manifestationMessage.create({
        data: {
          id: new UniqueEntityId().toString(),
          manifestationId: manifestationData.id,
          senderUserId: null,
          senderType: ManifestationMessageSenderType.SYSTEM,
          content: encodeSystemMessagePayload({
            type: 'status_changed',
            description: `Status alterado de ${fromStatus} para ${toStatus}.`,
            actorUserId,
            actorType,
            fromStatus,
            toStatus,
          }),
        },
      })
    })
  }

  async finalizeByAuthor({
    manifestation,
    actorUserId,
    actorType,
    fromStatus,
    toStatus,
  }: FinalizeByAuthorParams): Promise<void> {
    const manifestationData = manifestationMapper.toPersistence(manifestation)

    await this.prisma.$transaction(async (tx) => {
      await tx.manifestation.update({
        where: { id: manifestationData.id },
        data: { status: manifestationData.status, attendantUserId: manifestationData.attendantUserId },
      })

      await tx.manifestationMessage.create({
        data: {
          id: new UniqueEntityId().toString(),
          manifestationId: manifestationData.id,
          senderUserId: null,
          senderType: ManifestationMessageSenderType.SYSTEM,
          content: encodeSystemMessagePayload({
            type: 'finalized_by_author',
            description: 'Manifestação finalizada pelo autor.',
            actorUserId,
            actorType,
            fromStatus,
            toStatus,
          }),
        },
      })
    })
  }

  async forwardToUnit({
    manifestation,
    actorUserId,
    actorType,
    forwardedToUnitName,
    fromStatus,
    toStatus,
  }: ForwardToUnitParams): Promise<void> {
    const manifestationData = manifestationMapper.toPersistence(manifestation)

    await this.prisma.$transaction(async (tx) => {
      await tx.manifestation.update({
        where: { id: manifestationData.id },
        data: {
          status: manifestationData.status,
          attendantUserId: manifestationData.attendantUserId,
          forwardedToUnitId: manifestationData.forwardedToUnitId,
        },
      })

      await tx.manifestationMessage.create({
        data: {
          id: new UniqueEntityId().toString(),
          manifestationId: manifestationData.id,
          senderUserId: null,
          senderType: ManifestationMessageSenderType.SYSTEM,
          content: encodeSystemMessagePayload({
            type: 'forwarded_to_unit',
            description: `Manifestação encaminhada ao setor responsável: ${forwardedToUnitName}.`,
            actorUserId,
            actorType,
            fromStatus,
            toStatus,
          }),
        },
      })
    })
  }

  async cancel({
    manifestation,
    actorUserId,
    actorType,
    fromStatus,
    toStatus,
    reason,
    note,
  }: CancelParams): Promise<void> {
    const manifestationData = manifestationMapper.toPersistence(manifestation)
    const reasonLabel = CANCELLATION_REASON_LABELS[reason]
    const description =
      note === null
        ? `Manifestação cancelada pela ouvidoria. Motivo: ${reasonLabel}.`
        : `Manifestação cancelada pela ouvidoria. Motivo: ${reasonLabel}. Observação: ${note}`

    await this.prisma.$transaction(async (tx) => {
      await tx.manifestation.update({
        where: { id: manifestationData.id },
        data: { status: manifestationData.status, attendantUserId: manifestationData.attendantUserId },
      })

      await tx.manifestationMessage.create({
        data: {
          id: new UniqueEntityId().toString(),
          manifestationId: manifestationData.id,
          senderUserId: null,
          senderType: ManifestationMessageSenderType.SYSTEM,
          content: encodeSystemMessagePayload({
            type: 'canceled',
            description,
            actorUserId,
            actorType,
            fromStatus,
            toStatus,
            cancellationReason: reason,
            ...(note === null ? {} : { cancellationNote: note }),
          }),
        },
      })
    })
  }
}
