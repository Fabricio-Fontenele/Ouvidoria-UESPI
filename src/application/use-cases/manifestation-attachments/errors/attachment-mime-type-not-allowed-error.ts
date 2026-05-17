export class AttachmentMimeTypeNotAllowedError extends Error {
  constructor() {
    super('Attachment MIME type is not allowed.')
    this.name = 'AttachmentMimeTypeNotAllowedError'
  }
}
