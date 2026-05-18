import { createClient } from '@supabase/supabase-js'

import type { AttachmentStorage, UploadAttachmentParams } from '#src/application/storage/attachment-storage.js'

interface SupabaseAttachmentStorageOptions {
  url: string
  serviceRoleKey: string
  bucket: string
}

export class SupabaseAttachmentStorage implements AttachmentStorage {
  private readonly client
  private readonly bucket: string

  constructor({ url, serviceRoleKey, bucket }: SupabaseAttachmentStorageOptions) {
    this.client = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    this.bucket = bucket
  }

  async upload({ storageKey, mimeType, content }: UploadAttachmentParams): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).upload(storageKey, content, {
      contentType: mimeType,
      upsert: false,
    })

    if (error !== null) {
      throw error
    }
  }

  async delete(storageKey: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove([storageKey])

    if (error !== null) {
      throw error
    }
  }

  async createSignedDownloadUrl(storageKey: string, expiresInSeconds: number): Promise<string> {
    const { data, error } = await this.client.storage.from(this.bucket).createSignedUrl(storageKey, expiresInSeconds, {
      download: true,
    })

    if (error !== null) {
      throw error
    }

    return data.signedUrl
  }
}
