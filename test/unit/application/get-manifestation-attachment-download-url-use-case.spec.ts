import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { ManifestationAttachmentsRepository } from '#src/application/repositories/manifestation-attachments-repository.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { AttachmentStorage } from '#src/application/storage/attachment-storage.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToAccessManifestationError } from '#src/application/use-cases/manifestation-access/errors/not-allowed-to-access-manifestation-error.js'
import { AttachmentNotFoundError } from '#src/application/use-cases/manifestation-attachments/errors/attachment-not-found-error.js'
import { GetManifestationAttachmentDownloadUrlUseCase } from '#src/application/use-cases/manifestation-attachments/get-manifestation-attachment-download-url-use-case.js'
import {
  ManifestationAttachment,
  ManifestationAttachmentUploadedByType,
} from '#src/domain/entities/manifestation-attachment.js'
import { Manifestation, ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import { AdministrativeUnitId } from '#src/domain/value-objects/administrative-unit-id.js'
import { CampusId } from '#src/domain/value-objects/campus-id.js'
import { ManifestationDescription } from '#src/domain/value-objects/manifestation-description.js'
import { Protocol } from '#src/domain/value-objects/protocol.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

describe('GetManifestationAttachmentDownloadUrlUseCase', () => {
  let manifestationsRepository: DeepMockProxy<ManifestationsRepository>
  let manifestationAttachmentsRepository: DeepMockProxy<ManifestationAttachmentsRepository>
  let attachmentStorage: DeepMockProxy<AttachmentStorage>
  let sut: GetManifestationAttachmentDownloadUrlUseCase

  const buildManifestation = (authorUserId = 'user-1'): Manifestation =>
    Manifestation.restore(
      {
        protocol: Protocol.create('OUV-2026-K7F9Q2'),
        type: ManifestationType.COMPLAINT,
        status: ManifestationStatus.IN_ANALYSIS,
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

  const buildAttachment = (manifestationId = 'manifestation-1'): ManifestationAttachment =>
    ManifestationAttachment.create(
      {
        manifestationId: new UniqueEntityId(manifestationId),
        storageKey: `manifestations/${manifestationId}/attachment-1`,
        originalName: 'evidence.pdf',
        mimeType: 'application/pdf',
        sizeInBytes: 1024,
        uploadedByType: ManifestationAttachmentUploadedByType.MANIFESTANT,
        uploadedByUserId: new UniqueEntityId('user-1'),
        createdAt: new Date('2026-05-10T12:30:00.000Z'),
      },
      new UniqueEntityId('attachment-1'),
    )

  beforeEach(() => {
    manifestationsRepository = mockDeep<ManifestationsRepository>()
    manifestationAttachmentsRepository = mockDeep<ManifestationAttachmentsRepository>()
    attachmentStorage = mockDeep<AttachmentStorage>()

    mockReset(manifestationsRepository)
    mockReset(manifestationAttachmentsRepository)
    mockReset(attachmentStorage)

    sut = new GetManifestationAttachmentDownloadUrlUseCase(
      manifestationsRepository,
      manifestationAttachmentsRepository,
      attachmentStorage,
      300,
    )
  })

  it('returns a signed URL when the requester owns the manifestation attachment', async () => {
    manifestationsRepository.findById.mockResolvedValue(buildManifestation())
    manifestationAttachmentsRepository.findById.mockResolvedValue(buildAttachment())
    attachmentStorage.createSignedDownloadUrl.mockResolvedValue('https://storage.test/download/1?expiresIn=300')

    await expect(
      sut.execute({
        manifestationId: 'manifestation-1',
        attachmentId: 'attachment-1',
        requesterUserId: 'user-1',
      }),
    ).resolves.toStrictEqual({
      downloadUrl: 'https://storage.test/download/1?expiresIn=300',
    })
  })

  it('throws when the manifestation does not exist', async () => {
    manifestationsRepository.findById.mockResolvedValue(null)

    await expect(
      sut.execute({
        manifestationId: 'missing-manifestation',
        attachmentId: 'attachment-1',
        requesterUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(ManifestationNotFoundError)

    expect(manifestationAttachmentsRepository.findById.mock.calls).toHaveLength(0)
  })

  it('throws when the requester does not own the manifestation', async () => {
    manifestationsRepository.findById.mockResolvedValue(buildManifestation('user-2'))

    await expect(
      sut.execute({
        manifestationId: 'manifestation-1',
        attachmentId: 'attachment-1',
        requesterUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(NotAllowedToAccessManifestationError)

    expect(manifestationAttachmentsRepository.findById.mock.calls).toHaveLength(0)
  })

  it('throws when the attachment does not exist', async () => {
    manifestationsRepository.findById.mockResolvedValue(buildManifestation())
    manifestationAttachmentsRepository.findById.mockResolvedValue(null)

    await expect(
      sut.execute({
        manifestationId: 'manifestation-1',
        attachmentId: 'missing-attachment',
        requesterUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(AttachmentNotFoundError)
  })

  it('throws when the attachment belongs to another manifestation', async () => {
    manifestationsRepository.findById.mockResolvedValue(buildManifestation())
    manifestationAttachmentsRepository.findById.mockResolvedValue(buildAttachment('manifestation-2'))

    await expect(
      sut.execute({
        manifestationId: 'manifestation-1',
        attachmentId: 'attachment-1',
        requesterUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(AttachmentNotFoundError)
  })
})
