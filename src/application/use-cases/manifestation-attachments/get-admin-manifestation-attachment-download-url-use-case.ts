import type { ManifestationAttachmentsRepository } from '#src/application/repositories/manifestation-attachments-repository.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import type { AttachmentStorage } from '#src/application/storage/attachment-storage.js'
import { UserRole } from '#src/domain/entities/user.js'

import { AttachmentNotFoundError } from './errors/attachment-not-found-error.js'
import { ManifestationNotFoundError } from '../manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToManageManifestationError } from '../manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import type { UseCase } from '../use-case.js'

interface GetAdminManifestationAttachmentDownloadUrlInput {
  manifestationId: string
  attachmentId: string
  requesterUserId: string
}

interface GetAdminManifestationAttachmentDownloadUrlOutput {
  downloadUrl: string
}

export class GetAdminManifestationAttachmentDownloadUrlUseCase implements UseCase<
  GetAdminManifestationAttachmentDownloadUrlInput,
  GetAdminManifestationAttachmentDownloadUrlOutput
> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly manifestationsRepository: ManifestationsRepository,
    private readonly manifestationAttachmentsRepository: ManifestationAttachmentsRepository,
    private readonly attachmentStorage: AttachmentStorage,
    private readonly signedUrlExpiresInSeconds: number,
  ) {}

  async execute({
    manifestationId,
    attachmentId,
    requesterUserId,
  }: GetAdminManifestationAttachmentDownloadUrlInput): Promise<GetAdminManifestationAttachmentDownloadUrlOutput> {
    const requester = await this.usersRepository.findById(requesterUserId)

    if (requester === null || (requester.role !== UserRole.OMBUDSMAN && requester.role !== UserRole.ADMIN)) {
      throw new NotAllowedToManageManifestationError()
    }

    const manifestation = await this.manifestationsRepository.findById(manifestationId)

    if (manifestation === null) {
      throw new ManifestationNotFoundError()
    }

    const attachment = await this.manifestationAttachmentsRepository.findById(attachmentId)

    if (attachment === null || attachment.manifestationId.toString() !== manifestationId) {
      throw new AttachmentNotFoundError()
    }

    const downloadUrl = await this.attachmentStorage.createSignedDownloadUrl(
      attachment.storageKey,
      this.signedUrlExpiresInSeconds,
    )

    return { downloadUrl }
  }
}
