import type { ManifestationMetrics } from '#src/application/repositories/manifestations-repository.js'
import type { GetUserManifestationMetricsUseCase } from '#src/application/use-cases/get-user-manifestation-metrics/get-user-manifestation-metrics-use-case.js'

import { UnauthenticatedError } from '../../errors/unauthenticated-error.js'
import { ok, unauthorized } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import { BaseController } from '../base-controller.js'

type GetUserManifestationMetricsRequest = HttpRequest<unknown, Record<string, string>, Record<string, string>>

export class GetUserManifestationMetricsController extends BaseController<GetUserManifestationMetricsRequest> {
  constructor(private readonly useCase: GetUserManifestationMetricsUseCase) {
    super()
  }

  protected async perform(request: GetUserManifestationMetricsRequest): Promise<HttpResponse> {
    if (request.user === undefined) {
      return unauthorized(new UnauthenticatedError())
    }

    const result: ManifestationMetrics = await this.useCase.execute({ userId: request.user.id })

    return ok<ManifestationMetrics>(result)
  }
}
