import { describe, expect, it, vi } from 'vitest'

import { makeApiKeyAuth } from '../../src/presentation/middlewares/api-key-auth.js'

function createReplyDouble() {
  const reply = {
    code: vi.fn(),
    send: vi.fn(),
  }

  reply.code.mockReturnValue(reply)

  return reply
}

describe('makeApiKeyAuth', () => {
  it('returns 401 when x-api-key is missing', async () => {
    const reply = createReplyDouble()
    const auth = makeApiKeyAuth('secret')

    await auth({ headers: {} } as never, reply as never)

    expect(reply.code).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith({ error: 'missing_api_key' })
  })

  it('returns 401 when x-api-key is invalid', async () => {
    const reply = createReplyDouble()
    const auth = makeApiKeyAuth('secret')

    await auth({ headers: { 'x-api-key': 'wrong' } } as never, reply as never)

    expect(reply.code).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith({ error: 'invalid_api_key' })
  })

  it('passes when x-api-key is valid', async () => {
    const reply = createReplyDouble()
    const auth = makeApiKeyAuth('secret')

    await auth({ headers: { 'x-api-key': 'secret' } } as never, reply as never)

    expect(reply.code).not.toHaveBeenCalled()
    expect(reply.send).not.toHaveBeenCalled()
  })
})
