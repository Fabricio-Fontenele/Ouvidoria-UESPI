import type { AdminManifestationFilters } from '#src/application/repositories/admin-manifestation-filters.js'
import type {
  ManifestationMetrics,
  ManifestationsRepository,
} from '#src/application/repositories/manifestations-repository.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { UserRole } from '#src/domain/entities/user.js'

import { NotAllowedToManageManifestationError } from '../manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import type { UseCase } from '../use-case.js'

interface GetAdminManifestationMetricsInput {
  filters?: AdminManifestationFilters
  requesterUserId: string
}

export class GetAdminManifestationMetricsUseCase implements UseCase<
  GetAdminManifestationMetricsInput,
  ManifestationMetrics
> {
  constructor(
    private readonly manifestationsRepository: ManifestationsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute({ filters, requesterUserId }: GetAdminManifestationMetricsInput): Promise<ManifestationMetrics> {
    const requester = await this.usersRepository.findById(requesterUserId)

    if (!requester || (requester.role !== UserRole.OMBUDSMAN && requester.role !== UserRole.ADMIN)) {
      throw new NotAllowedToManageManifestationError()
    }

    return this.manifestationsRepository.getMetricsForAdmin(filters ?? {})
  }
}
