export class AttachmentFileTooLargeError extends Error {
  constructor() {
    super('Attachment file exceeds the maximum allowed size.')
    this.name = 'AttachmentFileTooLargeError'
  }
}
