import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import { ManifestationTrackingNotFoundError } from '#src/application/use-cases/track-manifestation-by-protocol/errors/manifestation-tracking-not-found-error.js'
import type { TrackManifestationByProtocolUseCase } from '#src/application/use-cases/track-manifestation-by-protocol/track-manifestation-by-protocol-use-case.js'
import { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import {
  TrackManifestationByProtocolController,
  type TrackManifestationByProtocolBody,
} from '#src/presentation/controllers/manifestation/track-manifestation-by-protocol.controller.js'
import { ServerError } from '#src/presentation/errors/server-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'
import type { Validator } from '#src/presentation/protocols/validator.js'

describe('TrackManifestationByProtocolController', () => {
  let useCase: DeepMockProxy<TrackManifestationByProtocolUseCase>
  let validator: DeepMockProxy<Validator<TrackManifestationByProtocolBody>>
  let sut: TrackManifestationByProtocolController
  let validBody: TrackManifestationByProtocolBody
  let baseRequest: HttpRequest

  beforeEach(() => {
    useCase = mockDeep<TrackManifestationByProtocolUseCase>()
    validator = mockDeep<Validator<TrackManifestationByProtocolBody>>()

    mockReset(useCase)
    mockReset(validator)

    validBody = { protocol: '2026-0001', accessCode: 'ABCD-1234' }
    baseRequest = { body: validBody, params: {}, query: {}, headers: {} }

    sut = new TrackManifestationByProtocolController(useCase, validator)
  })

  it('returns 200 with the manifestation summary when tracking succeeds', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockResolvedValue({
      manifestation: {
        protocol: '2026-0001',
        type: ManifestationType.REPORT,
        status: ManifestationStatus.IN_ANALYSIS,
        campusId: 'campus-1',
        administrativeUnitId: 'unit-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    })

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(200)
    expect(useCase.execute.mock.calls[0]?.[0]).toStrictEqual(validBody)
  })

  it('returns 400 with the validation error and skips the use case when validation fails', async () => {
    const validationError = new Error('Invalid body.')
    validator.validate.mockReturnValue({ success: false, error: validationError })

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(400)
    expect(response.body).toBe(validationError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('maps ManifestationTrackingNotFoundError to 404 regardless of root cause', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockRejectedValue(new ManifestationTrackingNotFoundError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(404)
    expect(response.body).toBeInstanceOf(ManifestationTrackingNotFoundError)
  })

  it('returns 500 with a ServerError wrapping unknown failures', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    const unexpected = new Error('repository down')
    useCase.execute.mockRejectedValue(unexpected)

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(500)
    expect(response.body).toBeInstanceOf(ServerError)
    expect((response.body as ServerError).cause).toBe(unexpected)
  })
})
