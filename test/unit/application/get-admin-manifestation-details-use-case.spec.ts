import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { ManifestationDetailsDTO } from '#src/application/dto/manifestation-query-dtos.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { GetAdminManifestationDetailsUseCase } from '#src/application/use-cases/get-admin-manifestation-details/get-admin-manifestation-details-use-case.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToManageManifestationError } from '#src/application/use-cases/manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import { ManifestationMessageSenderType } from '#src/domain/entities/manifestation-message.js'
import { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import { User, UserRole } from '#src/domain/entities/user.js'
import { Email } from '#src/domain/value-objects/email.js'
import { Name } from '#src/domain/value-objects/name.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

describe('GetAdminManifestationDetailsUseCase', () => {
  let manifestationsRepository: DeepMockProxy<ManifestationsRepository>
  let usersRepository: DeepMockProxy<UsersRepository>
  let sut: GetAdminManifestationDetailsUseCase

  const buildRequester = (role: UserRole, id = 'ombudsman-1'): User =>
    User.create(
      {
        name: Name.create('Ombudsman User'),
        email: Email.create('ombudsman@example.com'),
        passwordHash: 'hashed-password',
        role,
        createdAt: new Date('2026-05-10T10:00:00.000Z'),
      },
      new UniqueEntityId(id),
    )

  const buildManifestationDetails = (authorUserId: string | null): ManifestationDetailsDTO => ({
    id: 'manifestation-1',
    protocol: '2026-0001',
    type: ManifestationType.COMPLAINT,
    status: ManifestationStatus.IN_ANALYSIS,
    campusId: 'campus-1',
    administrativeUnitId: 'unit-1',
    description: 'The service was unavailable during the whole morning.',
    involvedPeople: 'Coordination Team',
    authorUserId,
    author:
      authorUserId === null
        ? null
        : {
            id: authorUserId,
            name: 'Diana Reis',
            email: 'diana@example.com',
          },
    attendantUserId: null,
    forwardedToUnit: null,
    createdAt: new Date('2026-05-10T12:00:00.000Z'),
    history: [
      {
        type: 'registered',
        description: 'Manifestation registered.',
        actorUserId: authorUserId,
        actorType:
          authorUserId === null
            ? ManifestationMessageSenderType.ANONYMOUS_MANIFESTANT
            : ManifestationMessageSenderType.MANIFESTANT,
        fromStatus: null,
        toStatus: ManifestationStatus.IN_ANALYSIS,
        rating: null,
        attendantUserId: null,
        createdAt: new Date('2026-05-10T12:00:00.000Z'),
      },
      {
        type: 'status_changed',
        description: 'Manifestation finalized by administrative staff.',
        actorUserId: 'ombudsman-1',
        actorType: ManifestationMessageSenderType.OMBUDSMAN,
        fromStatus: ManifestationStatus.ANSWERED,
        toStatus: ManifestationStatus.FINALIZED,
        rating: null,
        attendantUserId: null,
        createdAt: new Date('2026-05-10T16:00:00.000Z'),
      },
    ],
    messages: [
      {
        id: 'message-1',
        senderUserId: 'ombudsman-1',
        senderType: ManifestationMessageSenderType.OMBUDSMAN,
        content: 'We are analyzing your report.',
        createdAt: new Date('2026-05-10T15:00:00.000Z'),
      },
    ],
    attachments: [],
  })

  beforeEach(() => {
    manifestationsRepository = mockDeep<ManifestationsRepository>()
    usersRepository = mockDeep<UsersRepository>()

    mockReset(manifestationsRepository)
    mockReset(usersRepository)

    sut = new GetAdminManifestationDetailsUseCase(manifestationsRepository, usersRepository)
  })

  it('returns details for an identified manifestation when requested by an ombudsman', async () => {
    const details = buildManifestationDetails('user-1')

    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findDetailsById.mockResolvedValue(details)

    const result = await sut.execute({
      requesterUserId: 'ombudsman-1',
      manifestationId: 'manifestation-1',
    })

    expect(manifestationsRepository.findDetailsById.mock.calls).toStrictEqual([['manifestation-1']])
    expect(result).toStrictEqual({
      manifestation: {
        id: details.id,
        protocol: details.protocol,
        type: details.type,
        status: details.status,
        campusId: details.campusId,
        administrativeUnitId: details.administrativeUnitId,
        description: details.description,
        involvedPeople: details.involvedPeople,
        authorUserId: 'user-1',
        author: {
          id: 'user-1',
          name: 'Diana Reis',
          email: 'diana@example.com',
        },
        attendantUserId: null,
        forwardedToUnit: details.forwardedToUnit,
        createdAt: details.createdAt,
        history: details.history,
        messages: details.messages,
        attachments: details.attachments,
      },
    })
  })

  it('returns details for anonymous manifestations to administrators', async () => {
    const details = buildManifestationDetails(null)

    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.ADMIN, 'admin-1'))
    manifestationsRepository.findDetailsById.mockResolvedValue(details)

    const result = await sut.execute({
      requesterUserId: 'admin-1',
      manifestationId: 'manifestation-1',
    })

    expect(result.manifestation.authorUserId).toBeNull()
    expect(result.manifestation.author).toBeNull()
  })

  it('rejects requesters without administrative role', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.MANIFESTANT, 'user-1'))

    await expect(
      sut.execute({
        requesterUserId: 'user-1',
        manifestationId: 'manifestation-1',
      }),
    ).rejects.toBeInstanceOf(NotAllowedToManageManifestationError)

    expect(manifestationsRepository.findDetailsById.mock.calls).toHaveLength(0)
  })

  it('rejects requesters that no longer exist', async () => {
    usersRepository.findById.mockResolvedValue(null)

    await expect(
      sut.execute({
        requesterUserId: 'missing-user',
        manifestationId: 'manifestation-1',
      }),
    ).rejects.toBeInstanceOf(NotAllowedToManageManifestationError)

    expect(manifestationsRepository.findDetailsById.mock.calls).toHaveLength(0)
  })

  it('throws when the manifestation does not exist', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findDetailsById.mockResolvedValue(null)

    await expect(
      sut.execute({
        requesterUserId: 'ombudsman-1',
        manifestationId: 'missing-manifestation',
      }),
    ).rejects.toBeInstanceOf(ManifestationNotFoundError)
  })

  it('propagates repository failures', async () => {
    const repositoryError = new Error('repository failed')

    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findDetailsById.mockRejectedValue(repositoryError)

    await expect(
      sut.execute({
        requesterUserId: 'ombudsman-1',
        manifestationId: 'manifestation-1',
      }),
    ).rejects.toThrow(repositoryError)
  })
})
