import { describe, expect, it } from 'vitest'

import {
  detectAttachmentMimeType,
  normalizeAttachmentMimeType,
  sanitizeAttachmentOriginalName,
} from '#src/application/attachments/attachment-policy.js'

import { createPdfBuffer } from '../../utils/attachment-fixtures.js'

describe('attachment-policy', () => {
  it('normalizes MIME types before persistence', () => {
    expect(normalizeAttachmentMimeType('  APPLICATION/PDF  ')).toBe('application/pdf')
  })

  it('detects MIME types from file signatures', async () => {
    await expect(detectAttachmentMimeType(createPdfBuffer())).resolves.toBe('application/pdf')
  })

  it('sanitizes dangerous filenames while keeping them readable', () => {
    expect(sanitizeAttachmentOriginalName('../../a<>b.pdf')).toBe('.-.-a--b.pdf')
  })

  it('removes control characters from filenames', () => {
    expect(sanitizeAttachmentOriginalName(`report\u0000\u001f.pdf`)).toBe('report.pdf')
  })
})
