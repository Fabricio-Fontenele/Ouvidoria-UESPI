export interface ApiHttpErrorOptions {
  code: string
  message: string
  status: number
}

export class ApiHttpError extends Error {
  readonly code: string
  readonly status: number

  constructor(options: ApiHttpErrorOptions) {
    super(options.message)
    this.name = 'ApiHttpError'
    this.code = options.code
    this.status = options.status
  }
}

export function isApiError(error: unknown, code?: string): error is ApiHttpError {
  if (!(error instanceof ApiHttpError)) {
    return false
  }

  return code === undefined ? true : error.code === code
}
