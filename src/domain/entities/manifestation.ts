import { Entity } from './entity.js'
import type { AdministrativeUnitId } from '../value-objects/administrative-unit-id.js'
import type { CampusId } from '../value-objects/campus-id.js'
import type { ManifestationDescription } from '../value-objects/manifestation-description.js'
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

interface ManifestationProps {
  protocol: Protocol
  type: ManifestationType
  status: ManifestationStatus
  campusId: CampusId
  administrativeUnitId: AdministrativeUnitId
  description: ManifestationDescription
  authorUserId: UniqueEntityId | null
  createdAt: Date
}

interface OpenManifestationProps {
  protocol: Protocol
  type: ManifestationType
  campusId: CampusId
  administrativeUnitId: AdministrativeUnitId
  description: ManifestationDescription
  authorUserId: UniqueEntityId | null
  createdAt?: Date
}

export class Manifestation extends Entity<ManifestationProps> {
  static open(props: OpenManifestationProps, id?: UniqueEntityId): Manifestation {
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

  get authorUserId(): UniqueEntityId | null {
    return this.props.authorUserId
  }

  get createdAt(): Date {
    return this.props.createdAt
  }
}
