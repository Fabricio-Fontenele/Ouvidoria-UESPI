import { Entity } from './entity.js'
import type { AdministrativeUnitId } from '../value-objects/administrative-unit-id.js'
import type { CampusId } from '../value-objects/campus-id.js'
import type { ManifestationDescription } from '../value-objects/manifestation-description.js'
import type { ManifestationInvolvedPeople } from '../value-objects/manifestation-involved-people.js'
import type { Protocol } from '../value-objects/protocol.js'
import type { UniqueEntityId } from '../value-objects/unique-entity-id.js'

export enum ManifestationType {
  REPORT = 'report',
  COMPLAINT = 'complaint',
  SUGGESTION = 'suggestion',
  COMPLIMENT = 'compliment',
}

export enum ManifestationStatus {
  IN_ANALYSIS = 'in_analysis',
  ANSWERED = 'answered',
  CANCELED = 'canceled',
  FINALIZED = 'finalized',
}

export class ManifestationStatusTransitionNotAllowedError extends Error {
  constructor(current: ManifestationStatus, attempted: ManifestationStatus) {
    super(`Cannot transition manifestation status from ${current} to ${attempted}.`)
    this.name = 'ManifestationStatusTransitionNotAllowedError'
  }
}

export class AnonymousManifestationRequiresAccessCodeError extends Error {
  constructor() {
    super('Anonymous manifestations must be opened with an access code hash.')
    this.name = 'AnonymousManifestationRequiresAccessCodeError'
  }
}

export class IdentifiedManifestationCannotHaveAccessCodeError extends Error {
  constructor() {
    super('Identified manifestations must not carry an access code hash.')
    this.name = 'IdentifiedManifestationCannotHaveAccessCodeError'
  }
}

interface ManifestationProps {
  protocol: Protocol
  type: ManifestationType
  status: ManifestationStatus
  campusId: CampusId
  administrativeUnitId: AdministrativeUnitId
  description: ManifestationDescription
  involvedPeople: ManifestationInvolvedPeople | null
  authorUserId: UniqueEntityId | null
  accessCodeHash: string | null
  createdAt: Date
}

interface OpenManifestationProps {
  protocol: Protocol
  type: ManifestationType
  campusId: CampusId
  administrativeUnitId: AdministrativeUnitId
  description: ManifestationDescription
  involvedPeople: ManifestationInvolvedPeople | null
  authorUserId: UniqueEntityId | null
  accessCodeHash: string | null
  createdAt?: Date
}

export class Manifestation extends Entity<ManifestationProps> {
  private static readonly allowedAdministrativeStatusTransitions: Record<ManifestationStatus, ManifestationStatus[]> = {
    [ManifestationStatus.IN_ANALYSIS]: [ManifestationStatus.ANSWERED, ManifestationStatus.CANCELED],
    [ManifestationStatus.ANSWERED]: [ManifestationStatus.IN_ANALYSIS, ManifestationStatus.FINALIZED],
    [ManifestationStatus.CANCELED]: [],
    [ManifestationStatus.FINALIZED]: [],
  }

  static open(props: OpenManifestationProps, id?: UniqueEntityId): Manifestation {
    Manifestation.validateAccessMode(props.authorUserId, props.accessCodeHash)

    const createdAt = props.createdAt ?? new Date()

    return new Manifestation(
      {
        ...props,
        status: ManifestationStatus.IN_ANALYSIS,
        createdAt,
      },
      id,
    )
  }

  static restore(props: ManifestationProps, id: UniqueEntityId): Manifestation {
    Manifestation.validateAccessMode(props.authorUserId, props.accessCodeHash)

    return new Manifestation(props, id)
  }

  private static validateAccessMode(authorUserId: UniqueEntityId | null, accessCodeHash: string | null): void {
    const isAnonymous = authorUserId === null

    if (isAnonymous && accessCodeHash === null) {
      throw new AnonymousManifestationRequiresAccessCodeError()
    }

    if (!isAnonymous && accessCodeHash !== null) {
      throw new IdentifiedManifestationCannotHaveAccessCodeError()
    }
  }

  canReceiveMessages(): boolean {
    return this.props.status !== ManifestationStatus.CANCELED && this.props.status !== ManifestationStatus.FINALIZED
  }

  isAnonymous(): boolean {
    return this.props.authorUserId === null
  }

  belongsTo(userId: UniqueEntityId): boolean {
    if (this.props.authorUserId === null) {
      return false
    }

    return this.props.authorUserId.equals(userId)
  }

  recordAdministrativeAnswer(): void {
    if (this.props.status === ManifestationStatus.ANSWERED) {
      return
    }

    if (this.props.status !== ManifestationStatus.IN_ANALYSIS) {
      throw new ManifestationStatusTransitionNotAllowedError(this.props.status, ManifestationStatus.ANSWERED)
    }

    this.props.status = ManifestationStatus.ANSWERED
  }

  transitionStatusAdministratively(target: ManifestationStatus): void {
    const allowedTargets = Manifestation.allowedAdministrativeStatusTransitions[this.props.status]

    if (!allowedTargets.includes(target)) {
      throw new ManifestationStatusTransitionNotAllowedError(this.props.status, target)
    }

    this.props.status = target
  }

  finalizeByAuthor(): void {
    if (this.props.status !== ManifestationStatus.ANSWERED) {
      throw new ManifestationStatusTransitionNotAllowedError(this.props.status, ManifestationStatus.FINALIZED)
    }

    this.props.status = ManifestationStatus.FINALIZED
  }

  get protocol(): Protocol {
    return this.props.protocol
  }

  get type(): ManifestationType {
    return this.props.type
  }

  get status(): ManifestationStatus {
    return this.props.status
  }

  get campusId(): CampusId {
    return this.props.campusId
  }

  get administrativeUnitId(): AdministrativeUnitId {
    return this.props.administrativeUnitId
  }

  get description(): ManifestationDescription {
    return this.props.description
  }

  get involvedPeople(): ManifestationInvolvedPeople | null {
    return this.props.involvedPeople
  }

  get authorUserId(): UniqueEntityId | null {
    return this.props.authorUserId
  }

  get accessCodeHash(): string | null {
    return this.props.accessCodeHash
  }

  get createdAt(): Date {
    return this.props.createdAt
  }
}
