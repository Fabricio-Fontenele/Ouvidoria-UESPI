import { describe, expect, it } from 'vitest'

import { ApiHttpError } from './api-error'
import { resolveApiErrorMessage } from './resolve-api-error-message'

const FALLBACK = 'Não foi possível concluir a operação agora. Tente novamente.'

describe('resolveApiErrorMessage', () => {
  it('maps a known backend error code to a friendly Portuguese message', () => {
    const error = new ApiHttpError({ code: 'InvalidCredentialsError', message: 'Invalid credentials', status: 401 })

    expect(resolveApiErrorMessage(error, FALLBACK)).toBe('E-mail ou senha incorretos.')
  })

  it('never surfaces the raw backend message for an unknown code', () => {
    const error = new ApiHttpError({ code: 'SomeBrandNewError', message: 'Totally raw backend text', status: 409 })

    expect(resolveApiErrorMessage(error, FALLBACK)).toBe(FALLBACK)
  })

  it('falls back for generic HTTP/server errors instead of leaking the message', () => {
    const error = new ApiHttpError({ code: 'HttpError500', message: 'Internal Server Error', status: 500 })

    expect(resolveApiErrorMessage(error, FALLBACK)).toBe(FALLBACK)
  })

  it('maps NetworkError to a connectivity message', () => {
    const error = new ApiHttpError({ code: 'NetworkError', message: 'Failed to fetch', status: 0 })

    expect(resolveApiErrorMessage(error, FALLBACK)).toBe('Falha de conexão. Verifique sua internet e tente novamente.')
  })

  it('falls back for non-ApiHttpError values', () => {
    expect(resolveApiErrorMessage(new Error('raw error'), FALLBACK)).toBe(FALLBACK)
    expect(resolveApiErrorMessage('boom', FALLBACK)).toBe(FALLBACK)
    expect(resolveApiErrorMessage(null, FALLBACK)).toBe(FALLBACK)
  })
})
