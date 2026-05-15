import { describe, expect, it } from 'vitest'

import {
  ManifestationMessage,
  ManifestationMessageSenderConsistencyError,
  ManifestationMessageSenderType,
} from '#src/domain/entities/manifestation-message.js'
import { ManifestationMessageContent } from '#src/domain/value-objects/manifestation-message-content.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

describe('ManifestationMessage', () => {
  it('creates a message from an identified sender', () => {
    const message = ManifestationMessage.create({
      manifestationId: new UniqueEntityId('manifestation-1'),
      senderUserId: new UniqueEntityId('user-1'),
      senderType: ManifestationMessageSenderType.MANIFESTANT,
      content: ManifestationMessageContent.create('Can you share an update?'),
    })

    expect(message.manifestationId.toValue()).toBe('manifestation-1')
    expect(message.senderUserId?.toValue()).toBe('user-1')
    expect(message.senderType).toBe(ManifestationMessageSenderType.MANIFESTANT)
    expect(message.content.getValue()).toBe('Can you share an update?')
  })

  it('creates a message without sender user id for anonymous senders', () => {
    const message = ManifestationMessage.create({
      manifestationId: new UniqueEntityId('manifestation-1'),
      senderUserId: null,
      senderType: ManifestationMessageSenderType.ANONYMOUS_MANIFESTANT,
      content: ManifestationMessageContent.create('I have additional information.'),
    })

    expect(message.senderUserId).toBeNull()
    expect(message.senderType).toBe(ManifestationMessageSenderType.ANONYMOUS_MANIFESTANT)
  })

  it('rejects identified sender types without sender user id', () => {
    expect(() => {
      ManifestationMessage.create({
        manifestationId: new UniqueEntityId('manifestation-1'),
        senderUserId: null,
        senderType: ManifestationMessageSenderType.ADMIN,
        content: ManifestationMessageContent.create('Administrative response.'),
      })
    }).toThrow(ManifestationMessageSenderConsistencyError)
  })

  it('rejects anonymous sender types with sender user id', () => {
    expect(() => {
      ManifestationMessage.create({
        manifestationId: new UniqueEntityId('manifestation-1'),
        senderUserId: new UniqueEntityId('user-1'),
        senderType: ManifestationMessageSenderType.SYSTEM,
        content: ManifestationMessageContent.create('System event.'),
      })
    }).toThrow(ManifestationMessageSenderConsistencyError)
  })
})
