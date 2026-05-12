import { Entity } from './entity.js'
import type { ManifestationMessageContent } from '../value-objects/manifestation-message-content.js'
import type { UniqueEntityId } from '../value-objects/unique-entity-id.js'

interface ManifestationMessageProps {
  manifestationId: UniqueEntityId
  senderUserId: UniqueEntityId
  content: ManifestationMessageContent
  createdAt: Date
}

interface CreateManifestationMessageProps {
  manifestationId: UniqueEntityId
  senderUserId: UniqueEntityId
  content: ManifestationMessageContent
  createdAt?: Date
}

export class ManifestationMessage extends Entity<ManifestationMessageProps> {
  static create(props: CreateManifestationMessageProps, id?: UniqueEntityId): ManifestationMessage {
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

  get senderUserId(): UniqueEntityId {
    return this.props.senderUserId
  }

  get content(): ManifestationMessageContent {
    return this.props.content
  }

  get createdAt(): Date {
    return this.props.createdAt
  }
}
