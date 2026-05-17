import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { ManifestationEvaluationsRepository } from '#src/application/repositories/manifestation-evaluations-repository.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { ManifestationAlreadyEvaluatedError } from '#src/application/use-cases/evaluate-manifestation/errors/manifestation-already-evaluated-error.js'
import { ManifestationHasNoAttendantError } from '#src/application/use-cases/evaluate-manifestation/errors/manifestation-has-no-attendant-error.js'
import { ManifestationNotFinalizedError } from '#src/application/use-cases/evaluate-manifestation/errors/manifestation-not-finalized-error.js'
import { EvaluateManifestationUseCase } from '#src/application/use-cases/evaluate-manifestation/evaluate-manifestation-use-case.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToAccessManifestationError } from '#src/application/use-cases/manifestation-access/errors/not-allowed-to-access-manifestation-error.js'
import { ManifestationEvaluation } from '#src/domain/entities/manifestation-evaluation.js'
import { Manifestation, ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import { User, UserRole } from '#src/domain/entities/user.js'
import { AdministrativeUnitId } from '#src/domain/value-objects/administrative-unit-id.js'
import { CampusId } from '#src/domain/value-objects/campus-id.js'
import { Email } from '#src/domain/value-objects/email.js'
import { ManifestationDescription } from '#src/domain/value-objects/manifestation-description.js'
import { Name } from '#src/domain/value-objects/name.js'
import { Protocol } from '#src/domain/value-objects/protocol.js'
import { InvalidRatingError, Rating } from '#src/domain/value-objects/rating.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

describe('EvaluateManifestationUseCase', () => {
  let manifestationsRepository: DeepMockProxy<ManifestationsRepository>
  let usersRepository: DeepMockProxy<UsersRepository>
  let manifestationEvaluationsRepository: DeepMockProxy<ManifestationEvaluationsRepository>
  let sut: EvaluateManifestationUseCase

  const buildAttendant = (role: UserRole = UserRole.OMBUDSMAN, id = 'ombudsman-1'): User =>
    User.create(
      {
        name: Name.create('Attendant User'),
        email: Email.create('attendant@example.com'),
        passwordHash: 'hashed-password',
        role,
        createdAt: new Date('2026-05-10T10:00:00.000Z'),
      },
      new UniqueEntityId(id),
    )

  const buildManifestation = ({
    status = ManifestationStatus.FINALIZED,
    authorUserId = 'user-1' as string | null,
    attendantUserId = 'ombudsman-1' as string | null,
  } = {}): Manifestation =>
    Manifestation.restore(
      {
        protocol: Protocol.create('2026-0001'),
        type: ManifestationType.COMPLAINT,
        status,
        campusId: CampusId.create('campus-1'),
        administrativeUnitId: AdministrativeUnitId.create('unit-1'),
        description: ManifestationDescription.create('The service was unavailable during the whole morning.'),
        involvedPeople: null,
        authorUserId: authorUserId === null ? null : new UniqueEntityId(authorUserId),
        attendantUserId: attendantUserId === null ? null : new UniqueEntityId(attendantUserId),
        accessCodeHash: authorUserId === null ? 'hashed-access-code' : null,
        createdAt: new Date('2026-05-10T12:00:00.000Z'),
      },
      new UniqueEntityId('manifestation-1'),
    )

  beforeEach(() => {
    manifestationsRepository = mockDeep<ManifestationsRepository>()
    usersRepository = mockDeep<UsersRepository>()
    manifestationEvaluationsRepository = mockDeep<ManifestationEvaluationsRepository>()

    mockReset(manifestationsRepository)
    mockReset(usersRepository)
    mockReset(manifestationEvaluationsRepository)

    sut = new EvaluateManifestationUseCase(
      manifestationsRepository,
      usersRepository,
      manifestationEvaluationsRepository,
    )
  })

  it('records an evaluation for a finalized manifestation owned by the author', async () => {
    manifestationsRepository.findById.mockResolvedValue(buildManifestation())
    manifestationEvaluationsRepository.findByManifestationId.mockResolvedValue(null)
    usersRepository.findById.mockResolvedValue(buildAttendant())

    const result = await sut.execute({
      userId: 'user-1',
      manifestationId: 'manifestation-1',
      rating: 5,
      comment: 'Excelente atendimento.',
    })

    expect(result.evaluation.manifestationId).toBe('manifestation-1')
    expect(result.evaluation.attendantUserId).toBe('ombudsman-1')
    expect(result.evaluation.attendantRoleSnapshot).toBe(UserRole.OMBUDSMAN)
    expect(result.evaluation.authorUserId).toBe('user-1')
    expect(result.evaluation.rating).toBe(5)
    expect(result.evaluation.comment).toBe('Excelente atendimento.')

    expect(manifestationEvaluationsRepository.save.mock.calls).toHaveLength(1)
    const [savedEvaluation, savedActorId] = manifestationEvaluationsRepository.save.mock.calls[0] as [
      ManifestationEvaluation,
      string,
    ]
    expect(savedEvaluation).toBeInstanceOf(ManifestationEvaluation)
    expect(savedEvaluation.rating.getValue()).toBe(5)
    expect(savedActorId).toBe('user-1')
  })

  it('takes the role snapshot when admin is the attendant', async () => {
    manifestationsRepository.findById.mockResolvedValue(buildManifestation({ attendantUserId: 'admin-1' }))
    manifestationEvaluationsRepository.findByManifestationId.mockResolvedValue(null)
    usersRepository.findById.mockResolvedValue(buildAttendant(UserRole.ADMIN, 'admin-1'))

    const result = await sut.execute({
      userId: 'user-1',
      manifestationId: 'manifestation-1',
      rating: 4,
    })

    expect(result.evaluation.attendantRoleSnapshot).toBe(UserRole.ADMIN)
    expect(result.evaluation.comment).toBeNull()
  })

  it('normalizes empty/whitespace comments to null', async () => {
    manifestationsRepository.findById.mockResolvedValue(buildManifestation())
    manifestationEvaluationsRepository.findByManifestationId.mockResolvedValue(null)
    usersRepository.findById.mockResolvedValue(buildAttendant())

    const result = await sut.execute({
      userId: 'user-1',
      manifestationId: 'manifestation-1',
      rating: 3,
      comment: '   ',
    })

    expect(result.evaluation.comment).toBeNull()
  })

  it('throws when the manifestation does not exist', async () => {
    manifestationsRepository.findById.mockResolvedValue(null)

    await expect(sut.execute({ userId: 'user-1', manifestationId: 'missing', rating: 5 })).rejects.toBeInstanceOf(
      ManifestationNotFoundError,
    )
  })

  it('throws when the requester is not the author', async () => {
    manifestationsRepository.findById.mockResolvedValue(buildManifestation({ authorUserId: 'user-2' }))

    await expect(
      sut.execute({ userId: 'user-1', manifestationId: 'manifestation-1', rating: 5 }),
    ).rejects.toBeInstanceOf(NotAllowedToAccessManifestationError)
  })

  it('throws when the manifestation is anonymous (no author bound to the request)', async () => {
    manifestationsRepository.findById.mockResolvedValue(buildManifestation({ authorUserId: null }))

    await expect(
      sut.execute({ userId: 'user-1', manifestationId: 'manifestation-1', rating: 5 }),
    ).rejects.toBeInstanceOf(NotAllowedToAccessManifestationError)
  })

  it.each([ManifestationStatus.IN_ANALYSIS, ManifestationStatus.ANSWERED, ManifestationStatus.CANCELED])(
    'throws ManifestationNotFinalizedError when status is %s',
    async (status) => {
      manifestationsRepository.findById.mockResolvedValue(buildManifestation({ status }))

      await expect(
        sut.execute({ userId: 'user-1', manifestationId: 'manifestation-1', rating: 5 }),
      ).rejects.toBeInstanceOf(ManifestationNotFinalizedError)

      expect(manifestationEvaluationsRepository.save.mock.calls).toHaveLength(0)
    },
  )

  it('throws ManifestationHasNoAttendantError when attendant_user_id is null', async () => {
    manifestationsRepository.findById.mockResolvedValue(buildManifestation({ attendantUserId: null }))

    await expect(
      sut.execute({ userId: 'user-1', manifestationId: 'manifestation-1', rating: 5 }),
    ).rejects.toBeInstanceOf(ManifestationHasNoAttendantError)
  })

  it('throws ManifestationAlreadyEvaluatedError when an evaluation already exists', async () => {
    manifestationsRepository.findById.mockResolvedValue(buildManifestation())
    manifestationEvaluationsRepository.findByManifestationId.mockResolvedValue(
      ManifestationEvaluation.restore(
        {
          manifestationId: new UniqueEntityId('manifestation-1'),
          attendantUserId: new UniqueEntityId('ombudsman-1'),
          attendantRoleSnapshot: UserRole.OMBUDSMAN,
          authorUserId: new UniqueEntityId('user-1'),
          rating: Rating.create(5),
          comment: null,
          createdAt: new Date('2026-05-10T18:00:00.000Z'),
        },
        new UniqueEntityId('evaluation-1'),
      ),
    )

    await expect(
      sut.execute({ userId: 'user-1', manifestationId: 'manifestation-1', rating: 4 }),
    ).rejects.toBeInstanceOf(ManifestationAlreadyEvaluatedError)

    expect(manifestationEvaluationsRepository.save.mock.calls).toHaveLength(0)
  })

  it('throws ManifestationHasNoAttendantError when the attendant user is missing in the user store', async () => {
    manifestationsRepository.findById.mockResolvedValue(buildManifestation())
    manifestationEvaluationsRepository.findByManifestationId.mockResolvedValue(null)
    usersRepository.findById.mockResolvedValue(null)

    await expect(
      sut.execute({ userId: 'user-1', manifestationId: 'manifestation-1', rating: 5 }),
    ).rejects.toBeInstanceOf(ManifestationHasNoAttendantError)

    expect(manifestationEvaluationsRepository.save.mock.calls).toHaveLength(0)
  })

  it('propagates InvalidRatingError when rating is out of bounds', async () => {
    manifestationsRepository.findById.mockResolvedValue(buildManifestation())
    manifestationEvaluationsRepository.findByManifestationId.mockResolvedValue(null)
    usersRepository.findById.mockResolvedValue(buildAttendant())

    await expect(
      sut.execute({ userId: 'user-1', manifestationId: 'manifestation-1', rating: 0 }),
    ).rejects.toBeInstanceOf(InvalidRatingError)
  })

  it('propagates repository save errors', async () => {
    manifestationsRepository.findById.mockResolvedValue(buildManifestation())
    manifestationEvaluationsRepository.findByManifestationId.mockResolvedValue(null)
    usersRepository.findById.mockResolvedValue(buildAttendant())
    manifestationEvaluationsRepository.save.mockRejectedValue(new Error('boom'))

    await expect(sut.execute({ userId: 'user-1', manifestationId: 'manifestation-1', rating: 5 })).rejects.toThrow(
      'boom',
    )
  })
})
