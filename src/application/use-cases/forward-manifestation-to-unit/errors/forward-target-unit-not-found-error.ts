export class ForwardTargetUnitNotFoundError extends Error {
  constructor() {
    super('Target administrative unit not found')
    this.name = 'ForwardTargetUnitNotFoundError'
  }
}
