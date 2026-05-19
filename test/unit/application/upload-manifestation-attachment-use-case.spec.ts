import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import { MAX_ATTACHMENTS_PER_MANIFESTATION } from '#src/application/attachments/attachment-policy.js'
import type { ManifestationAttachmentsRepository } from '#src/application/repositories/manifestation-attachments-repository.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { AttachmentStorage } from '#src/application/storage/attachment-storage.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToAccessManifestationError } from '#src/application/use-cases/manifestation-access/errors/not-allowed-to-access-manifestation-error.js'
import { ManifestationAttachmentsLimitExceededError } from '#src/application/use-cases/manifestation-attachments/errors/manifestation-attachments-limit-exceeded-error.js'
import { ManifestationCannotReceiveAttachmentsError } from '#src/application/use-cases/manifestation-attachments/errors/manifestation-cannot-receive-attachments-error.js'
import { UploadManifestationAttachmentUseCase } from '#src/application/use-cases/manifestation-attachments/upload-manifestation-attachment-use-case.js'
import { Manifestation, ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import { AdministrativeUnitId } from '#src/domain/value-objects/administrative-unit-id.js'
import { CampusId } from '#src/domain/value-objects/campus-id.js'
import { ManifestationDescription } from '#src/domain/value-objects/manifestation-description.js'
import { Protocol } from '#src/domain/value-objects/protocol.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

import { createOversizedPdfBuffer, createPdfBuffer } from '../../utils/attachment-fixtures.js'

describe('UploadManifestationAttachmentUseCase', () => {
  let manifestationsRepository: DeepMockProxy<ManifestationsRepository>
  let manifestationAttachmentsRepository: DeepMockProxy<ManifestationAttachmentsRepository>
  let attachmentStorage: DeepMockProxy<AttachmentStorage>
  let sut: UploadManifestationAttachmentUseCase

  const buildManifestation = ({
    authorUserId = 'user-1',
    status = ManifestationStatus.IN_ANALYSIS,
  }: {
    authorUserId?: string
    status?: ManifestationStatus
  } = {}): Manifestation =>
    Manifestation.restore(
      {
        protocol: Protocol.create('OUV-2026-K7F9Q2'),
        type: ManifestationType.COMPLAINT,
        status,
        campusId: CampusId.create('campus-1'),
        administrativeUnitId: AdministrativeUnitId.create('unit-1'),
        description: ManifestationDescription.create('The service was unavailable during the whole morning.'),
        involvedPeople: null,
        authorUserId: new UniqueEntityId(authorUserId),
        attendantUserId: null,
        accessCodeHash: null,
        createdAt: new Date('2026-05-10T12:00:00.000Z'),
      },
      new UniqueEntityId('manifestation-1'),
    )

  const file = {
    originalName: 'evidence.pdf',
    mimeType: 'application/pdf',
    sizeInBytes: 1024,
    content: createPdfBuffer(),
  }

  beforeEach(() => {
    manifestationsRepository = mockDeep<ManifestationsRepository>()
    manifestationAttachmentsRepository = mockDeep<ManifestationAttachmentsRepository>()
    attachmentStorage = mockDeep<AttachmentStorage>()

    mockReset(manifestationsRepository)
    mockReset(manifestationAttachmentsRepository)
    mockReset(attachmentStorage)

    sut = new UploadManifestationAttachmentUseCase(
      manifestationsRepository,
      manifestationAttachmentsRepository,
      attachmentStorage,
    )
  })

  it('uploads and persists a manifestant attachment', async () => {
    manifestationsRepository.findById.mockResolvedValue(buildManifestation())
    manifestationAttachmentsRepository.countByManifestationId.mockResolvedValue(0)

    const result = await sut.execute({
      manifestationId: 'manifestation-1',
      requesterUserId: 'user-1',
      file,
    })

    expect(manifestationsRepository.findById.mock.calls).toStrictEqual([['manifestation-1']])
    expect(manifestationAttachmentsRepository.countByManifestationId.mock.calls).toStrictEqual([['manifestation-1']])
    expect(attachmentStorage.upload.mock.calls).toHaveLength(1)
    expect(manifestationAttachmentsRepository.save.mock.calls).toHaveLength(1)
    expect(result.attachment.originalName).toBe('evidence.pdf')
    expect(result.attachment.mimeType).toBe('application/pdf')
    expect(result.attachment.uploadedByType).toBe('manifestant')
    expect(attachmentStorage.upload.mock.calls[0]?.[0].mimeType).toBe('application/pdf')
  })

  it('throws when the manifestation does not exist', async () => {
    manifestationsRepository.findById.mockResolvedValue(null)

    await expect(
      sut.execute({
        manifestationId: 'missing-manifestation',
        requesterUserId: 'user-1',
        file,
      }),
    ).rejects.toBeInstanceOf(ManifestationNotFoundError)

    expect(attachmentStorage.upload.mock.calls).toHaveLength(0)
  })

  it('throws when the requester does not own the manifestation', async () => {
    manifestationsRepository.findById.mockResolvedValue(buildManifestation({ authorUserId: 'user-2' }))

    await expect(
      sut.execute({
        manifestationId: 'manifestation-1',
        requesterUserId: 'user-1',
        file,
      }),
    ).rejects.toBeInstanceOf(NotAllowedToAccessManifestationError)
  })

  it('throws when the manifestation is in a terminal state', async () => {
    manifestationsRepository.findById.mockResolvedValue(buildManifestation({ status: ManifestationStatus.CANCELED }))

    await expect(
      sut.execute({
        manifestationId: 'manifestation-1',
        requesterUserId: 'user-1',
        file,
      }),
    ).rejects.toBeInstanceOf(ManifestationCannotReceiveAttachmentsError)
  })

  it('throws when the manifestation already reached the attachments limit', async () => {
    manifestationsRepository.findById.mockResolvedValue(buildManifestation())
    manifestationAttachmentsRepository.countByManifestationId.mockResolvedValue(MAX_ATTACHMENTS_PER_MANIFESTATION)

    await expect(
      sut.execute({
        manifestationId: 'manifestation-1',
        requesterUserId: 'user-1',
        file,
      }),
    ).rejects.toBeInstanceOf(ManifestationAttachmentsLimitExceededError)

    expect(attachmentStorage.upload.mock.calls).toHaveLength(0)
  })

  it('does not persist metadata when storage upload fails', async () => {
    const storageError = new Error('storage failed')

    manifestationsRepository.findById.mockResolvedValue(buildManifestation())
    manifestationAttachmentsRepository.countByManifestationId.mockResolvedValue(0)
    attachmentStorage.upload.mockRejectedValue(storageError)

    await expect(
      sut.execute({
        manifestationId: 'manifestation-1',
        requesterUserId: 'user-1',
        file,
      }),
    ).rejects.toThrow(storageError)

    expect(manifestationAttachmentsRepository.save.mock.calls).toHaveLength(0)
  })

  it('tries to compensate in storage when database persistence fails', async () => {
    const databaseError = new Error('database failed')

    manifestationsRepository.findById.mockResolvedValue(buildManifestation())
    manifestationAttachmentsRepository.countByManifestationId.mockResolvedValue(0)
    manifestationAttachmentsRepository.save.mockRejectedValue(databaseError)

    await expect(
      sut.execute({
        manifestationId: 'manifestation-1',
        requesterUserId: 'user-1',
        file,
      }),
    ).rejects.toThrow(databaseError)

    const uploadedStorageKey = attachmentStorage.upload.mock.calls[0]?.[0].storageKey
    expect(attachmentStorage.delete.mock.calls).toStrictEqual([[uploadedStorageKey]])
  })

  it('rejects files with a MIME type outside the allow-list', async () => {
    await expect(
      sut.execute({
        manifestationId: 'manifestation-1',
        requesterUserId: 'user-1',
        file: {
          ...file,
          mimeType: 'text/plain',
          content: Buffer.from('hello world'),
          sizeInBytes: 11,
        },
      }),
    ).rejects.toMatchObject({ name: 'AttachmentMimeTypeNotAllowedError' })
  })

  it('rejects files with spoofed MIME type', async () => {
    await expect(
      sut.execute({
        manifestationId: 'manifestation-1',
        requesterUserId: 'user-1',
        file: {
          ...file,
          mimeType: 'image/png',
        },
      }),
    ).rejects.toMatchObject({ name: 'AttachmentMimeTypeNotAllowedError' })
  })

  it('rejects empty files', async () => {
    await expect(
      sut.execute({
        manifestationId: 'manifestation-1',
        requesterUserId: 'user-1',
        file: {
          ...file,
          sizeInBytes: 0,
          content: Buffer.alloc(0),
        },
      }),
    ).rejects.toMatchObject({ name: 'AttachmentFileEmptyError' })
  })

  it('rejects files above the maximum allowed size', async () => {
    await expect(
      sut.execute({
        manifestationId: 'manifestation-1',
        requesterUserId: 'user-1',
        file: {
          ...file,
          sizeInBytes: createOversizedPdfBuffer().byteLength,
          content: createOversizedPdfBuffer(),
        },
      }),
    ).rejects.toMatchObject({ name: 'AttachmentFileTooLargeError' })
  })

  it('persists the normalized MIME type instead of the raw multipart value', async () => {
    manifestationsRepository.findById.mockResolvedValue(buildManifestation())
    manifestationAttachmentsRepository.countByManifestationId.mockResolvedValue(0)

    await sut.execute({
      manifestationId: 'manifestation-1',
      requesterUserId: 'user-1',
      file: {
        ...file,
        mimeType: '  APPLICATION/PDF  ',
      },
    })

    expect(attachmentStorage.upload.mock.calls[0]?.[0].mimeType).toBe('application/pdf')
  })
})
