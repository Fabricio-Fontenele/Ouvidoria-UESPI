import type { ManifestationListItemDTO } from '#src/application/dto/manifestation-query-dtos.js'
import type { AdminManifestationFilters } from '#src/application/repositories/admin-manifestation-filters.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import {
  buildManifestationsPaginationMetadata,
  type PaginationMetadata,
} from '#src/application/repositories/pagination-params.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import type { ManifestationStatus } from '#src/domain/entities/manifestation.js'
import { UserRole } from '#src/domain/entities/user.js'

import { InvalidPageNumberError } from '../list-user-manifestations/errors/invalid-page-number-error.js'
import { NotAllowedToManageManifestationError } from '../manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import type { UseCase } from '../use-case.js'

interface ListAdminManifestationsInput {
  requesterUserId: string
  page: number
  filters?: AdminManifestationFilters
}

interface ListAdminManifestationsOutput extends PaginationMetadata {
  manifestations: ManifestationListItemDTO[]
  statusTotals: Record<ManifestationStatus, number>
}

export class ListAdminManifestationsUseCase implements UseCase<
  ListAdminManifestationsInput,
  ListAdminManifestationsOutput
> {
  constructor(
    private readonly manifestationsRepository: ManifestationsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute({
    requesterUserId,
    page,
    filters,
  }: ListAdminManifestationsInput): Promise<ListAdminManifestationsOutput> {
    if (page < 1) {
      throw new InvalidPageNumberError()
    }

    const requester = await this.usersRepository.findById(requesterUserId)

    if (!requester || (requester.role !== UserRole.OMBUDSMAN && requester.role !== UserRole.ADMIN)) {
      throw new NotAllowedToManageManifestationError()
    }

    const { manifestations, statusTotals, totalItems } = await this.manifestationsRepository.findManyForAdmin(
      filters ?? {},
      { page },
    )

    return { manifestations, statusTotals, ...buildManifestationsPaginationMetadata(page, totalItems) }
  }
}
