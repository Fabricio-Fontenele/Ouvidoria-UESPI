import { Entity } from './entity.js'
import type { ManifestationMessageContent } from '../value-objects/manifestation-message-content.js'
import type { UniqueEntityId } from '../value-objects/unique-entity-id.js'

export enum ManifestationMessageSenderType {
  MANIFESTANT = 'manifestant',
  ANONYMOUS_MANIFESTANT = 'anonymous_manifestant',
  OMBUDSMAN = 'ombudsman',
  ADMIN = 'admin',
  SYSTEM = 'system',
}

export class ManifestationMessageSenderConsistencyError extends Error {
  constructor(senderType: ManifestationMessageSenderType, hasSenderUserId: boolean) {
    const senderPresence = hasSenderUserId ? 'with sender user id' : 'without sender user id'

    super(`Cannot create manifestation message for sender type ${senderType} ${senderPresence}.`)
    this.name = 'ManifestationMessageSenderConsistencyError'
  }
}

interface ManifestationMessageProps {
  manifestationId: UniqueEntityId
  senderUserId: UniqueEntityId | null
  senderType: ManifestationMessageSenderType
  content: ManifestationMessageContent
  createdAt: Date
}

interface CreateManifestationMessageProps {
  manifestationId: UniqueEntityId
  senderUserId: UniqueEntityId | null
  senderType: ManifestationMessageSenderType
  content: ManifestationMessageContent
  createdAt?: Date
}

export class ManifestationMessage extends Entity<ManifestationMessageProps> {
  static create(props: CreateManifestationMessageProps, id?: UniqueEntityId): ManifestationMessage {
    const requiresSenderUserId =
      props.senderType === ManifestationMessageSenderType.MANIFESTANT ||
      props.senderType === ManifestationMessageSenderType.OMBUDSMAN ||
      props.senderType === ManifestationMessageSenderType.ADMIN

    const hasSenderUserId = props.senderUserId !== null

    if (requiresSenderUserId !== hasSenderUserId) {
      throw new ManifestationMessageSenderConsistencyError(props.senderType, hasSenderUserId)
    }

    return new ManifestationMessage(
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

  get senderUserId(): UniqueEntityId | null {
    return this.props.senderUserId
  }

  get senderType(): ManifestationMessageSenderType {
    return this.props.senderType
  }

  get content(): ManifestationMessageContent {
    return this.props.content
  }

  get createdAt(): Date {
    return this.props.createdAt
  }
}
