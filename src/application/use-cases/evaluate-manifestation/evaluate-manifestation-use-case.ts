import type { ManifestationEvaluationsRepository } from '#src/application/repositories/manifestation-evaluations-repository.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { ManifestationEvaluation } from '#src/domain/entities/manifestation-evaluation.js'
import { ManifestationStatus } from '#src/domain/entities/manifestation.js'
import type { UserRole } from '#src/domain/entities/user.js'
import { Rating } from '#src/domain/value-objects/rating.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

import type { UseCase } from '../use-case.js'
import { ManifestationAlreadyEvaluatedError } from './errors/manifestation-already-evaluated-error.js'
import { ManifestationHasNoAttendantError } from './errors/manifestation-has-no-attendant-error.js'
import { ManifestationNotFinalizedError } from './errors/manifestation-not-finalized-error.js'
import { ManifestationNotFoundError } from '../manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToAccessManifestationError } from '../manifestation-access/errors/not-allowed-to-access-manifestation-error.js'

interface EvaluateManifestationInput {
  userId: string
  manifestationId: string
  rating: number
  comment?: string | null
}

interface EvaluateManifestationOutput {
  evaluation: {
    id: string
    manifestationId: string
    attendantUserId: string
    attendantRoleSnapshot: UserRole
    authorUserId: string
    rating: number
    comment: string | null
    createdAt: Date
  }
}

export class EvaluateManifestationUseCase implements UseCase<EvaluateManifestationInput, EvaluateManifestationOutput> {
  constructor(
    private readonly manifestationsRepository: ManifestationsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly manifestationEvaluationsRepository: ManifestationEvaluationsRepository,
  ) {}

  async execute({
    userId,
    manifestationId,
    rating,
    comment,
  }: EvaluateManifestationInput): Promise<EvaluateManifestationOutput> {
    const requesterId = new UniqueEntityId(userId)
    const manifestation = await this.manifestationsRepository.findById(manifestationId)

    if (!manifestation) {
      throw new ManifestationNotFoundError()
    }

    if (!manifestation.belongsTo(requesterId)) {
      throw new NotAllowedToAccessManifestationError()
    }

    if (manifestation.status !== ManifestationStatus.FINALIZED) {
      throw new ManifestationNotFinalizedError()
    }

    const attendantUserId = manifestation.attendantUserId
    if (attendantUserId === null) {
      throw new ManifestationHasNoAttendantError()
    }

    const existing = await this.manifestationEvaluationsRepository.findByManifestationId(manifestationId)
    if (existing !== null) {
      throw new ManifestationAlreadyEvaluatedError()
    }

    const attendant = await this.usersRepository.findById(attendantUserId.toString())
    if (!attendant) {
      throw new ManifestationHasNoAttendantError()
    }

    const ratingVO = Rating.create(rating)

    const evaluation = ManifestationEvaluation.record({
      manifestationId: manifestation.id,
      attendantUserId,
      attendantRoleSnapshot: attendant.role,
      authorUserId: requesterId,
      rating: ratingVO,
      comment: comment ?? null,
    })

    await this.manifestationEvaluationsRepository.save(evaluation, userId)

    return {
      evaluation: {
        id: evaluation.id.toString(),
        manifestationId: evaluation.manifestationId.toString(),
        attendantUserId: evaluation.attendantUserId.toString(),
        attendantRoleSnapshot: evaluation.attendantRoleSnapshot,
        authorUserId: evaluation.authorUserId.toString(),
        rating: evaluation.rating.getValue(),
        comment: evaluation.comment,
        createdAt: evaluation.createdAt,
      },
    }
  }
}
