import type {
  ManifestationAttachment as PrismaManifestationAttachment,
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
import type {
  ManifestationMetrics,
  ManifestationsPage,
  ManifestationsRepository,
} from '#src/application/repositories/manifestations-repository.js'
import { MANIFESTATIONS_PAGE_SIZE, type PaginationParams } from '#src/application/repositories/pagination-params.js'
import { ManifestationMessageSenderType } from '#src/domain/entities/manifestation-message.js'
import { ManifestationStatus, type Manifestation, type ManifestationType } from '#src/domain/entities/manifestation.js'

import { manifestationAttachmentMapper } from '../mappers/manifestation-attachment.mapper.js'
import { manifestationMessageMapper } from '../mappers/manifestation-message.mapper.js'
import { manifestationMapper } from '../mappers/manifestation.mapper.js'
import { decodeSystemMessagePayload } from '../system-message-payload.js'

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
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        forwardedToUnit: true,
        attachments: {
          orderBy: { createdAt: 'asc' },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (record === null) {
      return null
    }

    return buildDetailsDTO(record, record.messages, record.attachments)
  }

  async findManyByAuthorUserId(authorUserId: string, pagination: PaginationParams): Promise<ManifestationsPage> {
    const where: Prisma.ManifestationWhereInput = { authorUserId }
    const [records, totalItems, statusCounts] = await this.prisma.$transaction([
      this.prisma.manifestation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * MANIFESTATIONS_PAGE_SIZE,
        take: MANIFESTATIONS_PAGE_SIZE,
      }),
      this.prisma.manifestation.count({ where }),
      this.prisma.manifestation.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
    ])

    return { manifestations: records.map(toListItemDTO), statusTotals: buildStatusTotals(statusCounts), totalItems }
  }

  async findManyForAdmin(
    filters: AdminManifestationFilters,
    pagination: PaginationParams,
  ): Promise<ManifestationsPage> {
    const where = buildAdminManifestationWhere(filters)

    const [records, totalItems, statusCounts] = await this.prisma.$transaction([
      this.prisma.manifestation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * MANIFESTATIONS_PAGE_SIZE,
        take: MANIFESTATIONS_PAGE_SIZE,
      }),
      this.prisma.manifestation.count({ where }),
      this.prisma.manifestation.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
    ])

    return { manifestations: records.map(toListItemDTO), statusTotals: buildStatusTotals(statusCounts), totalItems }
  }

  async getMetricsByAuthorUserId(authorUserId: string): Promise<ManifestationMetrics> {
    const where: Prisma.ManifestationWhereInput = { authorUserId }
    return this.getMetrics(where)
  }

  async getMetricsForAdmin(filters: AdminManifestationFilters): Promise<ManifestationMetrics> {
    return this.getMetrics(buildAdminManifestationWhere(filters))
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
        attendantUserId: data.attendantUserId,
      },
    })
  }

  private async getMetrics(where: Prisma.ManifestationWhereInput): Promise<ManifestationMetrics> {
    const [totalItems, statusCounts] = await this.prisma.$transaction([
      this.prisma.manifestation.count({ where }),
      this.prisma.manifestation.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
    ])

    return { statusTotals: buildStatusTotals(statusCounts), totalItems }
  }
}

function buildStatusTotals(
  statusCounts: Array<{ status: PrismaManifestationStatus; _count: { _all: number } }>,
): Record<ManifestationStatus, number> {
  const totals: Record<ManifestationStatus, number> = {
    [ManifestationStatus.ANSWERED]: 0,
    [ManifestationStatus.AWAITING_UNIT]: 0,
    [ManifestationStatus.CANCELED]: 0,
    [ManifestationStatus.FINALIZED]: 0,
    [ManifestationStatus.IN_ANALYSIS]: 0,
  }

  for (const count of statusCounts) {
    totals[count.status as ManifestationStatus] = count._count._all
  }

  return totals
}

function buildAdminManifestationWhere(filters: AdminManifestationFilters): Prisma.ManifestationWhereInput {
  const where: Prisma.ManifestationWhereInput = {}

  if (filters.status !== undefined) {
    where.status = filters.status
  }

  if (filters.type !== undefined) {
    where.type = filters.type
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

  return where
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
  author: { id: string; name: string; email: string } | null
  attendantUserId: string | null
  forwardedToUnit: { id: string; name: string } | null
  createdAt: Date
}

function buildDetailsDTO(
  manifestation: ManifestationRow,
  messages: PrismaManifestationMessage[],
  attachments: PrismaManifestationAttachment[],
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
      rating: null,
      attendantUserId: null,
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
          rating: payload.rating ?? null,
          attendantUserId: payload.attendantUserId ?? null,
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
        rating: null,
        attendantUserId: null,
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
    author:
      manifestation.author === null
        ? null
        : { id: manifestation.author.id, name: manifestation.author.name, email: manifestation.author.email },
    attendantUserId: manifestation.attendantUserId,
    forwardedToUnit:
      manifestation.forwardedToUnit === null
        ? null
        : { id: manifestation.forwardedToUnit.id, name: manifestation.forwardedToUnit.name },
    createdAt: manifestation.createdAt,
    history,
    messages: conversation,
    attachments: attachments.map((attachment) => manifestationAttachmentMapper.toDTO(attachment)),
  }
}
