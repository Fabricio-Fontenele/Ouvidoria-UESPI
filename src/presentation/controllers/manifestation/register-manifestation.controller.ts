import { AdministrativeUnitDoesNotBelongToCampusError } from '#src/application/use-cases/register-manifestation/errors/administrative-unit-does-not-belong-to-campus-error.js'
import { AdministrativeUnitInactiveError } from '#src/application/use-cases/register-manifestation/errors/administrative-unit-inactive-error.js'
import { AdministrativeUnitNotFoundError } from '#src/application/use-cases/register-manifestation/errors/administrative-unit-not-found-error.js'
import { CampusInactiveError } from '#src/application/use-cases/register-manifestation/errors/campus-inactive-error.js'
import { CampusNotFoundError } from '#src/application/use-cases/register-manifestation/errors/campus-not-found-error.js'
import { IdentifiedManifestationRequiresManifestantRoleError } from '#src/application/use-cases/register-manifestation/errors/identified-manifestation-requires-manifestant-role-error.js'
import { IdentifiedManifestationRequiresRequesterError } from '#src/application/use-cases/register-manifestation/errors/identified-manifestation-requires-requester-error.js'
import type { RegisterManifestationUseCase } from '#src/application/use-cases/register-manifestation/register-manifestation.use-case.js'
import type { ManifestationType } from '#src/domain/entities/manifestation.js'
import { UserRole } from '#src/domain/entities/user.js'
import { InvalidAdministrativeUnitIdError } from '#src/domain/value-objects/administrative-unit-id.js'
import { InvalidCampusIdError } from '#src/domain/value-objects/campus-id.js'
import { InvalidManifestationDescriptionError } from '#src/domain/value-objects/manifestation-description.js'
import { InvalidManifestationInvolvedPeopleError } from '#src/domain/value-objects/manifestation-involved-people.js'

import { UnauthenticatedError } from '../../errors/unauthenticated-error.js'
import { badRequest, created, forbidden, unauthorized } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import type { Validator } from '../../protocols/validator.js'
import { BaseController } from '../base-controller.js'

export interface RegisterManifestationBody {
  isAnonymous: boolean
  type: ManifestationType
  campusId: string
  administrativeUnitId: string
  description: string
  involvedPeople?: string | null
}

export class RegisterManifestationController extends BaseController {
  constructor(
    private readonly useCase: RegisterManifestationUseCase,
    private readonly validator: Validator<RegisterManifestationBody>,
  ) {
    super()
  }

  protected async perform(request: HttpRequest): Promise<HttpResponse> {
    const validation = this.validator.validate(request.body)

    if (!validation.success) {
      return badRequest(validation.error)
    }

    const { isAnonymous, type, campusId, administrativeUnitId, description, involvedPeople } = validation.data

    if (!isAnonymous && request.user === undefined) {
      return unauthorized(new UnauthenticatedError())
    }

    if (!isAnonymous && request.user !== undefined && request.user.role !== UserRole.MANIFESTANT) {
      return forbidden(new IdentifiedManifestationRequiresManifestantRoleError())
    }

    const result = await this.useCase.execute({
      requesterId: request.user?.id ?? null,
      isAnonymous,
      type,
      campusId,
      administrativeUnitId,
      description,
      involvedPeople: involvedPeople ?? null,
    })

    return created(result)
  }

  protected override mapError(error: unknown): HttpResponse | null {
    if (
      error instanceof IdentifiedManifestationRequiresRequesterError ||
      error instanceof CampusNotFoundError ||
      error instanceof CampusInactiveError ||
      error instanceof AdministrativeUnitNotFoundError ||
      error instanceof AdministrativeUnitInactiveError ||
      error instanceof AdministrativeUnitDoesNotBelongToCampusError ||
      error instanceof InvalidCampusIdError ||
      error instanceof InvalidAdministrativeUnitIdError ||
      error instanceof InvalidManifestationDescriptionError ||
      error instanceof InvalidManifestationInvolvedPeopleError
    ) {
      return badRequest(error)
    }

    return null
  }
}
