import type { ManifestationStatusNotifier } from '#src/application/notifications/manifestation-status-notifier.js'
import type { CatalogRepository } from '#src/application/repositories/catalog-repository.js'
import type { ManifestationAdministrationRepository } from '#src/application/repositories/manifestation-administration-repository.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { ManifestationMessageSenderType } from '#src/domain/entities/manifestation-message.js'
import type { ManifestationStatus } from '#src/domain/entities/manifestation.js'
import { UserRole } from '#src/domain/entities/user.js'
import { AdministrativeUnitId } from '#src/domain/value-objects/administrative-unit-id.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

import { ManifestationNotFoundError } from '../manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToManageManifestationError } from '../manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import type { UseCase } from '../use-case.js'
import { ForwardTargetUnitInactiveError } from './errors/forward-target-unit-inactive-error.js'
import { ForwardTargetUnitNotFoundError } from './errors/forward-target-unit-not-found-error.js'

interface ForwardManifestationToUnitInput {
  requesterUserId: string
  manifestationId: string
  administrativeUnitId: string
}

interface ForwardManifestationToUnitOutput {
  manifestation: {
    id: string
    status: ManifestationStatus
    forwardedToUnit: { id: string; name: string }
  }
}

export class ForwardManifestationToUnitUseCase implements UseCase<
  ForwardManifestationToUnitInput,
  ForwardManifestationToUnitOutput
> {
  constructor(
    private readonly manifestationsRepository: ManifestationsRepository,
    private readonly manifestationAdministrationRepository: ManifestationAdministrationRepository,
    private readonly usersRepository: UsersRepository,
    private readonly catalogRepository: CatalogRepository,
    private readonly manifestationStatusNotifier?: ManifestationStatusNotifier,
  ) {}

  async execute({
    requesterUserId,
    manifestationId,
    administrativeUnitId,
  }: ForwardManifestationToUnitInput): Promise<ForwardManifestationToUnitOutput> {
    const targetUnitId = AdministrativeUnitId.create(administrativeUnitId)
    const requester = await this.usersRepository.findById(requesterUserId)

    if (!requester || (requester.role !== UserRole.OMBUDSMAN && requester.role !== UserRole.ADMIN)) {
      throw new NotAllowedToManageManifestationError()
    }

    const manifestation = await this.manifestationsRepository.findById(manifestationId)

    if (!manifestation) {
      throw new ManifestationNotFoundError()
    }

    const targetUnit = await this.catalogRepository.findAdministrativeUnitById(targetUnitId.getValue())

    if (targetUnit === null) {
      throw new ForwardTargetUnitNotFoundError()
    }

    if (!targetUnit.isActive) {
      throw new ForwardTargetUnitInactiveError()
    }

    const requesterId = new UniqueEntityId(requesterUserId)
    const previousStatus = manifestation.status

    manifestation.forwardToUnit(targetUnitId)
    manifestation.assignAttendant(requesterId, requester.role)

    const actorType =
      requester.role === UserRole.ADMIN
        ? ManifestationMessageSenderType.ADMIN
        : ManifestationMessageSenderType.OMBUDSMAN

    await this.manifestationAdministrationRepository.forwardToUnit({
      manifestation,
      actorUserId: requesterUserId,
      actorType,
      forwardedToUnitName: targetUnit.name,
      fromStatus: previousStatus,
      toStatus: manifestation.status,
    })

    if (previousStatus !== manifestation.status) {
      await this.manifestationStatusNotifier?.notify(manifestation)
    }

    return {
      manifestation: {
        id: manifestation.id.toString(),
        status: manifestation.status,
        forwardedToUnit: { id: targetUnit.id, name: targetUnit.name },
      },
    }
  }
}
