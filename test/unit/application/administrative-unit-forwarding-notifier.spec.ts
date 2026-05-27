import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { EmailSender } from '#src/application/email/email-sender.js'
import { AdministrativeUnitForwardingEmailNotifier } from '#src/application/notifications/administrative-unit-forwarding-notifier.js'
import type { AdministrativeUnitResponsiblesRepository } from '#src/application/repositories/administrative-unit-responsibles-repository.js'
import { Manifestation, ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import { User, UserRole } from '#src/domain/entities/user.js'
import { AdministrativeUnitId } from '#src/domain/value-objects/administrative-unit-id.js'
import { CampusId } from '#src/domain/value-objects/campus-id.js'
import { Email } from '#src/domain/value-objects/email.js'
import { ManifestationDescription } from '#src/domain/value-objects/manifestation-description.js'
import { Name } from '#src/domain/value-objects/name.js'
import { Protocol } from '#src/domain/value-objects/protocol.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

describe('AdministrativeUnitForwardingEmailNotifier', () => {
  let administrativeUnitResponsiblesRepository: DeepMockProxy<AdministrativeUnitResponsiblesRepository>
  let emailSender: DeepMockProxy<EmailSender>
  let sut: AdministrativeUnitForwardingEmailNotifier

  const administrativeUnit = {
    id: 'unit-2',
    name: 'Coordenação de TI',
    description: null,
    campusId: 'campus-1',
    isActive: true,
  }

  const manifestation = Manifestation.restore(
    {
      protocol: Protocol.create('2026-0001'),
      type: ManifestationType.COMPLAINT,
      status: ManifestationStatus.AWAITING_UNIT,
      campusId: CampusId.create('campus-1'),
      administrativeUnitId: AdministrativeUnitId.create('unit-1'),
      description: ManifestationDescription.create('The service was unavailable during the whole morning.'),
      involvedPeople: null,
      authorUserId: new UniqueEntityId('user-1'),
      attendantUserId: null,
      forwardedToUnitId: AdministrativeUnitId.create('unit-2'),
      accessCodeHash: null,
      createdAt: new Date('2026-05-10T12:00:00.000Z'),
    },
    new UniqueEntityId('manifestation-1'),
  )

  const buildUser = (email: string, role: UserRole): User =>
    User.create({
      name: Name.create('Responsible User'),
      email: Email.create(email),
      passwordHash: 'hashed-password',
      role,
    })

  beforeEach(() => {
    administrativeUnitResponsiblesRepository = mockDeep<AdministrativeUnitResponsiblesRepository>()
    emailSender = mockDeep<EmailSender>()

    mockReset(administrativeUnitResponsiblesRepository)
    mockReset(emailSender)

    sut = new AdministrativeUnitForwardingEmailNotifier(administrativeUnitResponsiblesRepository, emailSender)
  })

  it('sends an email to each administrative responsible for the forwarded unit', async () => {
    administrativeUnitResponsiblesRepository.findUsersByAdministrativeUnitId.mockResolvedValue([
      buildUser('responsible-1@example.com', UserRole.OMBUDSMAN),
      buildUser('responsible-2@example.com', UserRole.ADMIN),
    ])

    await sut.notify(manifestation, administrativeUnit)

    expect(administrativeUnitResponsiblesRepository.findUsersByAdministrativeUnitId.mock.calls).toStrictEqual([
      ['unit-2'],
    ])
    expect(emailSender.send.mock.calls).toStrictEqual([
      [
        {
          to: 'responsible-1@example.com',
          subject: 'Manifestação 2026-0001 encaminhada',
          text: 'A manifestação 2026-0001 foi encaminhada para Coordenação de TI. Acesse o sistema para gerenciá-la.',
        },
      ],
      [
        {
          to: 'responsible-2@example.com',
          subject: 'Manifestação 2026-0001 encaminhada',
          text: 'A manifestação 2026-0001 foi encaminhada para Coordenação de TI. Acesse o sistema para gerenciá-la.',
        },
      ],
    ])
  })

  it('does not send emails to non-administrative responsible users', async () => {
    administrativeUnitResponsiblesRepository.findUsersByAdministrativeUnitId.mockResolvedValue([
      buildUser('manifestant@example.com', UserRole.MANIFESTANT),
    ])

    await sut.notify(manifestation, administrativeUnit)

    expect(emailSender.send.mock.calls).toHaveLength(0)
  })
})
