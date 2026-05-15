import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import type { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import { UserRole } from '#src/domain/entities/user.js'

import { ManifestationNotFoundError } from '../manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToManageManifestationError } from '../manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import type { UseCase } from '../use-case.js'

interface UpdateManifestationStatusInput {
  requesterUserId: string
  manifestationId: string
  status: ManifestationStatus
}

interface UpdateManifestationStatusOutput {
  manifestation: {
    id: string
    protocol: string
    type: ManifestationType
    status: ManifestationStatus
    campusId: string
    administrativeUnitId: string
    description: string
    involvedPeople: string | null
    authorUserId: string | null
    createdAt: Date
  }
}

export class UpdateManifestationStatusUseCase implements UseCase<
  UpdateManifestationStatusInput,
  UpdateManifestationStatusOutput
> {
  constructor(
    private readonly manifestationsRepository: ManifestationsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute({
    requesterUserId,
    manifestationId,
    status,
  }: UpdateManifestationStatusInput): Promise<UpdateManifestationStatusOutput> {
    const requester = await this.usersRepository.findById(requesterUserId)

    if (!requester || (requester.role !== UserRole.OMBUDSMAN && requester.role !== UserRole.ADMIN)) {
      throw new NotAllowedToManageManifestationError()
    }

    const manifestation = await this.manifestationsRepository.findById(manifestationId)

    if (!manifestation) {
      throw new ManifestationNotFoundError()
    }

    manifestation.transitionStatusAdministratively(status)

    await this.manifestationsRepository.save(manifestation)

    return {
      manifestation: {
        id: manifestation.id.toString(),
        protocol: manifestation.protocol.getValue(),
        type: manifestation.type,
        status: manifestation.status,
        campusId: manifestation.campusId.getValue(),
        administrativeUnitId: manifestation.administrativeUnitId.getValue(),
        description: manifestation.description.getValue(),
        involvedPeople: manifestation.involvedPeople?.getValue() ?? null,
        authorUserId: manifestation.authorUserId?.toString() ?? null,
        createdAt: manifestation.createdAt,
      },
    }
  }
}
