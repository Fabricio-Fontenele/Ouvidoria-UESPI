export class AttachmentNotFoundError extends Error {
  constructor() {
    super('Attachment not found.')
    this.name = 'AttachmentNotFoundError'
  }
}
