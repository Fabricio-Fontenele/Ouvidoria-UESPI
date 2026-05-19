import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { HashComparer } from '#src/application/cryptography/hash-comparer.js'
import type { ManifestationAttachmentsRepository } from '#src/application/repositories/manifestation-attachments-repository.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { AttachmentStorage } from '#src/application/storage/attachment-storage.js'
import { ManifestationTrackingNotFoundError } from '#src/application/use-cases/anonymous-manifestation-access/errors/manifestation-tracking-not-found-error.js'
import { UploadAnonymousManifestationAttachmentUseCase } from '#src/application/use-cases/manifestation-attachments/upload-anonymous-manifestation-attachment-use-case.js'
import { Manifestation, ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import { AdministrativeUnitId } from '#src/domain/value-objects/administrative-unit-id.js'
import { CampusId } from '#src/domain/value-objects/campus-id.js'
import { ManifestationDescription } from '#src/domain/value-objects/manifestation-description.js'
import { Protocol } from '#src/domain/value-objects/protocol.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

import { createPngBuffer } from '../../utils/attachment-fixtures.js'

describe('UploadAnonymousManifestationAttachmentUseCase', () => {
  let manifestationsRepository: DeepMockProxy<ManifestationsRepository>
  let manifestationAttachmentsRepository: DeepMockProxy<ManifestationAttachmentsRepository>
  let attachmentStorage: DeepMockProxy<AttachmentStorage>
  let hashComparer: DeepMockProxy<HashComparer>
  let sut: UploadAnonymousManifestationAttachmentUseCase

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

  const file = {
    originalName: 'evidence.png',
    mimeType: 'image/png',
    sizeInBytes: 512,
    content: createPngBuffer(),
  }

  beforeEach(() => {
    manifestationsRepository = mockDeep<ManifestationsRepository>()
    manifestationAttachmentsRepository = mockDeep<ManifestationAttachmentsRepository>()
    attachmentStorage = mockDeep<AttachmentStorage>()
    hashComparer = mockDeep<HashComparer>()

    mockReset(manifestationsRepository)
    mockReset(manifestationAttachmentsRepository)
    mockReset(attachmentStorage)
    mockReset(hashComparer)

    sut = new UploadAnonymousManifestationAttachmentUseCase(
      manifestationsRepository,
      hashComparer,
      manifestationAttachmentsRepository,
      attachmentStorage,
    )
  })

  it('uploads and persists an anonymous manifestant attachment', async () => {
    manifestationsRepository.findByProtocol.mockResolvedValue(buildAnonymousManifestation())
    hashComparer.compare.mockResolvedValue(true)
    manifestationAttachmentsRepository.countByManifestationId.mockResolvedValue(0)

    const result = await sut.execute({
      protocol: '  OUV-2026-K7F9Q2  ',
      accessCode: '  plain-access-code  ',
      file,
    })

    expect(manifestationsRepository.findByProtocol.mock.calls).toStrictEqual([['OUV-2026-K7F9Q2']])
    expect(hashComparer.compare.mock.calls).toStrictEqual([['plain-access-code', 'hashed-access-code']])
    expect(result.attachment.uploadedByType).toBe('anonymous_manifestant')
  })

  it('throws the generic anonymous tracking error when the credentials are invalid', async () => {
    manifestationsRepository.findByProtocol.mockResolvedValue(buildAnonymousManifestation())
    hashComparer.compare.mockResolvedValue(false)

    await expect(
      sut.execute({
        protocol: 'OUV-2026-K7F9Q2',
        accessCode: 'wrong-code',
        file,
      }),
    ).rejects.toBeInstanceOf(ManifestationTrackingNotFoundError)

    expect(attachmentStorage.upload.mock.calls).toHaveLength(0)
  })
})
