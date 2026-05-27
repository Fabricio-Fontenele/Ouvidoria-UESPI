import type { CatalogAdministrativeUnitRecordDTO } from '#src/application/dto/catalog-dtos.js'
import type { EmailSender } from '#src/application/email/email-sender.js'
import type { AdministrativeUnitResponsiblesRepository } from '#src/application/repositories/administrative-unit-responsibles-repository.js'
import type { Manifestation } from '#src/domain/entities/manifestation.js'
import { UserRole } from '#src/domain/entities/user.js'

export interface AdministrativeUnitForwardingNotifier {
  notify(manifestation: Manifestation, administrativeUnit: CatalogAdministrativeUnitRecordDTO): Promise<void>
}

export class AdministrativeUnitForwardingEmailNotifier implements AdministrativeUnitForwardingNotifier {
  constructor(
    private readonly administrativeUnitResponsiblesRepository: AdministrativeUnitResponsiblesRepository,
    private readonly emailSender: EmailSender,
  ) {}

  async notify(manifestation: Manifestation, administrativeUnit: CatalogAdministrativeUnitRecordDTO): Promise<void> {
    const responsibles = await this.administrativeUnitResponsiblesRepository.findUsersByAdministrativeUnitId(
      administrativeUnit.id,
    )
    const recipients = responsibles.filter(
      (responsible) => responsible.role === UserRole.OMBUDSMAN || responsible.role === UserRole.ADMIN,
    )

    await Promise.all(
      recipients.map((responsible) =>
        this.emailSender.send({
          to: responsible.email.getValue(),
          subject: `Manifestação ${manifestation.protocol.getValue()} encaminhada`,
          text: `A manifestação ${manifestation.protocol.getValue()} foi encaminhada para ${administrativeUnit.name}. Acesse o sistema para gerenciá-la.`,
        }),
      ),
    )
  }
}
