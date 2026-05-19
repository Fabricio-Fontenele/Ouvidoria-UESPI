import { describe, expect, it } from 'vitest'

import { ManifestationTrackingNotFoundError as AnonymousManifestationTrackingNotFoundError } from '#src/application/use-cases/anonymous-manifestation-access/errors/manifestation-tracking-not-found-error.js'
import { AttachmentFileTooLargeError } from '#src/application/use-cases/manifestation-attachments/errors/attachment-file-too-large-error.js'
import { AttachmentNotFoundError } from '#src/application/use-cases/manifestation-attachments/errors/attachment-not-found-error.js'
import { ManifestationTrackingNotFoundError } from '#src/application/use-cases/track-manifestation-by-protocol/errors/manifestation-tracking-not-found-error.js'

describe('manifestation attachment errors', () => {
  it('creates attachment-specific errors with stable names and messages', () => {
    const tooLargeError = new AttachmentFileTooLargeError()
    const notFoundError = new AttachmentNotFoundError()

    expect(tooLargeError.name).toBe('AttachmentFileTooLargeError')
    expect(tooLargeError.message).toBe('Attachment file exceeds the maximum allowed size.')
    expect(notFoundError.name).toBe('AttachmentNotFoundError')
    expect(notFoundError.message).toBe('Attachment not found.')
  })

  it('re-exports the anonymous tracking error from the protocol tracking path', () => {
    const error = new ManifestationTrackingNotFoundError()

    expect(ManifestationTrackingNotFoundError).toBe(AnonymousManifestationTrackingNotFoundError)
    expect(error.name).toBe('ManifestationTrackingNotFoundError')
    expect(error.message).toBe('Manifestation tracking not found.')
  })
})
