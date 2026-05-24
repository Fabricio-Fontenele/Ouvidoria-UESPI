import type {
  ManifestationAttachmentDTO,
  ManifestationHistoryEntryDTO,
  ManifestationMessageDTO,
} from '#src/application/dto/manifestation-query-dtos.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import type { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import { UserRole } from '#src/domain/entities/user.js'

import { ManifestationNotFoundError } from '../manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToManageManifestationError } from '../manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import type { UseCase } from '../use-case.js'

interface GetAdminManifestationDetailsInput {
  requesterUserId: string
  manifestationId: string
}

interface GetAdminManifestationDetailsOutput {
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
    author: { id: string; name: string; email: string } | null
    attendantUserId: string | null
    forwardedToUnit: { id: string; name: string } | null
    createdAt: Date
    history: ManifestationHistoryEntryDTO[]
    messages: ManifestationMessageDTO[]
    attachments: ManifestationAttachmentDTO[]
  }
}

export class GetAdminManifestationDetailsUseCase implements UseCase<
  GetAdminManifestationDetailsInput,
  GetAdminManifestationDetailsOutput
> {
  constructor(
    private readonly manifestationsRepository: ManifestationsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute({
    requesterUserId,
    manifestationId,
  }: GetAdminManifestationDetailsInput): Promise<GetAdminManifestationDetailsOutput> {
    const requester = await this.usersRepository.findById(requesterUserId)

    if (!requester || (requester.role !== UserRole.OMBUDSMAN && requester.role !== UserRole.ADMIN)) {
      throw new NotAllowedToManageManifestationError()
    }

    const manifestation = await this.manifestationsRepository.findDetailsById(manifestationId)

    if (!manifestation) {
      throw new ManifestationNotFoundError()
    }

    return {
      manifestation: {
        id: manifestation.id,
        protocol: manifestation.protocol,
        type: manifestation.type,
        status: manifestation.status,
        campusId: manifestation.campusId,
        administrativeUnitId: manifestation.administrativeUnitId,
        description: manifestation.description,
        involvedPeople: manifestation.involvedPeople,
        authorUserId: manifestation.authorUserId,
        author: manifestation.author,
        attendantUserId: manifestation.attendantUserId,
        forwardedToUnit: manifestation.forwardedToUnit,
        createdAt: manifestation.createdAt,
        history: manifestation.history,
        messages: manifestation.messages,
        attachments: manifestation.attachments,
      },
    }
  }
}
