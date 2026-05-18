export class AttachmentFileEmptyError extends Error {
  constructor() {
    super('Attachment file cannot be empty.')
    this.name = 'AttachmentFileEmptyError'
  }
}
