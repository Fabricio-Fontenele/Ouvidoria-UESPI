import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { ManifestationMessageDTO } from '#src/application/dto/manifestation-query-dtos.js'
import type { ManifestationAdministrationRepository } from '#src/application/repositories/manifestation-administration-repository.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { AnswerManifestationUseCase } from '#src/application/use-cases/answer-manifestation/answer-manifestation-use-case.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToManageManifestationError } from '#src/application/use-cases/manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import { ManifestationMessage, ManifestationMessageSenderType } from '#src/domain/entities/manifestation-message.js'
import {
  Manifestation,
  ManifestationStatus,
  ManifestationStatusTransitionNotAllowedError,
  ManifestationType,
} from '#src/domain/entities/manifestation.js'
import { User, UserRole } from '#src/domain/entities/user.js'
import { AdministrativeUnitId } from '#src/domain/value-objects/administrative-unit-id.js'
import { CampusId } from '#src/domain/value-objects/campus-id.js'
import { Email } from '#src/domain/value-objects/email.js'
import { ManifestationDescription } from '#src/domain/value-objects/manifestation-description.js'
import { InvalidManifestationMessageContentError } from '#src/domain/value-objects/manifestation-message-content.js'
import { Name } from '#src/domain/value-objects/name.js'
import { Protocol } from '#src/domain/value-objects/protocol.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

