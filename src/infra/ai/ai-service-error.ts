export type AiServiceErrorKind = 'timeout' | 'upstream_status' | 'invalid_response' | 'network'

export class AiServiceError extends Error {
  constructor(
    public readonly kind: AiServiceErrorKind,
    message: string,
    public override readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'AiServiceError'
  }
}
