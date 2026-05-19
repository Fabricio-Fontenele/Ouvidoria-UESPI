export interface UploadAttachmentParams {
  storageKey: string
  mimeType: string
  content: Uint8Array
}

export interface AttachmentStorage {
  upload(params: UploadAttachmentParams): Promise<void>
  delete(storageKey: string): Promise<void>
  createSignedDownloadUrl(storageKey: string, expiresInSeconds: number): Promise<string>
}
