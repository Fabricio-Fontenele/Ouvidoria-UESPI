import { Entity } from './entity.js'
import type { UniqueEntityId } from '../value-objects/unique-entity-id.js'

export enum ManifestationAttachmentUploadedByType {
  MANIFESTANT = 'MANIFESTANT',
  ANONYMOUS_MANIFESTANT = 'ANONYMOUS_MANIFESTANT',
  OMBUDSMAN = 'OMBUDSMAN',
  ADMIN = 'ADMIN',
}

interface ManifestationAttachmentProps {
  manifestationId: UniqueEntityId
  storageKey: string
  originalName: string
  mimeType: string
  sizeInBytes: number
  uploadedByType: ManifestationAttachmentUploadedByType
  uploadedByUserId: UniqueEntityId | null
  createdAt: Date
}

interface CreateManifestationAttachmentProps {
  manifestationId: UniqueEntityId
  storageKey: string
  originalName: string
  mimeType: string
  sizeInBytes: number
  uploadedByType: ManifestationAttachmentUploadedByType
  uploadedByUserId: UniqueEntityId | null
  createdAt?: Date
}

export class ManifestationAttachment extends Entity<ManifestationAttachmentProps> {
  static create(props: CreateManifestationAttachmentProps, id?: UniqueEntityId): ManifestationAttachment {
    return new ManifestationAttachment(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
  }

  get manifestationId(): UniqueEntityId {
    return this.props.manifestationId
  }

  get storageKey(): string {
    return this.props.storageKey
  }

  get originalName(): string {
    return this.props.originalName
  }

  get mimeType(): string {
    return this.props.mimeType
  }

  get sizeInBytes(): number {
    return this.props.sizeInBytes
  }

  get uploadedByType(): ManifestationAttachmentUploadedByType {
    return this.props.uploadedByType
  }

  get uploadedByUserId(): UniqueEntityId | null {
    return this.props.uploadedByUserId
  }

  get createdAt(): Date {
    return this.props.createdAt
  }
}