describe('AnswerManifestationUseCase', () => {
  let manifestationsRepository: DeepMockProxy<ManifestationsRepository>
  let manifestationAdministrationRepository: DeepMockProxy<ManifestationAdministrationRepository>
  let usersRepository: DeepMockProxy<UsersRepository>
  let sut: AnswerManifestationUseCase

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

  const buildManifestation = (status: ManifestationStatus, authorUserId: string | null = 'user-1'): Manifestation =>
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
        attendantUserId: null,
        accessCodeHash: authorUserId === null ? 'hashed-access-code' : null,
        createdAt: new Date('2026-05-10T12:00:00.000Z'),
      },
      new UniqueEntityId('manifestation-1'),
    )

  const buildMessage = (): ManifestationMessageDTO => ({
    id: 'message-1',
    senderUserId: 'ombudsman-1',
    senderType: ManifestationMessageSenderType.OMBUDSMAN,
    content: 'We finished analyzing your report.',
    createdAt: new Date('2026-05-10T16:00:00.000Z'),
  })

  beforeEach(() => {
    manifestationsRepository = mockDeep<ManifestationsRepository>()
    manifestationAdministrationRepository = mockDeep<ManifestationAdministrationRepository>()
    usersRepository = mockDeep<UsersRepository>()

    mockReset(manifestationsRepository)
    mockReset(manifestationAdministrationRepository)
    mockReset(usersRepository)

    sut = new AnswerManifestationUseCase(
      manifestationsRepository,
      manifestationAdministrationRepository,
      usersRepository,
    )
  })

  it('records the administrative answer, persists the new status and stores the message', async () => {
    const manifestation = buildManifestation(ManifestationStatus.IN_ANALYSIS)
    const message = buildMessage()

    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findById.mockResolvedValue(manifestation)
    manifestationAdministrationRepository.recordAnswer.mockResolvedValue(message)

    const result = await sut.execute({
      requesterUserId: 'ombudsman-1',
      manifestationId: 'manifestation-1',
      content: '  We finished analyzing your report.  ',
    })

    expect(manifestation.status).toBe(ManifestationStatus.ANSWERED)
    expect(manifestationsRepository.save.mock.calls).toHaveLength(0)

    const recordAnswerCall = manifestationAdministrationRepository.recordAnswer.mock.calls[0] as
      | [
          {
            manifestation: Manifestation
            message: ManifestationMessage
            fromStatus: ManifestationStatus
            toStatus: ManifestationStatus
          },
        ]
      | undefined
    const answeredManifestation = recordAnswerCall?.[0].manifestation
    const savedMessage = recordAnswerCall?.[0].message

    expect(answeredManifestation).toBe(manifestation)
    expect(savedMessage).toBeInstanceOf(ManifestationMessage)
    expect(recordAnswerCall?.[0].fromStatus).toBe(ManifestationStatus.IN_ANALYSIS)
    expect(recordAnswerCall?.[0].toStatus).toBe(ManifestationStatus.ANSWERED)
    expect(savedMessage?.manifestationId.toValue()).toBe('manifestation-1')
    expect(savedMessage?.senderUserId?.toValue()).toBe('ombudsman-1')
    expect(savedMessage?.senderType).toBe(ManifestationMessageSenderType.OMBUDSMAN)
    expect(savedMessage?.content.getValue()).toBe('We finished analyzing your report.')
    expect(result).toStrictEqual({ message })
  })

  it('answers anonymous manifestations as well', async () => {
    const manifestation = buildManifestation(ManifestationStatus.IN_ANALYSIS, null)
    const message = {
      ...buildMessage(),
      senderUserId: 'admin-1',
      senderType: ManifestationMessageSenderType.ADMIN,
    }

    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.ADMIN, 'admin-1'))
    manifestationsRepository.findById.mockResolvedValue(manifestation)
    manifestationAdministrationRepository.recordAnswer.mockResolvedValue(message)

    const result = await sut.execute({
      requesterUserId: 'admin-1',
      manifestationId: 'manifestation-1',
      content: 'We finished analyzing your report.',
    })

    const recordAnswerCall = manifestationAdministrationRepository.recordAnswer.mock.calls[0] as
      | [
          {
            manifestation: Manifestation
            message: ManifestationMessage
            fromStatus: ManifestationStatus
            toStatus: ManifestationStatus
          },
        ]
      | undefined
    const savedMessage = recordAnswerCall?.[0].message

    expect(manifestation.status).toBe(ManifestationStatus.ANSWERED)
    expect(manifestationsRepository.save.mock.calls).toHaveLength(0)
    expect(savedMessage?.senderUserId?.toValue()).toBe('admin-1')
    expect(savedMessage?.senderType).toBe(ManifestationMessageSenderType.ADMIN)
    expect(result).toStrictEqual({ message })
  })

  it('rejects invalid content before touching dependencies', async () => {
    await expect(
      sut.execute({
        requesterUserId: 'ombudsman-1',
        manifestationId: 'manifestation-1',
        content: '   ',
      }),
    ).rejects.toBeInstanceOf(InvalidManifestationMessageContentError)

    expect(usersRepository.findById.mock.calls).toHaveLength(0)
    expect(manifestationsRepository.findById.mock.calls).toHaveLength(0)
    expect(manifestationAdministrationRepository.recordAnswer.mock.calls).toHaveLength(0)
  })

  it('rejects requesters without administrative role', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.MANIFESTANT, 'user-1'))

    await expect(
      sut.execute({
        requesterUserId: 'user-1',
        manifestationId: 'manifestation-1',
        content: 'We finished analyzing your report.',
      }),
    ).rejects.toBeInstanceOf(NotAllowedToManageManifestationError)

    expect(manifestationsRepository.findById.mock.calls).toHaveLength(0)
  })

  it('throws when the manifestation does not exist', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findById.mockResolvedValue(null)

    await expect(
      sut.execute({
        requesterUserId: 'ombudsman-1',
        manifestationId: 'missing-manifestation',
        content: 'We finished analyzing your report.',
      }),
    ).rejects.toBeInstanceOf(ManifestationNotFoundError)

    expect(manifestationsRepository.save.mock.calls).toHaveLength(0)
    expect(manifestationAdministrationRepository.recordAnswer.mock.calls).toHaveLength(0)
  })

  it('throws when the manifestation is closed for interaction and does not persist', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findById.mockResolvedValue(buildManifestation(ManifestationStatus.FINALIZED))

    await expect(
      sut.execute({
        requesterUserId: 'ombudsman-1',
        manifestationId: 'manifestation-1',
        content: 'We finished analyzing your report.',
      }),
    ).rejects.toBeInstanceOf(ManifestationStatusTransitionNotAllowedError)

    expect(manifestationsRepository.save.mock.calls).toHaveLength(0)
    expect(manifestationAdministrationRepository.recordAnswer.mock.calls).toHaveLength(0)
  })

  it('assigns the first ombudsman responder as the attendant', async () => {
    const manifestation = buildManifestation(ManifestationStatus.IN_ANALYSIS)
    const message = buildMessage()

    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findById.mockResolvedValue(manifestation)
    manifestationAdministrationRepository.recordAnswer.mockResolvedValue(message)

    await sut.execute({
      requesterUserId: 'ombudsman-1',
      manifestationId: 'manifestation-1',
      content: 'We finished analyzing your report.',
    })

    expect(manifestation.attendantUserId?.toValue()).toBe('ombudsman-1')
  })

  it('assigns admin as attendant when admin is the first administrative responder', async () => {
    const manifestation = buildManifestation(ManifestationStatus.IN_ANALYSIS)
    const message = buildMessage()

    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.ADMIN, 'admin-1'))
    manifestationsRepository.findById.mockResolvedValue(manifestation)
    manifestationAdministrationRepository.recordAnswer.mockResolvedValue(message)

    await sut.execute({
      requesterUserId: 'admin-1',
      manifestationId: 'manifestation-1',
      content: 'We finished analyzing your report.',
    })

    expect(manifestation.attendantUserId?.toValue()).toBe('admin-1')
  })

  it('does not override the attendant once a previous administrative responder is set', async () => {
    const manifestation = buildManifestation(ManifestationStatus.ANSWERED)
    manifestation.assignAttendant(new UniqueEntityId('ombudsman-1'), UserRole.OMBUDSMAN)

    const message = buildMessage()

    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN, 'ombudsman-2'))
    manifestationsRepository.findById.mockResolvedValue(manifestation)
    manifestationAdministrationRepository.recordAnswer.mockResolvedValue(message)

    await sut.execute({
      requesterUserId: 'ombudsman-2',
      manifestationId: 'manifestation-1',
      content: 'Following up on your report.',
    })

    expect(manifestation.attendantUserId?.toValue()).toBe('ombudsman-1')
  })

  it('does not mutate the aggregate when status transition fails', async () => {
    const manifestation = buildManifestation(ManifestationStatus.FINALIZED)

    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findById.mockResolvedValue(manifestation)

    await expect(
      sut.execute({
        requesterUserId: 'ombudsman-1',
        manifestationId: 'manifestation-1',
        content: 'We finished analyzing your report.',
      }),
    ).rejects.toBeInstanceOf(ManifestationStatusTransitionNotAllowedError)

    expect(manifestation.attendantUserId).toBeNull()
  })

  it('propagates atomic persistence failures without falling back to split saves', async () => {
    const saveError = new Error('save failed')

    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findById.mockResolvedValue(buildManifestation(ManifestationStatus.IN_ANALYSIS))
    manifestationAdministrationRepository.recordAnswer.mockRejectedValue(saveError)

    await expect(
      sut.execute({
        requesterUserId: 'ombudsman-1',
        manifestationId: 'manifestation-1',
        content: 'We finished analyzing your report.',
      }),
    ).rejects.toThrow(saveError)

    expect(manifestationsRepository.save.mock.calls).toHaveLength(0)
    expect(manifestationAdministrationRepository.recordAnswer.mock.calls).toHaveLength(1)
  })
})
