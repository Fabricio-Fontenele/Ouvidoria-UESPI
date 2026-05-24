import type {
  ManifestationMetrics,
  ManifestationsRepository,
} from '#src/application/repositories/manifestations-repository.js'

import type { UseCase } from '../use-case.js'

interface GetUserManifestationMetricsInput {
  userId: string
}

export class GetUserManifestationMetricsUseCase implements UseCase<
  GetUserManifestationMetricsInput,
  ManifestationMetrics
> {
  constructor(private readonly manifestationsRepository: ManifestationsRepository) {}

  async execute({ userId }: GetUserManifestationMetricsInput): Promise<ManifestationMetrics> {
    return this.manifestationsRepository.getMetricsByAuthorUserId(userId)
  }
}
