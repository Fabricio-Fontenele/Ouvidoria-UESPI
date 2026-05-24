export class ForwardTargetUnitInactiveError extends Error {
  constructor() {
    super('Target administrative unit is inactive')
    this.name = 'ForwardTargetUnitInactiveError'
  }
}
