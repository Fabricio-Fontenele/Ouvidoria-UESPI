import { Entity } from './entity.js'
import type { UserRole } from './user.js'
import type { Rating } from '../value-objects/rating.js'
import type { UniqueEntityId } from '../value-objects/unique-entity-id.js'

interface ManifestationEvaluationProps {
  manifestationId: UniqueEntityId
  attendantUserId: UniqueEntityId
  attendantRoleSnapshot: UserRole
  authorUserId: UniqueEntityId
  rating: Rating
  comment: string | null
  createdAt: Date
}

interface RecordManifestationEvaluationProps {
  manifestationId: UniqueEntityId
  attendantUserId: UniqueEntityId
  attendantRoleSnapshot: UserRole
  authorUserId: UniqueEntityId
  rating: Rating
  comment?: string | null
  createdAt?: Date
}

export class ManifestationEvaluation extends Entity<ManifestationEvaluationProps> {
  static record(props: RecordManifestationEvaluationProps, id?: UniqueEntityId): ManifestationEvaluation {
    const normalizedComment = normalizeComment(props.comment ?? null)
    const createdAt = props.createdAt ?? new Date()

    return new ManifestationEvaluation(
      {
        manifestationId: props.manifestationId,
        attendantUserId: props.attendantUserId,
        attendantRoleSnapshot: props.attendantRoleSnapshot,
        authorUserId: props.authorUserId,
        rating: props.rating,
        comment: normalizedComment,
        createdAt,
      },
      id,
    )
  }

  static restore(props: ManifestationEvaluationProps, id: UniqueEntityId): ManifestationEvaluation {
    return new ManifestationEvaluation(props, id)
  }

  get manifestationId(): UniqueEntityId {
    return this.props.manifestationId
  }

  get attendantUserId(): UniqueEntityId {
    return this.props.attendantUserId
  }

  get attendantRoleSnapshot(): UserRole {
    return this.props.attendantRoleSnapshot
  }

  get authorUserId(): UniqueEntityId {
    return this.props.authorUserId
  }

  get rating(): Rating {
    return this.props.rating
  }

  get comment(): string | null {
    return this.props.comment
  }

  get createdAt(): Date {
    return this.props.createdAt
  }
}

function normalizeComment(comment: string | null): string | null {
  if (comment === null) {
    return null
  }

  const trimmed = comment.trim()
  return trimmed.length === 0 ? null : trimmed
}
