import { IdentifiedManifestationRequiresRequesterError } from '#src/application/use-cases/register-manifestation/errors/identified-manifestation-requires-requester-error.js'
import type { RegisterManifestationUseCase } from '#src/application/use-cases/register-manifestation/register-manifestation.use-case.js'
import type { ManifestationType } from '#src/domain/entities/manifestation.js'
import { InvalidAdministrativeUnitIdError } from '#src/domain/value-objects/administrative-unit-id.js'
import { InvalidCampusIdError } from '#src/domain/value-objects/campus-id.js'
import { InvalidManifestationDescriptionError } from '#src/domain/value-objects/manifestation-description.js'
import { InvalidManifestationInvolvedPeopleError } from '#src/domain/value-objects/manifestation-involved-people.js'

import { UnauthenticatedError } from '../../errors/unauthenticated-error.js'
import { badRequest, created, unauthorized } from '../../helpers/http-helpers.js'
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
