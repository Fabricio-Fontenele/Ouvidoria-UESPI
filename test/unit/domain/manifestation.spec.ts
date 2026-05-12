import { describe, expect, it } from 'vitest'

import { Manifestation, ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import { AdministrativeUnitId } from '#src/domain/value-objects/administrative-unit-id.js'
import { CampusId } from '#src/domain/value-objects/campus-id.js'
import { ManifestationDescription } from '#src/domain/value-objects/manifestation-description.js'
import { Protocol } from '#src/domain/value-objects/protocol.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

describe('Manifestation', () => {
  const buildManifestation = ({
    status = ManifestationStatus.IN_ANALYSIS,
    authorUserId = new UniqueEntityId('user-1'),
  }: {
    status?: ManifestationStatus
    authorUserId?: UniqueEntityId | null
  } = {}) =>
    Manifestation.restore(
      {
        protocol: Protocol.create('2026-0001'),
        type: ManifestationType.COMPLAINT,
        status,
        campusId: CampusId.create('campus-1'),
        administrativeUnitId: AdministrativeUnitId.create('unit-1'),
        description: ManifestationDescription.create('The service was unavailable during the whole morning.'),
        authorUserId,
        createdAt: new Date('2026-05-10T12:00:00.000Z'),
      },
      new UniqueEntityId('manifestation-1'),
    )

  it('allows messages while the manifestation is open for interaction', () => {
    expect(buildManifestation({ status: ManifestationStatus.IN_ANALYSIS }).canReceiveMessages()).toBe(true)
    expect(buildManifestation({ status: ManifestationStatus.ANSWERED }).canReceiveMessages()).toBe(true)
  })

  it('blocks messages when the manifestation is closed for interaction', () => {
    expect(buildManifestation({ status: ManifestationStatus.CANCELED }).canReceiveMessages()).toBe(false)
    expect(buildManifestation({ status: ManifestationStatus.FINALIZED }).canReceiveMessages()).toBe(false)
  })

  it('detects anonymous manifestations', () => {
    expect(buildManifestation({ authorUserId: null }).isAnonymous()).toBe(true)
    expect(buildManifestation().isAnonymous()).toBe(false)
  })

  it('checks ownership by unique entity id', () => {
    const manifestation = buildManifestation({ authorUserId: new UniqueEntityId('user-1') })

    expect(manifestation.belongsTo(new UniqueEntityId('user-1'))).toBe(true)
    expect(manifestation.belongsTo(new UniqueEntityId('user-2'))).toBe(false)
    expect(buildManifestation({ authorUserId: null }).belongsTo(new UniqueEntityId('user-1'))).toBe(false)
  })
})
