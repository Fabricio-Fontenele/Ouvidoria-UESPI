import { Prisma, type PrismaClient } from '@prisma/client'

import type { ManifestationEvaluationsRepository } from '#src/application/repositories/manifestation-evaluations-repository.js'
import { ManifestationAlreadyEvaluatedError } from '#src/application/use-cases/evaluate-manifestation/errors/manifestation-already-evaluated-error.js'
import type { ManifestationEvaluation } from '#src/domain/entities/manifestation-evaluation.js'
import { ManifestationMessageSenderType } from '#src/domain/entities/manifestation-message.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

import { manifestationEvaluationMapper } from '../mappers/manifestation-evaluation.mapper.js'
import { encodeSystemMessagePayload } from '../system-message-payload.js'

const EVALUATION_UNIQUE_CONSTRAINT = 'manifestation_evaluations_manifestation_id_key'

export class PrismaManifestationEvaluationsRepository implements ManifestationEvaluationsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByManifestationId(manifestationId: string): Promise<ManifestationEvaluation | null> {
    const record = await this.prisma.manifestationEvaluation.findUnique({ where: { manifestationId } })
    return record === null ? null : manifestationEvaluationMapper.toDomain(record)
  }

  async save(evaluation: ManifestationEvaluation, actorUserId: string): Promise<void> {
    const data = manifestationEvaluationMapper.toPersistence(evaluation)

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.manifestationEvaluation.create({ data })

        await tx.manifestationMessage.create({
          data: {
            id: new UniqueEntityId().toString(),
            manifestationId: data.manifestationId,
            senderUserId: null,
            senderType: ManifestationMessageSenderType.SYSTEM,
            content: encodeSystemMessagePayload({
              type: 'evaluation_recorded',
              description: `Atendimento avaliado pelo autor (${String(data.rating)}/5).`,
              actorUserId,
              actorType: ManifestationMessageSenderType.MANIFESTANT,
              fromStatus: null,
              toStatus: null,
              rating: data.rating,
              attendantUserId: data.attendantUserId,
            }),
          },
        })
      })
    } catch (error) {
      if (isEvaluationUniqueViolation(error)) {
        throw new ManifestationAlreadyEvaluatedError()
      }
      throw error
    }
  }
}

function isEvaluationUniqueViolation(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false
  }

  const target = error.meta?.['target']
  if (typeof target === 'string') {
    return target === EVALUATION_UNIQUE_CONSTRAINT || target.includes('manifestation_id')
  }
  if (Array.isArray(target)) {
    return target.includes('manifestationId') || target.includes('manifestation_id')
  }
  return true
}
