import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { ManifestationMessageDTO } from '#src/application/dto/manifestation-query-dtos.js'
import type { ManifestationInteractionsRepository } from '#src/application/repositories/manifestation-interactions-repository.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { AnswerManifestationUseCase } from '#src/application/use-cases/answer-manifestation/answer-manifestation-use-case.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToManageManifestationError } from '#src/application/use-cases/manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import { ManifestationMessage } from '#src/domain/entities/manifestation-message.js'
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
  let manifestationInteractionsRepository: DeepMockProxy<ManifestationInteractionsRepository>
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
        accessCodeHash: authorUserId === null ? 'hashed-access-code' : null,
        createdAt: new Date('2026-05-10T12:00:00.000Z'),
      },
      new UniqueEntityId('manifestation-1'),
    )

  const buildMessage = (): ManifestationMessageDTO => ({
    id: 'message-1',
    senderUserId: 'ombudsman-1',
    content: 'We finished analyzing your report.',
    createdAt: new Date('2026-05-10T16:00:00.000Z'),
  })

  beforeEach(() => {
    manifestationsRepository = mockDeep<ManifestationsRepository>()
    manifestationInteractionsRepository = mockDeep<ManifestationInteractionsRepository>()
    usersRepository = mockDeep<UsersRepository>()

    mockReset(manifestationsRepository)
    mockReset(manifestationInteractionsRepository)
    mockReset(usersRepository)

    sut = new AnswerManifestationUseCase(manifestationsRepository, manifestationInteractionsRepository, usersRepository)
  })

  it('records the administrative answer, persists the new status and stores the message', async () => {
    const manifestation = buildManifestation(ManifestationStatus.IN_ANALYSIS)
    const message = buildMessage()

    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findById.mockResolvedValue(manifestation)
    manifestationInteractionsRepository.addMessage.mockResolvedValue(message)

    const result = await sut.execute({
      requesterUserId: 'ombudsman-1',
      manifestationId: 'manifestation-1',
      content: '  We finished analyzing your report.  ',
    })

    expect(manifestation.status).toBe(ManifestationStatus.ANSWERED)
    expect(manifestationsRepository.save.mock.calls).toStrictEqual([[manifestation]])

    const addMessageCall = manifestationInteractionsRepository.addMessage.mock.calls[0] as
      | [ManifestationMessage]
      | undefined
    const savedMessage = addMessageCall?.[0]

    expect(savedMessage).toBeInstanceOf(ManifestationMessage)
    expect(savedMessage?.manifestationId.toValue()).toBe('manifestation-1')
    expect(savedMessage?.senderUserId.toValue()).toBe('ombudsman-1')
    expect(savedMessage?.content.getValue()).toBe('We finished analyzing your report.')
    expect(result).toStrictEqual({ message })
  })

  it('answers anonymous manifestations as well', async () => {
    const manifestation = buildManifestation(ManifestationStatus.IN_ANALYSIS, null)

    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.ADMIN, 'admin-1'))
    manifestationsRepository.findById.mockResolvedValue(manifestation)
    manifestationInteractionsRepository.addMessage.mockResolvedValue(buildMessage())

    await sut.execute({
      requesterUserId: 'admin-1',
      manifestationId: 'manifestation-1',
      content: 'We finished analyzing your report.',
    })

    expect(manifestation.status).toBe(ManifestationStatus.ANSWERED)
    expect(manifestationsRepository.save.mock.calls).toHaveLength(1)
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
    expect(manifestationInteractionsRepository.addMessage.mock.calls).toHaveLength(0)
  })

  it('rejects requesters without administrative role', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.PROTESTER, 'user-1'))

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
    expect(manifestationInteractionsRepository.addMessage.mock.calls).toHaveLength(0)
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
    expect(manifestationInteractionsRepository.addMessage.mock.calls).toHaveLength(0)
  })

  it('propagates save failures and skips the message persistence', async () => {
    const saveError = new Error('save failed')

    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findById.mockResolvedValue(buildManifestation(ManifestationStatus.IN_ANALYSIS))
    manifestationsRepository.save.mockRejectedValue(saveError)

    await expect(
      sut.execute({
        requesterUserId: 'ombudsman-1',
        manifestationId: 'manifestation-1',
        content: 'We finished analyzing your report.',
      }),
    ).rejects.toThrow(saveError)

    expect(manifestationInteractionsRepository.addMessage.mock.calls).toHaveLength(0)
  })
})
