import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { ManifestationAttachmentsRepository } from '#src/application/repositories/manifestation-attachments-repository.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import type { AttachmentStorage } from '#src/application/storage/attachment-storage.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToManageManifestationError } from '#src/application/use-cases/manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import { AttachmentNotFoundError } from '#src/application/use-cases/manifestation-attachments/errors/attachment-not-found-error.js'
import { GetAdminManifestationAttachmentDownloadUrlUseCase } from '#src/application/use-cases/manifestation-attachments/get-admin-manifestation-attachment-download-url-use-case.js'
import {
  ManifestationAttachment,
  ManifestationAttachmentUploadedByType,
} from '#src/domain/entities/manifestation-attachment.js'
import { Manifestation, ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import { User, UserRole } from '#src/domain/entities/user.js'
import { AdministrativeUnitId } from '#src/domain/value-objects/administrative-unit-id.js'
import { CampusId } from '#src/domain/value-objects/campus-id.js'
import { Email } from '#src/domain/value-objects/email.js'
import { ManifestationDescription } from '#src/domain/value-objects/manifestation-description.js'
import { Name } from '#src/domain/value-objects/name.js'
import { Protocol } from '#src/domain/value-objects/protocol.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

describe('GetAdminManifestationAttachmentDownloadUrlUseCase', () => {
  let usersRepository: DeepMockProxy<UsersRepository>
  let manifestationsRepository: DeepMockProxy<ManifestationsRepository>
  let manifestationAttachmentsRepository: DeepMockProxy<ManifestationAttachmentsRepository>
  let attachmentStorage: DeepMockProxy<AttachmentStorage>
  let sut: GetAdminManifestationAttachmentDownloadUrlUseCase

  const buildRequester = (role: UserRole, id = 'ombudsman-1'): User =>
    User.create(
      {
        name: Name.create('Administrative User'),
        email: Email.create('admin@example.com'),
        passwordHash: 'hashed-password',
        role,
        createdAt: new Date('2026-05-10T10:00:00.000Z'),
      },
      new UniqueEntityId(id),
    )

  const buildManifestation = (): Manifestation =>
    Manifestation.restore(
      {
        protocol: Protocol.create('OUV-2026-K7F9Q2'),
        type: ManifestationType.COMPLAINT,
        status: ManifestationStatus.IN_ANALYSIS,
        campusId: CampusId.create('campus-1'),
        administrativeUnitId: AdministrativeUnitId.create('unit-1'),
        description: ManifestationDescription.create('The service was unavailable during the whole morning.'),
        involvedPeople: null,
        authorUserId: new UniqueEntityId('user-1'),
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
    usersRepository = mockDeep<UsersRepository>()
    manifestationsRepository = mockDeep<ManifestationsRepository>()
    manifestationAttachmentsRepository = mockDeep<ManifestationAttachmentsRepository>()
    attachmentStorage = mockDeep<AttachmentStorage>()

    mockReset(usersRepository)
    mockReset(manifestationsRepository)
    mockReset(manifestationAttachmentsRepository)
    mockReset(attachmentStorage)

    sut = new GetAdminManifestationAttachmentDownloadUrlUseCase(
      usersRepository,
      manifestationsRepository,
      manifestationAttachmentsRepository,
      attachmentStorage,
      300,
    )
  })

  it('returns a signed URL for administrative requesters', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.OMBUDSMAN))
    manifestationsRepository.findById.mockResolvedValue(buildManifestation())
    manifestationAttachmentsRepository.findById.mockResolvedValue(buildAttachment())
    attachmentStorage.createSignedDownloadUrl.mockResolvedValue('https://storage.test/download/1?expiresIn=300')

    await expect(
      sut.execute({
        requesterUserId: 'ombudsman-1',
        manifestationId: 'manifestation-1',
        attachmentId: 'attachment-1',
      }),
    ).resolves.toStrictEqual({
      downloadUrl: 'https://storage.test/download/1?expiresIn=300',
    })
  })

  it('rejects missing administrative users', async () => {
    usersRepository.findById.mockResolvedValue(null)

    await expect(
      sut.execute({
        requesterUserId: 'missing-user',
        manifestationId: 'manifestation-1',
        attachmentId: 'attachment-1',
      }),
    ).rejects.toBeInstanceOf(NotAllowedToManageManifestationError)

    expect(manifestationsRepository.findById.mock.calls).toHaveLength(0)
  })

  it('rejects requesters without administrative role', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.MANIFESTANT, 'user-1'))

    await expect(
      sut.execute({
        requesterUserId: 'user-1',
        manifestationId: 'manifestation-1',
        attachmentId: 'attachment-1',
      }),
    ).rejects.toBeInstanceOf(NotAllowedToManageManifestationError)

    expect(manifestationsRepository.findById.mock.calls).toHaveLength(0)
  })

  it('throws when the manifestation does not exist', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.ADMIN, 'admin-1'))
    manifestationsRepository.findById.mockResolvedValue(null)

    await expect(
      sut.execute({
        requesterUserId: 'admin-1',
        manifestationId: 'missing-manifestation',
        attachmentId: 'attachment-1',
      }),
    ).rejects.toBeInstanceOf(ManifestationNotFoundError)

    expect(manifestationAttachmentsRepository.findById.mock.calls).toHaveLength(0)
  })

  it('throws when the attachment does not exist', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.ADMIN, 'admin-1'))
    manifestationsRepository.findById.mockResolvedValue(buildManifestation())
    manifestationAttachmentsRepository.findById.mockResolvedValue(null)

    await expect(
      sut.execute({
        requesterUserId: 'admin-1',
        manifestationId: 'manifestation-1',
        attachmentId: 'missing-attachment',
      }),
    ).rejects.toBeInstanceOf(AttachmentNotFoundError)
  })

  it('throws when the attachment belongs to another manifestation', async () => {
    usersRepository.findById.mockResolvedValue(buildRequester(UserRole.ADMIN, 'admin-1'))
    manifestationsRepository.findById.mockResolvedValue(buildManifestation())
    manifestationAttachmentsRepository.findById.mockResolvedValue(buildAttachment('manifestation-2'))

    await expect(
      sut.execute({
        requesterUserId: 'admin-1',
        manifestationId: 'manifestation-1',
        attachmentId: 'attachment-1',
      }),
    ).rejects.toBeInstanceOf(AttachmentNotFoundError)
  })
})
