import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { EmailSender } from '#src/application/email/email-sender.js'
import { ManifestationStatusEmailNotifier } from '#src/application/notifications/manifestation-status-notifier.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { Manifestation, ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import { User, UserRole } from '#src/domain/entities/user.js'
import { AdministrativeUnitId } from '#src/domain/value-objects/administrative-unit-id.js'
import { CampusId } from '#src/domain/value-objects/campus-id.js'
import { Email } from '#src/domain/value-objects/email.js'
import { ManifestationDescription } from '#src/domain/value-objects/manifestation-description.js'
import { Name } from '#src/domain/value-objects/name.js'
import { Protocol } from '#src/domain/value-objects/protocol.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

describe('ManifestationStatusEmailNotifier', () => {
  let usersRepository: DeepMockProxy<UsersRepository>
  let emailSender: DeepMockProxy<EmailSender>
  let sut: ManifestationStatusEmailNotifier
  let currentTime: number

  const buildManifestation = (
    authorUserId: UniqueEntityId | null = new UniqueEntityId('user-1'),
    status = ManifestationStatus.ANSWERED,
  ) =>
    Manifestation.restore(
      {
        protocol: Protocol.create('2026-0001'),
        type: ManifestationType.COMPLAINT,
        status,
        campusId: CampusId.create('campus-1'),
        administrativeUnitId: AdministrativeUnitId.create('unit-1'),
        description: ManifestationDescription.create('The service was unavailable during the whole morning.'),
        involvedPeople: null,
        authorUserId,
        attendantUserId: null,
        accessCodeHash: authorUserId === null ? 'hashed-access-code' : null,
        createdAt: new Date('2026-05-10T12:00:00.000Z'),
      },
      new UniqueEntityId('manifestation-1'),
    )

  beforeEach(() => {
    usersRepository = mockDeep<UsersRepository>()
    emailSender = mockDeep<EmailSender>()

    mockReset(usersRepository)
    mockReset(emailSender)

    currentTime = 1_000
    sut = new ManifestationStatusEmailNotifier(usersRepository, emailSender, () => currentTime)
  })

  it('sends a status change email to the manifestation author', async () => {
    usersRepository.findById.mockResolvedValue(
      User.create({
        name: Name.create('Manifestant User'),
        email: Email.create('manifestant@example.com'),
        passwordHash: 'hashed-password',
        role: UserRole.MANIFESTANT,
      }),
    )

    await sut.notify(buildManifestation())

    expect(usersRepository.findById.mock.calls).toStrictEqual([['user-1']])
    expect(emailSender.send.mock.calls).toStrictEqual([
      [
        {
          to: 'manifestant@example.com',
          subject: 'Manifestação 2026-0001 atualizada',
          text: 'A manifestação 2026-0001 foi respondida! Verifique o sistema.',
        },
      ],
    ])
  })

  it('does not send when the manifestation is anonymous', async () => {
    await sut.notify(buildManifestation(null))

    expect(usersRepository.findById.mock.calls).toHaveLength(0)
    expect(emailSender.send.mock.calls).toHaveLength(0)
  })

  it('limits answered emails for the same manifestation to one every five minutes', async () => {
    usersRepository.findById.mockResolvedValue(
      User.create({
        name: Name.create('Manifestant User'),
        email: Email.create('manifestant@example.com'),
        passwordHash: 'hashed-password',
        role: UserRole.MANIFESTANT,
      }),
    )
    const manifestation = buildManifestation()

    await sut.notify(manifestation)
    currentTime += 4 * 60 * 1000
    await sut.notify(manifestation)
    currentTime += 60 * 1000
    await sut.notify(manifestation)

    expect(emailSender.send.mock.calls).toHaveLength(2)
  })

  it('does not limit non-answered status emails', async () => {
    usersRepository.findById.mockResolvedValue(
      User.create({
        name: Name.create('Manifestant User'),
        email: Email.create('manifestant@example.com'),
        passwordHash: 'hashed-password',
        role: UserRole.MANIFESTANT,
      }),
    )

    await sut.notify(buildManifestation(new UniqueEntityId('user-1'), ManifestationStatus.AWAITING_UNIT))
    await sut.notify(buildManifestation(new UniqueEntityId('user-1'), ManifestationStatus.AWAITING_UNIT))

    expect(emailSender.send.mock.calls).toHaveLength(2)
  })
})
