import { describe, expect, it } from 'vitest'

import {
  AnonymousManifestationRequiresAccessCodeError,
  IdentifiedManifestationCannotHaveAccessCodeError,
  Manifestation,
  ManifestationStatus,
  ManifestationStatusTransitionNotAllowedError,
  ManifestationType,
} from '#src/domain/entities/manifestation.js'
import { AdministrativeUnitId } from '#src/domain/value-objects/administrative-unit-id.js'
import { CampusId } from '#src/domain/value-objects/campus-id.js'
import { ManifestationDescription } from '#src/domain/value-objects/manifestation-description.js'
import { Protocol } from '#src/domain/value-objects/protocol.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

describe('Manifestation', () => {
  const buildManifestation = ({
    status = ManifestationStatus.IN_ANALYSIS,
    authorUserId = new UniqueEntityId('user-1'),
    accessCodeHash,
  }: {
    status?: ManifestationStatus
    authorUserId?: UniqueEntityId | null
    accessCodeHash?: string | null
  } = {}) => {
    const normalizedAccessCodeHash =
      accessCodeHash === undefined ? (authorUserId === null ? 'hashed-access-code' : null) : accessCodeHash

    return Manifestation.restore(
      {
        protocol: Protocol.create('2026-0001'),
        type: ManifestationType.COMPLAINT,
        status,
        campusId: CampusId.create('campus-1'),
        administrativeUnitId: AdministrativeUnitId.create('unit-1'),
        description: ManifestationDescription.create('The service was unavailable during the whole morning.'),
        involvedPeople: null,
        authorUserId,
        accessCodeHash: normalizedAccessCodeHash,
        createdAt: new Date('2026-05-10T12:00:00.000Z'),
      },
      new UniqueEntityId('manifestation-1'),
    )
  }

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

  it('records an administrative answer by transitioning open manifestations to answered', () => {
    const manifestation = buildManifestation({ status: ManifestationStatus.IN_ANALYSIS })

    manifestation.recordAdministrativeAnswer()

    expect(manifestation.status).toBe(ManifestationStatus.ANSWERED)
  })

  it('keeps answered manifestations as answered when receiving a new administrative answer', () => {
    const manifestation = buildManifestation({ status: ManifestationStatus.ANSWERED })

    manifestation.recordAdministrativeAnswer()

    expect(manifestation.status).toBe(ManifestationStatus.ANSWERED)
  })

  it('refuses administrative answers on terminal manifestations', () => {
    const finalized = buildManifestation({ status: ManifestationStatus.FINALIZED })
    const canceled = buildManifestation({ status: ManifestationStatus.CANCELED })

    expect(() => {
      finalized.recordAdministrativeAnswer()
    }).toThrow(ManifestationStatusTransitionNotAllowedError)
    expect(() => {
      canceled.recordAdministrativeAnswer()
    }).toThrow(ManifestationStatusTransitionNotAllowedError)
    expect(finalized.status).toBe(ManifestationStatus.FINALIZED)
    expect(canceled.status).toBe(ManifestationStatus.CANCELED)
  })

  it('reopens an answered manifestation administratively', () => {
    const manifestation = buildManifestation({ status: ManifestationStatus.ANSWERED })

    manifestation.transitionStatusAdministratively(ManifestationStatus.IN_ANALYSIS)
    expect(manifestation.status).toBe(ManifestationStatus.IN_ANALYSIS)
  })

  it('blocks reaching ANSWERED via administrative status transition (must go through recordAdministrativeAnswer)', () => {
    const inAnalysis = buildManifestation({ status: ManifestationStatus.IN_ANALYSIS })

    expect(() => {
      inAnalysis.transitionStatusAdministratively(ManifestationStatus.ANSWERED)
    }).toThrow(ManifestationStatusTransitionNotAllowedError)
    expect(inAnalysis.status).toBe(ManifestationStatus.IN_ANALYSIS)
  })

  it('finalizes and cancels manifestations administratively', () => {
    const finalizing = buildManifestation({ status: ManifestationStatus.ANSWERED })
    const canceling = buildManifestation({ status: ManifestationStatus.IN_ANALYSIS })

    finalizing.transitionStatusAdministratively(ManifestationStatus.FINALIZED)
    canceling.transitionStatusAdministratively(ManifestationStatus.CANCELED)

    expect(finalizing.status).toBe(ManifestationStatus.FINALIZED)
    expect(canceling.status).toBe(ManifestationStatus.CANCELED)
  })

  it('refuses transitions out of terminal states', () => {
    const finalized = buildManifestation({ status: ManifestationStatus.FINALIZED })

    expect(() => {
      finalized.transitionStatusAdministratively(ManifestationStatus.IN_ANALYSIS)
    }).toThrow(ManifestationStatusTransitionNotAllowedError)
    expect(finalized.status).toBe(ManifestationStatus.FINALIZED)
  })

  it('refuses transitions to the same status', () => {
    const manifestation = buildManifestation({ status: ManifestationStatus.IN_ANALYSIS })

    expect(() => {
      manifestation.transitionStatusAdministratively(ManifestationStatus.IN_ANALYSIS)
    }).toThrow(ManifestationStatusTransitionNotAllowedError)
    expect(manifestation.status).toBe(ManifestationStatus.IN_ANALYSIS)
  })

  it('refuses in-analysis to finalized transitions', () => {
    const manifestation = buildManifestation({ status: ManifestationStatus.IN_ANALYSIS })

    expect(() => {
      manifestation.transitionStatusAdministratively(ManifestationStatus.FINALIZED)
    }).toThrow(ManifestationStatusTransitionNotAllowedError)
    expect(manifestation.status).toBe(ManifestationStatus.IN_ANALYSIS)
  })

  it('refuses answered to canceled transitions', () => {
    const manifestation = buildManifestation({ status: ManifestationStatus.ANSWERED })

    expect(() => {
      manifestation.transitionStatusAdministratively(ManifestationStatus.CANCELED)
    }).toThrow(ManifestationStatusTransitionNotAllowedError)
    expect(manifestation.status).toBe(ManifestationStatus.ANSWERED)
  })

  it('finalizes by author only from answered manifestations', () => {
    const manifestation = buildManifestation({ status: ManifestationStatus.ANSWERED })

    manifestation.finalizeByAuthor()

    expect(manifestation.status).toBe(ManifestationStatus.FINALIZED)
  })

  it('refuses author finalization from in-analysis manifestations', () => {
    const manifestation = buildManifestation({ status: ManifestationStatus.IN_ANALYSIS })

    expect(() => {
      manifestation.finalizeByAuthor()
    }).toThrow(ManifestationStatusTransitionNotAllowedError)
    expect(manifestation.status).toBe(ManifestationStatus.IN_ANALYSIS)
  })

  it('refuses author finalization from terminal manifestations', () => {
    const finalized = buildManifestation({ status: ManifestationStatus.FINALIZED })
    const canceled = buildManifestation({ status: ManifestationStatus.CANCELED })

    expect(() => {
      finalized.finalizeByAuthor()
    }).toThrow(ManifestationStatusTransitionNotAllowedError)
    expect(() => {
      canceled.finalizeByAuthor()
    }).toThrow(ManifestationStatusTransitionNotAllowedError)
    expect(finalized.status).toBe(ManifestationStatus.FINALIZED)
    expect(canceled.status).toBe(ManifestationStatus.CANCELED)
  })

  it('opens an anonymous manifestation only when an access code hash is provided', () => {
    const manifestation = Manifestation.open({
      protocol: Protocol.create('2026-0001'),
      type: ManifestationType.COMPLAINT,
      campusId: CampusId.create('campus-1'),
      administrativeUnitId: AdministrativeUnitId.create('unit-1'),
      description: ManifestationDescription.create('The service was unavailable during the whole morning.'),
      involvedPeople: null,
      authorUserId: null,
      accessCodeHash: 'hashed-access-code',
    })

    expect(manifestation.isAnonymous()).toBe(true)
    expect(manifestation.accessCodeHash).toBe('hashed-access-code')
  })

  it('refuses to open an anonymous manifestation without an access code hash', () => {
    expect(() => {
      Manifestation.open({
        protocol: Protocol.create('2026-0001'),
        type: ManifestationType.COMPLAINT,
        campusId: CampusId.create('campus-1'),
        administrativeUnitId: AdministrativeUnitId.create('unit-1'),
        description: ManifestationDescription.create('The service was unavailable during the whole morning.'),
        involvedPeople: null,
        authorUserId: null,
        accessCodeHash: null,
      })
    }).toThrow(AnonymousManifestationRequiresAccessCodeError)
  })

  it('opens an identified manifestation without an access code hash', () => {
    const manifestation = Manifestation.open({
      protocol: Protocol.create('2026-0001'),
      type: ManifestationType.COMPLAINT,
      campusId: CampusId.create('campus-1'),
      administrativeUnitId: AdministrativeUnitId.create('unit-1'),
      description: ManifestationDescription.create('The service was unavailable during the whole morning.'),
      involvedPeople: null,
      authorUserId: new UniqueEntityId('user-1'),
      accessCodeHash: null,
    })

    expect(manifestation.isAnonymous()).toBe(false)
    expect(manifestation.accessCodeHash).toBeNull()
  })

  it('refuses to open an identified manifestation carrying an access code hash', () => {
    expect(() => {
      Manifestation.open({
        protocol: Protocol.create('2026-0001'),
        type: ManifestationType.COMPLAINT,
        campusId: CampusId.create('campus-1'),
        administrativeUnitId: AdministrativeUnitId.create('unit-1'),
        description: ManifestationDescription.create('The service was unavailable during the whole morning.'),
        involvedPeople: null,
        authorUserId: new UniqueEntityId('user-1'),
        accessCodeHash: 'hashed-access-code',
      })
    }).toThrow(IdentifiedManifestationCannotHaveAccessCodeError)
  })

  it('refuses to restore an anonymous manifestation without an access code hash', () => {
    expect(() => {
      buildManifestation({ authorUserId: null, accessCodeHash: null })
    }).toThrow(AnonymousManifestationRequiresAccessCodeError)
  })

  it('refuses to restore an identified manifestation carrying an access code hash', () => {
    expect(() => {
      buildManifestation({
        authorUserId: new UniqueEntityId('user-1'),
        accessCodeHash: 'hashed-access-code',
      })
    }).toThrow(IdentifiedManifestationCannotHaveAccessCodeError)
  })
})
