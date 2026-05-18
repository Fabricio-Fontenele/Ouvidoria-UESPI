import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import { AdministrativeUnitDoesNotBelongToCampusError } from '#src/application/use-cases/register-manifestation/errors/administrative-unit-does-not-belong-to-campus-error.js'
import { AdministrativeUnitInactiveError } from '#src/application/use-cases/register-manifestation/errors/administrative-unit-inactive-error.js'
import { AdministrativeUnitNotFoundError } from '#src/application/use-cases/register-manifestation/errors/administrative-unit-not-found-error.js'
import { CampusInactiveError } from '#src/application/use-cases/register-manifestation/errors/campus-inactive-error.js'
import { CampusNotFoundError } from '#src/application/use-cases/register-manifestation/errors/campus-not-found-error.js'
import { IdentifiedManifestationRequiresManifestantRoleError } from '#src/application/use-cases/register-manifestation/errors/identified-manifestation-requires-manifestant-role-error.js'
import { IdentifiedManifestationRequiresRequesterError } from '#src/application/use-cases/register-manifestation/errors/identified-manifestation-requires-requester-error.js'
import type { RegisterManifestationUseCase } from '#src/application/use-cases/register-manifestation/register-manifestation.use-case.js'
import { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import { UserRole } from '#src/domain/entities/user.js'
import { InvalidAdministrativeUnitIdError } from '#src/domain/value-objects/administrative-unit-id.js'
import { InvalidCampusIdError } from '#src/domain/value-objects/campus-id.js'
import { InvalidManifestationDescriptionError } from '#src/domain/value-objects/manifestation-description.js'
import { InvalidManifestationInvolvedPeopleError } from '#src/domain/value-objects/manifestation-involved-people.js'
import {
  RegisterManifestationController,
  type RegisterManifestationBody,
} from '#src/presentation/controllers/manifestation/register-manifestation.controller.js'
import { ServerError } from '#src/presentation/errors/server-error.js'
import { UnauthenticatedError } from '#src/presentation/errors/unauthenticated-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'
import type { Validator } from '#src/presentation/protocols/validator.js'

describe('RegisterManifestationController', () => {
  let useCase: DeepMockProxy<RegisterManifestationUseCase>
  let validator: DeepMockProxy<Validator<RegisterManifestationBody>>
  let sut: RegisterManifestationController
  let validBody: RegisterManifestationBody
  let baseRequest: HttpRequest

  beforeEach(() => {
    useCase = mockDeep<RegisterManifestationUseCase>()
    validator = mockDeep<Validator<RegisterManifestationBody>>()

    mockReset(useCase)
    mockReset(validator)

    validBody = {
      isAnonymous: false,
      type: ManifestationType.COMPLAINT,
      campusId: 'campus-1',
      administrativeUnitId: 'unit-1',
      description: 'The service was unavailable during the whole morning.',
      involvedPeople: 'Coordination Team',
    }

    baseRequest = {
      body: validBody,
      params: {},
      query: {},
      headers: {},
    }

    sut = new RegisterManifestationController(useCase, validator)
  })

  function arrangeUseCaseSuccess(): void {
    useCase.execute.mockResolvedValue({
      manifestation: {
        id: 'manifestation-1',
        protocol: '2026-0001',
        type: ManifestationType.COMPLAINT,
        status: ManifestationStatus.IN_ANALYSIS,
        campusId: 'campus-1',
        administrativeUnitId: 'unit-1',
        description: 'The service was unavailable during the whole morning.',
        involvedPeople: 'Coordination Team',
        isAnonymous: false,
        authorUserId: 'user-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      accessCode: null,
    })
  }

  it('returns 201 with use case output when validation succeeds', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    arrangeUseCaseSuccess()

    const response = await sut.handle({
      ...baseRequest,
      user: { id: 'user-1', role: UserRole.MANIFESTANT },
    })

    expect(response.statusCode).toBe(201)
    expect(useCase.execute.mock.calls).toHaveLength(1)
    expect(useCase.execute.mock.calls[0]?.[0]).toStrictEqual({
      requesterId: 'user-1',
      isAnonymous: false,
      type: ManifestationType.COMPLAINT,
      campusId: 'campus-1',
      administrativeUnitId: 'unit-1',
      description: 'The service was unavailable during the whole morning.',
      involvedPeople: 'Coordination Team',
    })
  })

  it('passes a null requesterId when the request has no authenticated user', async () => {
    validator.validate.mockReturnValue({
      success: true,
      data: { ...validBody, isAnonymous: true },
    })
    arrangeUseCaseSuccess()

    await sut.handle(baseRequest)

    expect(useCase.execute.mock.calls[0]?.[0].requesterId).toBeNull()
  })

  it('normalizes an omitted involvedPeople to null before calling the use case', async () => {
    const { involvedPeople: _omitted, ...bodyWithoutInvolvedPeople } = validBody

    validator.validate.mockReturnValue({ success: true, data: bodyWithoutInvolvedPeople })
    arrangeUseCaseSuccess()

    await sut.handle({
      ...baseRequest,
      body: bodyWithoutInvolvedPeople,
      user: { id: 'user-1', role: UserRole.MANIFESTANT },
    })

    expect(useCase.execute.mock.calls[0]?.[0].involvedPeople).toBeNull()
  })

  it('returns 400 with the validation error and skips the use case when validation fails', async () => {
    const validationError = new Error('Invalid body.')
    validator.validate.mockReturnValue({ success: false, error: validationError })

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(400)
    expect(response.body).toBe(validationError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('returns 401 and skips the use case when identified manifestation has no authenticated user', async () => {
    validator.validate.mockReturnValue({
      success: true,
      data: { ...validBody, isAnonymous: false },
    })

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(401)
    expect(response.body).toBeInstanceOf(UnauthenticatedError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('returns 403 when an ombudsman tries to open an identified manifestation', async () => {
    validator.validate.mockReturnValue({
      success: true,
      data: { ...validBody, isAnonymous: false },
    })

    const response = await sut.handle({
      ...baseRequest,
      user: { id: 'ombudsman-1', role: UserRole.OMBUDSMAN },
    })

    expect(response.statusCode).toBe(403)
    expect(response.body).toBeInstanceOf(IdentifiedManifestationRequiresManifestantRoleError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('returns 403 when an admin tries to open an identified manifestation', async () => {
    validator.validate.mockReturnValue({
      success: true,
      data: { ...validBody, isAnonymous: false },
    })

    const response = await sut.handle({
      ...baseRequest,
      user: { id: 'admin-1', role: UserRole.ADMIN },
    })

    expect(response.statusCode).toBe(403)
    expect(response.body).toBeInstanceOf(IdentifiedManifestationRequiresManifestantRoleError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('still allows ombudsman/admin to open anonymous manifestations (no requesterId derived)', async () => {
    validator.validate.mockReturnValue({
      success: true,
      data: { ...validBody, isAnonymous: true },
    })
    arrangeUseCaseSuccess()

    const response = await sut.handle({
      ...baseRequest,
      user: { id: 'admin-1', role: UserRole.ADMIN },
    })

    expect(response.statusCode).toBe(201)
    expect(useCase.execute.mock.calls).toHaveLength(1)
    expect(useCase.execute.mock.calls[0]?.[0].isAnonymous).toBe(true)
  })

  it('still maps IdentifiedManifestationRequiresRequesterError to 400 as a use-case safeguard', async () => {
    validator.validate.mockReturnValue({ success: true, data: { ...validBody, isAnonymous: true } })
    useCase.execute.mockRejectedValue(new IdentifiedManifestationRequiresRequesterError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(400)
    expect(response.body).toBeInstanceOf(IdentifiedManifestationRequiresRequesterError)
  })

  it('maps catalog and value-object errors to 400', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockRejectedValueOnce(new CampusNotFoundError())

    const firstResponse = await sut.handle({
      ...baseRequest,
      user: { id: 'user-1', role: UserRole.MANIFESTANT },
    })

    expect(firstResponse.statusCode).toBe(400)
    expect(firstResponse.body).toBeInstanceOf(CampusNotFoundError)

    useCase.execute.mockRejectedValueOnce(new CampusInactiveError())

    const secondResponse = await sut.handle({
      ...baseRequest,
      user: { id: 'user-1', role: UserRole.MANIFESTANT },
    })

    expect(secondResponse.statusCode).toBe(400)
    expect(secondResponse.body).toBeInstanceOf(CampusInactiveError)

    useCase.execute.mockRejectedValueOnce(new AdministrativeUnitNotFoundError())

    const thirdResponse = await sut.handle({
      ...baseRequest,
      user: { id: 'user-1', role: UserRole.MANIFESTANT },
    })

    expect(thirdResponse.statusCode).toBe(400)
    expect(thirdResponse.body).toBeInstanceOf(AdministrativeUnitNotFoundError)

    useCase.execute.mockRejectedValueOnce(new AdministrativeUnitInactiveError())

    const fourthResponse = await sut.handle({
      ...baseRequest,
      user: { id: 'user-1', role: UserRole.MANIFESTANT },
    })

    expect(fourthResponse.statusCode).toBe(400)
    expect(fourthResponse.body).toBeInstanceOf(AdministrativeUnitInactiveError)

    useCase.execute.mockRejectedValueOnce(new AdministrativeUnitDoesNotBelongToCampusError())

    const fifthResponse = await sut.handle({
      ...baseRequest,
      user: { id: 'user-1', role: UserRole.MANIFESTANT },
    })

    expect(fifthResponse.statusCode).toBe(400)
    expect(fifthResponse.body).toBeInstanceOf(AdministrativeUnitDoesNotBelongToCampusError)

    useCase.execute.mockRejectedValueOnce(new InvalidCampusIdError())

    const sixthResponse = await sut.handle({
      ...baseRequest,
      user: { id: 'user-1', role: UserRole.MANIFESTANT },
    })

    expect(sixthResponse.statusCode).toBe(400)
    expect(sixthResponse.body).toBeInstanceOf(InvalidCampusIdError)

    useCase.execute.mockRejectedValueOnce(new InvalidAdministrativeUnitIdError())

    const seventhResponse = await sut.handle({
      ...baseRequest,
      user: { id: 'user-1', role: UserRole.MANIFESTANT },
    })

    expect(seventhResponse.statusCode).toBe(400)
    expect(seventhResponse.body).toBeInstanceOf(InvalidAdministrativeUnitIdError)

    useCase.execute.mockRejectedValueOnce(new InvalidManifestationDescriptionError())

    const eighthResponse = await sut.handle({
      ...baseRequest,
      user: { id: 'user-1', role: UserRole.MANIFESTANT },
    })

    expect(eighthResponse.statusCode).toBe(400)
    expect(eighthResponse.body).toBeInstanceOf(InvalidManifestationDescriptionError)

    useCase.execute.mockRejectedValueOnce(new InvalidManifestationInvolvedPeopleError())

    const ninthResponse = await sut.handle({
      ...baseRequest,
      user: { id: 'user-1', role: UserRole.MANIFESTANT },
    })

    expect(ninthResponse.statusCode).toBe(400)
    expect(ninthResponse.body).toBeInstanceOf(InvalidManifestationInvolvedPeopleError)
  })

  it('returns 500 with a ServerError wrapping unknown failures', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    const unexpected = new Error('database is on fire')
    useCase.execute.mockRejectedValue(unexpected)

    const response = await sut.handle({
      ...baseRequest,
      user: { id: 'user-1', role: UserRole.MANIFESTANT },
    })

    expect(response.statusCode).toBe(500)
    expect(response.body).toBeInstanceOf(ServerError)
    expect((response.body as ServerError).cause).toBe(unexpected)
  })
})
