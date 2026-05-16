import type {
  ManifestationMessage as PrismaManifestationMessage,
  ManifestationStatus as PrismaManifestationStatus,
  ManifestationType as PrismaManifestationType,
  Prisma,
  PrismaClient,
} from '@prisma/client'

import type {
  ManifestationDetailsDTO,
  ManifestationHistoryEntryDTO,
  ManifestationListItemDTO,
  ManifestationMessageDTO,
} from '#src/application/dto/manifestation-query-dtos.js'
import type { AdminManifestationFilters } from '#src/application/repositories/admin-manifestation-filters.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { PaginationParams } from '#src/application/repositories/pagination-params.js'
import { ManifestationMessageSenderType } from '#src/domain/entities/manifestation-message.js'
import { ManifestationStatus, type Manifestation, type ManifestationType } from '#src/domain/entities/manifestation.js'

import { manifestationMessageMapper } from '../mappers/manifestation-message.mapper.js'
import { manifestationMapper } from '../mappers/manifestation.mapper.js'
import { decodeSystemMessagePayload } from '../system-message-payload.js'

export const MANIFESTATIONS_PAGE_SIZE = 20

export class PrismaManifestationsRepository implements ManifestationsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(manifestationId: string): Promise<Manifestation | null> {
    const record = await this.prisma.manifestation.findUnique({ where: { id: manifestationId } })
    return record === null ? null : manifestationMapper.toDomain(record)
  }

  async findByProtocol(protocol: string): Promise<Manifestation | null> {
    const record = await this.prisma.manifestation.findUnique({ where: { protocol } })
    return record === null ? null : manifestationMapper.toDomain(record)
  }

  async findDetailsById(manifestationId: string): Promise<ManifestationDetailsDTO | null> {
    const record = await this.prisma.manifestation.findUnique({
      where: { id: manifestationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (record === null) {
      return null
    }

    return buildDetailsDTO(record, record.messages)
  }

  async findManyByAuthorUserId(
    authorUserId: string,
    pagination: PaginationParams,
  ): Promise<ManifestationListItemDTO[]> {
    const records = await this.prisma.manifestation.findMany({
      where: { authorUserId },
      orderBy: { createdAt: 'desc' },
      skip: (pagination.page - 1) * MANIFESTATIONS_PAGE_SIZE,
      take: MANIFESTATIONS_PAGE_SIZE,
    })

    return records.map(toListItemDTO)
  }

  async findManyForAdmin(
    filters: AdminManifestationFilters,
    pagination: PaginationParams,
  ): Promise<ManifestationListItemDTO[]> {
    const where: Prisma.ManifestationWhereInput = {}
    if (filters.status !== undefined) {
      where.status = filters.status as PrismaManifestationStatus
    }
    if (filters.type !== undefined) {
      where.type = filters.type as PrismaManifestationType
    }
    if (filters.campusId !== undefined) {
      where.campusId = filters.campusId
    }
    if (filters.administrativeUnitId !== undefined) {
      where.administrativeUnitId = filters.administrativeUnitId
    }
    if (filters.from !== undefined || filters.to !== undefined) {
      const createdAt: Prisma.DateTimeFilter = {}
      if (filters.from !== undefined) {
        createdAt.gte = filters.from
      }
      if (filters.to !== undefined) {
        createdAt.lte = filters.to
      }
      where.createdAt = createdAt
    }

    const records = await this.prisma.manifestation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pagination.page - 1) * MANIFESTATIONS_PAGE_SIZE,
      take: MANIFESTATIONS_PAGE_SIZE,
    })

    return records.map(toListItemDTO)
  }

  async save(manifestation: Manifestation): Promise<void> {
    const data = manifestationMapper.toPersistence(manifestation)
    await this.prisma.manifestation.upsert({
      where: { id: data.id },
      create: data,
      update: {
        status: data.status,
        description: data.description,
        involvedPeople: data.involvedPeople,
      },
    })
  }
}

function toListItemDTO(record: {
  id: string
  protocol: string
  type: PrismaManifestationType
  status: PrismaManifestationStatus
  campusId: string
  administrativeUnitId: string
  description: string
  authorUserId: string | null
  createdAt: Date
}): ManifestationListItemDTO {
  return {
    id: record.id,
    protocol: record.protocol,
    type: record.type as ManifestationType,
    status: record.status as ManifestationStatus,
    campusId: record.campusId,
    administrativeUnitId: record.administrativeUnitId,
    description: record.description,
    authorUserId: record.authorUserId,
    createdAt: record.createdAt,
  }
}

interface ManifestationRow {
  id: string
  protocol: string
  type: PrismaManifestationType
  status: PrismaManifestationStatus
  campusId: string
  administrativeUnitId: string
  description: string
  involvedPeople: string | null
  authorUserId: string | null
  createdAt: Date
}

function buildDetailsDTO(
  manifestation: ManifestationRow,
  messages: PrismaManifestationMessage[],
): ManifestationDetailsDTO {
  const history: ManifestationHistoryEntryDTO[] = [
    {
      type: 'registered',
      description: 'Manifestação registrada.',
      actorUserId: manifestation.authorUserId,
      actorType:
        manifestation.authorUserId === null
          ? ManifestationMessageSenderType.ANONYMOUS_MANIFESTANT
          : ManifestationMessageSenderType.MANIFESTANT,
      fromStatus: null,
      toStatus: ManifestationStatus.IN_ANALYSIS,
      createdAt: manifestation.createdAt,
    },
  ]

  const conversation: ManifestationMessageDTO[] = []

  for (const message of messages) {
    const senderType = message.senderType as ManifestationMessageSenderType

    if (senderType === ManifestationMessageSenderType.SYSTEM) {
      const payload = decodeSystemMessagePayload(message.content)
      if (payload !== null) {
        history.push({
          type: payload.type,
          description: payload.description,
          actorUserId: payload.actorUserId,
          actorType: payload.actorType,
          fromStatus: payload.fromStatus,
          toStatus: payload.toStatus,
          createdAt: message.createdAt,
        })
      }
      continue
    }

    if (
      senderType === ManifestationMessageSenderType.OMBUDSMAN ||
      senderType === ManifestationMessageSenderType.ADMIN
    ) {
      history.push({
        type: 'administrative_answered',
        description: 'Resposta administrativa registrada.',
        actorUserId: message.senderUserId,
        actorType: senderType,
        fromStatus: null,
        toStatus: null,
        createdAt: message.createdAt,
      })
    }

    conversation.push(manifestationMessageMapper.toDTO(message))
  }

  return {
    id: manifestation.id,
    protocol: manifestation.protocol,
    type: manifestation.type as ManifestationType,
    status: manifestation.status as ManifestationStatus,
    campusId: manifestation.campusId,
    administrativeUnitId: manifestation.administrativeUnitId,
    description: manifestation.description,
    involvedPeople: manifestation.involvedPeople,
    authorUserId: manifestation.authorUserId,
    createdAt: manifestation.createdAt,
    history,
    messages: conversation,
  }
}
