import { describe, expect, it } from 'vitest'

import {
  MAX_ATTACHMENT_SIZE_IN_BYTES,
  canUploadAttachments,
  getRemainingAttachmentSlots,
  validateAttachmentFiles,
} from './attachment-policy'
import type { ManifestationStatus } from './manifestation-status-contract'

function buildFile({ name = 'evidence.pdf', size = 1024, type = 'application/pdf' } = {}) {
  return new File(['x'.repeat(size)], name, { type })
}

describe('canUploadAttachments', () => {
  it.each<[ManifestationStatus, boolean]>([
    ['in_analysis', true],
    ['answered', true],
    ['finalized', false],
    ['canceled', false],
  ])('returns %s for status %s', (status, expected) => {
    expect(canUploadAttachments(status)).toBe(expected)
  })
})

describe('getRemainingAttachmentSlots', () => {
  it('returns the remaining slots bounded at zero', () => {
    expect(getRemainingAttachmentSlots(0)).toBe(5)
    expect(getRemainingAttachmentSlots(4)).toBe(1)
    expect(getRemainingAttachmentSlots(7)).toBe(0)
  })
})

describe('validateAttachmentFiles', () => {
  it('accepts supported files within the total limit', () => {
    expect(validateAttachmentFiles([buildFile({ type: 'image/png' })], 4)).toStrictEqual({ valid: true })
  })

  it('rejects when selected files exceed the total limit', () => {
    const result = validateAttachmentFiles([buildFile(), buildFile()], 4)
    expect(result).toMatchObject({ reason: 'too-many-files', valid: false })
  })

  it('rejects oversized files', () => {
    const result = validateAttachmentFiles([buildFile({ size: MAX_ATTACHMENT_SIZE_IN_BYTES + 1 })], 0)
    expect(result).toMatchObject({ reason: 'file-too-large', valid: false })
  })

  it('rejects unsupported mime types when present', () => {
    const result = validateAttachmentFiles([buildFile({ type: 'text/plain' })], 0)
    expect(result).toMatchObject({ reason: 'invalid-type', valid: false })
  })

  it('accepts empty file.type and lets the backend make the final decision', () => {
    expect(validateAttachmentFiles([buildFile({ type: '' })], 0)).toStrictEqual({ valid: true })
  })
})
