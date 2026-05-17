import type { AttachmentStorage, UploadAttachmentParams } from '#src/application/storage/attachment-storage.js'

export class InMemoryAttachmentStorage implements AttachmentStorage {
  private readonly storage = new Map<string, { content: Uint8Array; mimeType: string }>()
  private signedUrlCounter = 0

  async upload({ storageKey, mimeType, content }: UploadAttachmentParams): Promise<void> {
    this.storage.set(storageKey, { content, mimeType })
  }

  async delete(storageKey: string): Promise<void> {
    this.storage.delete(storageKey)
  }

  async createSignedDownloadUrl(storageKey: string, expiresInSeconds: number): Promise<string> {
    if (!this.storage.has(storageKey)) {
      throw new Error(`Attachment "${storageKey}" was not found in storage.`)
    }

    this.signedUrlCounter += 1

    return `https://storage.test/download/${String(this.signedUrlCounter)}?expiresIn=${String(expiresInSeconds)}`
  }

  clear(): void {
    this.storage.clear()
    this.signedUrlCounter = 0
  }
}
