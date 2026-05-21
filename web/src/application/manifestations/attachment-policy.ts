import type { ManifestationStatus } from './manifestation-status-contract'

export const MAX_ATTACHMENTS_PER_MANIFESTATION = 5
export const MAX_ATTACHMENT_SIZE_IN_BYTES = 10 * 1024 * 1024
export const ACCEPTED_ATTACHMENT_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const

export const ACCEPTED_ATTACHMENT_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'] as const
export const ACCEPTED_ATTACHMENT_INPUT_ACCEPT = ACCEPTED_ATTACHMENT_EXTENSIONS.join(',')

export type AcceptedAttachmentMimeType = (typeof ACCEPTED_ATTACHMENT_MIME_TYPES)[number]

export type AttachmentValidationResult =
  | { valid: true }
  | {
      message: string
      reason: 'file-too-large' | 'invalid-type' | 'too-many-files'
      valid: false
    }

export function canUploadAttachments(status: ManifestationStatus): boolean {
  return status !== 'canceled' && status !== 'finalized'
}

export function getRemainingAttachmentSlots(currentCount: number): number {
  return Math.max(0, MAX_ATTACHMENTS_PER_MANIFESTATION - currentCount)
}

function hasAcceptedMimeType(file: File): boolean {
  if (file.type === '') {
    return true
  }

  return ACCEPTED_ATTACHMENT_MIME_TYPES.includes(file.type as AcceptedAttachmentMimeType)
}

export function validateAttachmentFiles(files: File[], currentCount: number): AttachmentValidationResult {
  if (currentCount + files.length > MAX_ATTACHMENTS_PER_MANIFESTATION) {
    return {
      message: `Anexe no máximo ${MAX_ATTACHMENTS_PER_MANIFESTATION} arquivos por manifestação.`,
      reason: 'too-many-files',
      valid: false,
    }
  }

  if (files.some((file) => file.size > MAX_ATTACHMENT_SIZE_IN_BYTES)) {
    return {
      message: 'Cada arquivo deve ter até 10 MB.',
      reason: 'file-too-large',
      valid: false,
    }
  }

  if (!files.every(hasAcceptedMimeType)) {
    return {
      message: 'Anexe apenas arquivos PDF, JPG, PNG ou WEBP.',
      reason: 'invalid-type',
      valid: false,
    }
  }

  return { valid: true }
}
