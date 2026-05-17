import { ManifestationEvaluation } from '#src/domain/entities/manifestation-evaluation.js'
import { UserRole } from '#src/domain/entities/user.js'
import { Rating } from '#src/domain/value-objects/rating.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

describe('ManifestationEvaluation', () => {
  const manifestationId = new UniqueEntityId('manifestation-1')
  const attendantUserId = new UniqueEntityId('ombudsman-1')
  const authorUserId = new UniqueEntityId('user-1')

  it('records an evaluation with the provided values and defaults createdAt', () => {
    const before = Date.now()
    const evaluation = ManifestationEvaluation.record({
      manifestationId,
      attendantUserId,
      attendantRoleSnapshot: UserRole.OMBUDSMAN,
      authorUserId,
      rating: Rating.create(5),
      comment: 'Excelente atendimento.',
    })
    const after = Date.now()

    expect(evaluation.manifestationId.toValue()).toBe('manifestation-1')
    expect(evaluation.attendantUserId.toValue()).toBe('ombudsman-1')
    expect(evaluation.attendantRoleSnapshot).toBe(UserRole.OMBUDSMAN)
    expect(evaluation.authorUserId.toValue()).toBe('user-1')
    expect(evaluation.rating.getValue()).toBe(5)
    expect(evaluation.comment).toBe('Excelente atendimento.')
    expect(evaluation.createdAt.getTime()).toBeGreaterThanOrEqual(before)
    expect(evaluation.createdAt.getTime()).toBeLessThanOrEqual(after)
  })

  it('normalizes empty or whitespace-only comments to null', () => {
    const evaluation = ManifestationEvaluation.record({
      manifestationId,
      attendantUserId,
      attendantRoleSnapshot: UserRole.OMBUDSMAN,
      authorUserId,
      rating: Rating.create(4),
      comment: '   ',
    })

    expect(evaluation.comment).toBeNull()
  })

  it('trims surrounding whitespace from comments', () => {
    const evaluation = ManifestationEvaluation.record({
      manifestationId,
      attendantUserId,
      attendantRoleSnapshot: UserRole.OMBUDSMAN,
      authorUserId,
      rating: Rating.create(3),
      comment: '  resolveu rapido  ',
    })

    expect(evaluation.comment).toBe('resolveu rapido')
  })

  it('accepts null comment explicitly', () => {
    const evaluation = ManifestationEvaluation.record({
      manifestationId,
      attendantUserId,
      attendantRoleSnapshot: UserRole.ADMIN,
      authorUserId,
      rating: Rating.create(2),
      comment: null,
    })

    expect(evaluation.comment).toBeNull()
    expect(evaluation.attendantRoleSnapshot).toBe(UserRole.ADMIN)
  })

  it('restores evaluations with their original timestamp and id', () => {
    const createdAt = new Date('2026-05-10T18:00:00.000Z')
    const evaluation = ManifestationEvaluation.restore(
      {
        manifestationId,
        attendantUserId,
        attendantRoleSnapshot: UserRole.OMBUDSMAN,
        authorUserId,
        rating: Rating.create(5),
        comment: null,
        createdAt,
      },
      new UniqueEntityId('evaluation-1'),
    )

    expect(evaluation.id.toValue()).toBe('evaluation-1')
    expect(evaluation.createdAt).toBe(createdAt)
  })
})
