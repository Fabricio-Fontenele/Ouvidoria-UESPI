import { fileTypeFromBuffer } from 'file-type'

import type { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

export const MAX_ATTACHMENT_SIZE_IN_BYTES = 10 * 1024 * 1024
export const MAX_ATTACHMENTS_PER_MANIFESTATION = 5

export const ALLOWED_ATTACHMENT_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const

const disallowedFilenameCharacters = /[<>:"/\\|?*]/g
const nonAsciiCharacters = /[^\x20-\x7E]/g

export interface AttachmentUploadFile {
  originalName: string
  mimeType: string
  sizeInBytes: number
  content: Uint8Array
}

export function normalizeAttachmentMimeType(mimeType: string): string {
  return mimeType.trim().toLowerCase()
}

export function isAllowedAttachmentMimeType(mimeType: string): boolean {
  return (ALLOWED_ATTACHMENT_MIME_TYPES as readonly string[]).includes(mimeType)
}

export async function detectAttachmentMimeType(content: Uint8Array): Promise<string | null> {
  const detected = await fileTypeFromBuffer(content)

  return detected?.mime ?? null
}

export function sanitizeAttachmentOriginalName(originalName: string): string {
  const withoutControlCharacters = Array.from(originalName)
    .filter((character) => {
      const codePoint = character.codePointAt(0)

      return codePoint !== undefined && codePoint >= 0x20 && codePoint !== 0x7f
    })
    .join('')

  const normalized = withoutControlCharacters.normalize('NFKD').replaceAll(nonAsciiCharacters, '')
  const collapsedWhitespace = normalized.trim().replaceAll(/\s+/g, ' ')
  const sanitized = collapsedWhitespace.replaceAll(disallowedFilenameCharacters, '-').replaceAll(/\.\.+/g, '.')
  const safeName = sanitized.slice(0, 120).trim()

  return safeName === '' ? 'attachment' : safeName
}

export function buildAttachmentStorageKey(manifestationId: string, attachmentId: UniqueEntityId): string {
  return `manifestations/${manifestationId}/${attachmentId.toString()}`
}
