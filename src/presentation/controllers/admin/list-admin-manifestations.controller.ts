import type { AdminManifestationFilters } from '#src/application/repositories/admin-manifestation-filters.js'
import type { ListAdminManifestationsUseCase } from '#src/application/use-cases/list-admin-manifestations/list-admin-manifestations-use-case.js'
import { InvalidPageNumberError } from '#src/application/use-cases/list-user-manifestations/errors/invalid-page-number-error.js'
import { NotAllowedToManageManifestationError } from '#src/application/use-cases/manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'

import { InvalidParamError } from '../../errors/invalid-param-error.js'
import { badRequest, forbidden, ok, unauthorized } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import { BaseController } from '../base-controller.js'

export interface ListAdminManifestationsQuery {
  page?: string
  status?: string
  type?: string
  campusId?: string
  administrativeUnitId?: string
  from?: string
  to?: string
}

type ListAdminManifestationsRequest = HttpRequest<unknown, Record<string, string>, ListAdminManifestationsQuery>

const POSITIVE_INTEGER = /^[1-9]\d*$/
const MANIFESTATION_STATUS_VALUES = Object.values(ManifestationStatus) as readonly string[]
const MANIFESTATION_TYPE_VALUES = Object.values(ManifestationType) as readonly string[]

function isManifestationStatus(value: string): value is ManifestationStatus {
  return MANIFESTATION_STATUS_VALUES.includes(value)
}

function isManifestationType(value: string): value is ManifestationType {
  return MANIFESTATION_TYPE_VALUES.includes(value)
}

function parseIsoDate(raw: string): Date | null {
  const ms = Date.parse(raw)
  return Number.isNaN(ms) ? null : new Date(ms)
}

export class ListAdminManifestationsController extends BaseController<ListAdminManifestationsRequest> {
  constructor(private readonly useCase: ListAdminManifestationsUseCase) {
    super()
  }

  protected async perform(request: ListAdminManifestationsRequest): Promise<HttpResponse> {
    if (request.user === undefined) {
      return unauthorized(new Error('Authentication required.'))
    }

    const { page: rawPage, status, type, campusId, administrativeUnitId, from, to } = request.query

    if (rawPage !== undefined && !POSITIVE_INTEGER.test(rawPage)) {
      return badRequest(new InvalidPageNumberError())
    }

    const page = rawPage === undefined ? 1 : Number.parseInt(rawPage, 10)
    const filters: AdminManifestationFilters = {}

    if (status !== undefined) {
      if (!isManifestationStatus(status)) {
        return badRequest(new InvalidParamError('status'))
      }
      filters.status = status
    }

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
      page,
      filters,
    })

    return ok(result)
  }

  protected override mapError(error: unknown): HttpResponse | null {
    if (error instanceof InvalidPageNumberError) {
      return badRequest(error)
    }

    if (error instanceof NotAllowedToManageManifestationError) {
      return forbidden(error)
    }

    return null
  }
}
