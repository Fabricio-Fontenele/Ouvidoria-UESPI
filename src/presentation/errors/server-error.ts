export class ServerError extends Error {
  constructor(cause?: unknown) {
    super('Internal server error.', cause === undefined ? undefined : { cause })
    this.name = 'ServerError'
  }
}
