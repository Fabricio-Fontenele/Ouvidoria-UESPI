import type { AdminManifestationFilters } from '#src/application/repositories/admin-manifestation-filters.js'
import type { ManifestationMetrics } from '#src/application/repositories/manifestations-repository.js'
import type { GetAdminManifestationMetricsUseCase } from '#src/application/use-cases/get-admin-manifestation-metrics/get-admin-manifestation-metrics-use-case.js'
import { NotAllowedToManageManifestationError } from '#src/application/use-cases/manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import { ManifestationType } from '#src/domain/entities/manifestation.js'

import { InvalidParamError } from '../../errors/invalid-param-error.js'
import { UnauthenticatedError } from '../../errors/unauthenticated-error.js'
import { badRequest, forbidden, ok, unauthorized } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import { BaseController } from '../base-controller.js'

export interface GetAdminManifestationMetricsQuery {
  administrativeUnitId?: string
  campusId?: string
  from?: string
  to?: string
  type?: string
}

type GetAdminManifestationMetricsRequest = HttpRequest<
  unknown,
  Record<string, string>,
  GetAdminManifestationMetricsQuery
>

const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
const MANIFESTATION_TYPE_VALUES = Object.values(ManifestationType) as readonly string[]

function isManifestationType(value: string): value is ManifestationType {
  return MANIFESTATION_TYPE_VALUES.includes(value)
}

function parseIsoDate(raw: string): Date | null {
  if (!ISO_DATE_TIME.test(raw)) {
    return null
  }

  const date = new Date(raw)

  if (Number.isNaN(date.getTime()) || date.toISOString() !== raw) {
    return null
  }

  return date
}

export class GetAdminManifestationMetricsController extends BaseController<GetAdminManifestationMetricsRequest> {
  constructor(private readonly useCase: GetAdminManifestationMetricsUseCase) {
    super()
  }

  protected async perform(request: GetAdminManifestationMetricsRequest): Promise<HttpResponse> {
    if (request.user === undefined) {
      return unauthorized(new UnauthenticatedError())
    }

    const { type, campusId, administrativeUnitId, from, to } = request.query
    const filters: AdminManifestationFilters = {}

    if (type !== undefined) {
      if (!isManifestationType(type)) {
        return badRequest(new InvalidParamError('type'))
      }
      filters.type = type
    }

    if (campusId !== undefined && campusId !== '') {
      filters.campusId = campusId
    }

    if (administrativeUnitId !== undefined && administrativeUnitId !== '') {
      filters.administrativeUnitId = administrativeUnitId
    }

    if (from !== undefined) {
      const parsed = parseIsoDate(from)
      if (parsed === null) {
        return badRequest(new InvalidParamError('from'))
      }
      filters.from = parsed
    }

    if (to !== undefined) {
      const parsed = parseIsoDate(to)
      if (parsed === null) {
        return badRequest(new InvalidParamError('to'))
      }
      filters.to = parsed
    }

    const result = await this.useCase.execute({
      requesterUserId: request.user.id,
      filters,
    })

    return ok<ManifestationMetrics>(result)
  }

  protected override mapError(error: unknown): HttpResponse | null {
    if (error instanceof NotAllowedToManageManifestationError) {
      return forbidden(error)
    }

    return null
  }
}
