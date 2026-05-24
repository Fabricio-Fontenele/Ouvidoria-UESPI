import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { GetTrackedManifestationDetailsUseCase } from '#src/application/use-cases/manifestation-attachments/get-tracked-manifestation-details-use-case.js'
import { ManifestationTrackingNotFoundError } from '#src/application/use-cases/track-manifestation-by-protocol/errors/manifestation-tracking-not-found-error.js'
import { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import { GetTrackedManifestationDetailsController } from '#src/presentation/controllers/manifestation/get-tracked-manifestation-details.controller.js'
import { ServerError } from '#src/presentation/errors/server-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'
import type { Validator } from '#src/presentation/protocols/validator.js'

interface Body {
  protocol: string
  accessCode: string
}

describe('GetTrackedManifestationDetailsController', () => {
  let useCase: DeepMockProxy<GetTrackedManifestationDetailsUseCase>
  let validator: DeepMockProxy<Validator<Body>>
  let sut: GetTrackedManifestationDetailsController
  let baseRequest: HttpRequest<Body>

  beforeEach(() => {
    useCase = mockDeep<GetTrackedManifestationDetailsUseCase>()
    validator = mockDeep<Validator<Body>>()

    mockReset(useCase)
    mockReset(validator)

    baseRequest = {
      body: { protocol: 'OUV-2026-K7F9Q2', accessCode: 'ABCD-1234' },
      params: {},
      query: {},
      headers: {},
    }

    sut = new GetTrackedManifestationDetailsController(useCase, validator)
  })

  it('returns 400 with the validation error and skips the use case when validation fails', async () => {
    const validationError = new Error('Invalid body.')
    validator.validate.mockReturnValue({ success: false, error: validationError })

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(400)
    expect(response.body).toBe(validationError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('returns 200 with the tracked manifestation public details', async () => {
    validator.validate.mockReturnValue({ success: true, data: baseRequest.body })
    useCase.execute.mockResolvedValue({
      manifestation: {
        protocol: 'OUV-2026-K7F9Q2',
        type: ManifestationType.COMPLAINT,
        status: ManifestationStatus.IN_ANALYSIS,
        campusId: 'campus-1',
        administrativeUnitId: 'unit-1',
        forwardedToUnit: null,
        createdAt: new Date('2026-05-10T12:00:00.000Z'),
        attachments: [],
      },
    })

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(200)
    expect(useCase.execute.mock.calls[0]?.[0]).toStrictEqual(baseRequest.body)
  })

  it('maps ManifestationTrackingNotFoundError to 404', async () => {
    validator.validate.mockReturnValue({ success: true, data: baseRequest.body })
    useCase.execute.mockRejectedValue(new ManifestationTrackingNotFoundError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(404)
    expect(response.body).toBeInstanceOf(ManifestationTrackingNotFoundError)
  })

  it('returns 500 with a ServerError wrapping unknown failures', async () => {
    validator.validate.mockReturnValue({ success: true, data: baseRequest.body })
    const unexpected = new Error('repository down')
    useCase.execute.mockRejectedValue(unexpected)

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(500)
    expect(response.body).toBeInstanceOf(ServerError)
    expect((response.body as ServerError).cause).toBe(unexpected)
  })
})
