import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { HashComparer } from '#src/application/cryptography/hash-comparer.js'
import type { ManifestationAttachmentsRepository } from '#src/application/repositories/manifestation-attachments-repository.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { AttachmentStorage } from '#src/application/storage/attachment-storage.js'
import { ManifestationTrackingNotFoundError } from '#src/application/use-cases/anonymous-manifestation-access/errors/manifestation-tracking-not-found-error.js'
import { GetTrackedManifestationAttachmentDownloadUrlUseCase } from '#src/application/use-cases/manifestation-attachments/get-tracked-manifestation-attachment-download-url-use-case.js'
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

describe('GetTrackedManifestationAttachmentDownloadUrlUseCase', () => {
  let manifestationsRepository: DeepMockProxy<ManifestationsRepository>
  let manifestationAttachmentsRepository: DeepMockProxy<ManifestationAttachmentsRepository>
  let attachmentStorage: DeepMockProxy<AttachmentStorage>
  let hashComparer: DeepMockProxy<HashComparer>
  let sut: GetTrackedManifestationAttachmentDownloadUrlUseCase

  const buildAnonymousManifestation = (): Manifestation =>
    Manifestation.restore(
      {
        protocol: Protocol.create('OUV-2026-K7F9Q2'),
        type: ManifestationType.COMPLAINT,
        status: ManifestationStatus.IN_ANALYSIS,
        campusId: CampusId.create('campus-1'),
        administrativeUnitId: AdministrativeUnitId.create('unit-1'),
        description: ManifestationDescription.create('The service was unavailable during the whole morning.'),
        involvedPeople: null,
        authorUserId: null,
        attendantUserId: null,
        accessCodeHash: 'hashed-access-code',
        createdAt: new Date('2026-05-10T12:00:00.000Z'),
      },
      new UniqueEntityId('manifestation-1'),
    )

  const buildAttachment = (uploadedByType: ManifestationAttachmentUploadedByType): ManifestationAttachment =>
    ManifestationAttachment.create(
      {
        manifestationId: new UniqueEntityId('manifestation-1'),
        storageKey: 'manifestations/manifestation-1/attachment-1',
        originalName: 'evidence.pdf',
        mimeType: 'application/pdf',
        sizeInBytes: 1024,
        uploadedByType,
        uploadedByUserId: null,
        createdAt: new Date('2026-05-10T12:30:00.000Z'),
      },
      new UniqueEntityId('attachment-1'),
    )

  beforeEach(() => {
    manifestationsRepository = mockDeep<ManifestationsRepository>()
    manifestationAttachmentsRepository = mockDeep<ManifestationAttachmentsRepository>()
    attachmentStorage = mockDeep<AttachmentStorage>()
    hashComparer = mockDeep<HashComparer>()

    mockReset(manifestationsRepository)
    mockReset(manifestationAttachmentsRepository)
    mockReset(attachmentStorage)
    mockReset(hashComparer)

    sut = new GetTrackedManifestationAttachmentDownloadUrlUseCase(
      manifestationsRepository,
      hashComparer,
      manifestationAttachmentsRepository,
      attachmentStorage,
      300,
    )
  })

  it('returns a signed URL for public anonymous-visible attachments', async () => {
    manifestationsRepository.findByProtocol.mockResolvedValue(buildAnonymousManifestation())
    manifestationAttachmentsRepository.findById.mockResolvedValue(
      buildAttachment(ManifestationAttachmentUploadedByType.ANONYMOUS_MANIFESTANT),
    )
    hashComparer.compare.mockResolvedValue(true)
    attachmentStorage.createSignedDownloadUrl.mockResolvedValue('https://storage.test/download/1?expiresIn=300')

    await expect(
      sut.execute({
        attachmentId: 'attachment-1',
        protocol: 'OUV-2026-K7F9Q2',
        accessCode: 'plain-access-code',
      }),
    ).resolves.toStrictEqual({
      downloadUrl: 'https://storage.test/download/1?expiresIn=300',
    })
  })

  it('rejects internal administrative attachments from the anonymous tracking flow', async () => {
    manifestationsRepository.findByProtocol.mockResolvedValue(buildAnonymousManifestation())
    manifestationAttachmentsRepository.findById.mockResolvedValue(
      buildAttachment(ManifestationAttachmentUploadedByType.OMBUDSMAN),
    )
    hashComparer.compare.mockResolvedValue(true)

    await expect(
      sut.execute({
        attachmentId: 'attachment-1',
        protocol: 'OUV-2026-K7F9Q2',
        accessCode: 'plain-access-code',
      }),
    ).rejects.toBeInstanceOf(ManifestationTrackingNotFoundError)
  })
})
