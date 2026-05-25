import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import { UserNotFoundError } from '#src/application/use-cases/get-me/errors/user-not-found-error.js'
import type { GetMeUseCase } from '#src/application/use-cases/get-me/get-me-use-case.js'
import { UserRole } from '#src/domain/entities/user.js'
import { GetMeController } from '#src/presentation/controllers/auth/get-me.controller.js'
import { ServerError } from '#src/presentation/errors/server-error.js'
import { UnauthenticatedError } from '#src/presentation/errors/unauthenticated-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'

describe('GetMeController', () => {
  let useCase: DeepMockProxy<GetMeUseCase>
  let sut: GetMeController
  let baseRequest: HttpRequest

  beforeEach(() => {
    useCase = mockDeep<GetMeUseCase>()
    mockReset(useCase)

    baseRequest = {
      body: {},
      params: {},
      query: {},
      headers: {},
      user: { id: 'user-1', role: UserRole.OMBUDSMAN },
    }

    sut = new GetMeController(useCase)
  })

  it('returns 200 with the authenticated user profile', async () => {
    const output = {
      user: {
        id: 'user-1',
        name: 'User Name',
        email: 'user@example.com',
        role: UserRole.OMBUDSMAN,
        createdAt: new Date('2026-05-25T12:00:00.000Z'),
        attendanceRating: { average: 4.5, count: 2 },
      },
    }

    useCase.execute.mockResolvedValue(output)

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(200)
    expect(response.body).toBe(output)
    expect(useCase.execute.mock.calls).toStrictEqual([[{ userId: 'user-1' }]])
  })

  it('returns 401 when the request has no authenticated user', async () => {
    const { user: _user, ...unauthenticated } = baseRequest

    const response = await sut.handle(unauthenticated)

    expect(response.statusCode).toBe(401)
    expect(response.body).toBeInstanceOf(UnauthenticatedError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('maps UserNotFoundError to 404', async () => {
    useCase.execute.mockRejectedValue(new UserNotFoundError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(404)
    expect(response.body).toBeInstanceOf(UserNotFoundError)
  })

  it('returns 500 with a ServerError wrapping unknown failures', async () => {
    const unexpected = new Error('database unavailable')
    useCase.execute.mockRejectedValue(unexpected)

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(500)
    expect(response.body).toBeInstanceOf(ServerError)
    expect((response.body as ServerError).cause).toBe(unexpected)
  })
})
