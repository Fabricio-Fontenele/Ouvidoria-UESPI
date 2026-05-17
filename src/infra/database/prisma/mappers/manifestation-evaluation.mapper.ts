import type {
  ManifestationEvaluation as PrismaManifestationEvaluation,
  UserRole as PrismaUserRole,
} from '@prisma/client'

import { ManifestationEvaluation } from '#src/domain/entities/manifestation-evaluation.js'
import type { UserRole } from '#src/domain/entities/user.js'
import { Rating } from '#src/domain/value-objects/rating.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

export const manifestationEvaluationMapper = {
  toDomain(raw: PrismaManifestationEvaluation): ManifestationEvaluation {
    return ManifestationEvaluation.restore(
      {
        manifestationId: new UniqueEntityId(raw.manifestationId),
        attendantUserId: new UniqueEntityId(raw.attendantUserId),
        attendantRoleSnapshot: raw.attendantRoleSnapshot as UserRole,
        authorUserId: new UniqueEntityId(raw.authorUserId),
        rating: Rating.create(raw.rating),
        comment: raw.comment,
        createdAt: raw.createdAt,
      },
      new UniqueEntityId(raw.id),
    )
  },

  toPersistence(evaluation: ManifestationEvaluation): {
    id: string
    manifestationId: string
    attendantUserId: string
    attendantRoleSnapshot: PrismaUserRole
    authorUserId: string
    rating: number
    comment: string | null
    createdAt: Date
  } {
    return {
      id: evaluation.id.toString(),
      manifestationId: evaluation.manifestationId.toString(),
      attendantUserId: evaluation.attendantUserId.toString(),
      attendantRoleSnapshot: evaluation.attendantRoleSnapshot,
      authorUserId: evaluation.authorUserId.toString(),
      rating: evaluation.rating.getValue(),
      comment: evaluation.comment,
      createdAt: evaluation.createdAt,
    }
  },
}
